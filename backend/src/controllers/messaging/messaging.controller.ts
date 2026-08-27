import { Request, Response } from "express";
import Conversation from "../../models/Conversation";
import Message from "../../models/Message";
import UserModel from "../../models/Users";
import DiscoverInviteModel from "../../models/DiscoverInvite";
import PromotionModel from "../../models/Promotion";
import { getRequestUserId } from "../../utils/requestUser";
import {
  findOrCreateDirectConversation,
  reconcileDirectConversationsForUser,
  cleanupEmptyDirectConversations,
} from "../../utils/directConversation";
import { canInitiateConversation } from "../../utils/messagingAuthorization";

// Get all conversations for a user with pagination
export const getConversations = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { page = 1, limit = 20, status = "active" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    await cleanupEmptyDirectConversations(userId);
    await reconcileDirectConversationsForUser(userId);

    const conversations = await Conversation.find({
      participants: userId,
      status,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const enrichedConversations = await Promise.all(
      conversations.map(async (conv: any) => {
        const otherParticipantId = conv.participants.find(
          (id: string) => id !== userId
        );
        const otherUserDoc = await UserModel.findById(otherParticipantId, {
          name: 1,
          username: 1,
          avatar: 1,
          profilePicture: 1,
          role: 1,
        }).lean();

        const otherUser = otherUserDoc
          ? {
              ...otherUserDoc,
              profilePicture: otherUserDoc.avatar || (otherUserDoc as any).profilePicture || null,
            }
          : null;

        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: userId },
          read: false,
        });

        // Find associated invites if this is an invite thread
        const invites = await DiscoverInviteModel.find({ conversationId: String(conv._id) })
          .select('_id status campaignId')
          .lean();

        const formattedInvites = invites.reduce((acc: any, inv: any) => {
          acc[String(inv._id)] = {
            id: String(inv._id),
            status: inv.status,
            campaignId: inv.campaignId,
          };
          return acc;
        }, {});

        return {
          id: (conv._id as any).toString(),
          participants: conv.participants,
          lastMessage: conv.lastMessage || "",
          lastMessageAt: conv.lastMessageAt,
          status: conv.status,
          unreadCount,
          otherUser,
          invites: formattedInvites,
        };
      })
    );

    return res.status(200).json({
      conversations: enrichedConversations,
      page,
      limit,
      total: await Conversation.countDocuments({
        participants: userId,
        status,
      }),
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get messages from a conversation with pagination
export const getMessages = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const messages = await Message.find({
      conversationId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Mark messages from other participants as read when reading messages
    const updateResult = await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    if (updateResult.modifiedCount > 0) {
      const io = req.app.get("io");
      if (io) {
        const roomName = `conversation:${conversationId}`;
        io.to(roomName).emit("messages-read", {
          conversationId,
          readBy: userId,
          readAt: new Date(),
        });
      }
    }

    const orderedMessages = messages.reverse();

    const enrichedMessages = await Promise.all(
      orderedMessages.map(async (msg: any) => {
        const senderDoc = await UserModel.findById(msg.senderId, {
          name: 1,
          username: 1,
          avatar: 1,
          profilePicture: 1,
        }).lean();

        const sender = senderDoc
          ? {
              ...senderDoc,
              profilePicture: senderDoc.avatar || (senderDoc as any).profilePicture || null,
            }
          : null;

        const isMe = String(msg.senderId) === String(userId);
        const isRead = isMe ? msg.read : true; // Messages read by current user

        return {
          id: (msg._id as any).toString(),
          sender,
          senderId: msg.senderId,
          messageType: msg.messageType || "text",
          text: msg.text,
          offerData: msg.offerData || null,
          mediaUrl: msg.mediaUrl,
          mediaType: msg.mediaType,
          read: isRead,
          readAt: msg.readAt || (isRead ? new Date() : undefined),
          createdAt: msg.createdAt,
        };
      })
    );

    return res.status(200).json({
      messages: enrichedMessages,
      page,
      limit,
      total: await Message.countDocuments({
        conversationId,
        isDeleted: false,
      }),
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get or Create a conversation with a specific user
export const getOrCreateConversation = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { otherUserId, campaignId, promotionId, campaignTitle } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ message: "otherUserId is required" });
    }

    // Role-based validation (Rule 1 & 2)
    const auth = await canInitiateConversation(userId, otherUserId);
    if (!auth.allowed) {
      return res.status(403).json({ message: auth.reason });
    }

    let conversation;

    if (!campaignId && !promotionId) {
      conversation = await findOrCreateDirectConversation(
        userId,
        otherUserId
      );
    } else {
      conversation = await Conversation.findOne({
        participants: { $all: [userId, otherUserId] },
        threadType: promotionId ? "collaboration" : "campaign",
        ...(campaignId ? { campaignId } : {}),
        ...(promotionId ? { promotionId } : {}),
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [userId, otherUserId],
          threadType: promotionId ? "collaboration" : "campaign",
          campaignId: campaignId || "",
          promotionId: promotionId || "",
          campaignTitle: campaignTitle || "",
          initiatedByRole: auth.requesterRole || "brand",
          status: "active",
        });
        await conversation.save();
      }
    }

    // Fetch other user profile
    const otherUserDoc = await UserModel.findById(otherUserId, {
      name: 1,
      username: 1,
      avatar: 1,
      profilePicture: 1,
      role: 1,
    }).lean();

    const otherUser = otherUserDoc
      ? {
          ...otherUserDoc,
          profilePicture: otherUserDoc.avatar || (otherUserDoc as any).profilePicture || null,
        }
      : null;

    const unreadCount = await Message.countDocuments({
      conversationId: conversation._id,
      senderId: otherUserId,
      read: false,
    });

    return res.status(200).json({
      conversation: {
        id: (conversation._id as any).toString(),
        participants: conversation.participants,
        lastMessage: conversation.lastMessage || "",
        lastMessageAt: conversation.lastMessageAt,
        status: conversation.status,
        unreadCount,
        otherUser,
      },
    });
  } catch (error) {
    console.error("Error getting/creating conversation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updateResult = await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    const io = req.app.get("io");
    if (io) {
      const roomName = `conversation:${conversationId}`;
      io.to(roomName).emit("messages-read", {
        conversationId,
        readBy: userId,
        readAt: new Date(),
      });
    }

    return res.status(200).json({
      message: "Messages marked as read",
      updatedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Search conversations and messages
export const searchMessaging = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { query, type = "all" } = req.query;
    if (!query) {
      return res.status(400).json({ message: "query is required" });
    }

    const searchQuery = String(query);
    const results: any = {};

    if (type === "all" || type === "messages") {
      const messages = await Message.find({
        $text: { $search: searchQuery },
        isDeleted: false,
      })
        .limit(10)
        .lean();

      const filteredMessages = await Promise.all(
        messages.map(async (msg) => {
          const conv = await Conversation.findById(msg.conversationId).lean();
          if (conv && conv.participants.includes(userId)) {
            return msg;
          }
          return null;
        })
      );

      results.messages = filteredMessages.filter((m) => m !== null);
    }

    if (type === "all" || type === "users") {
      const requester = await UserModel.findById(userId, { role: 1 }).lean();

      if (requester?.role === "influencer") {
        // Creators cannot search other creators (Rule 3)
        // Creators can only find brands that sent them an invite or collaboration
        const [invites, promotions] = await Promise.all([
          DiscoverInviteModel.find({ influencerId: userId }).select("brandId").lean(),
          PromotionModel.find({ influencerId: userId }).select("brandId").lean(),
        ]);
        const allowedBrandIds = Array.from(
          new Set([
            ...invites.map((i) => String(i.brandId)),
            ...promotions.map((p) => String(p.brandId)),
          ])
        );

        const users = await UserModel.find(
          {
            _id: { $in: allowedBrandIds },
            role: "brand",
            $or: [
              { name: { $regex: searchQuery, $options: "i" } },
              { username: { $regex: searchQuery, $options: "i" } },
            ],
          },
          {
            name: 1,
            username: 1,
            avatar: 1,
            profilePicture: 1,
            role: 1,
          }
        )
          .limit(10)
          .lean();

        results.users = users.map((u: any) => ({
          ...u,
          profilePicture: u.avatar || u.profilePicture || null,
        }));
      } else {
        // Brands and managers can search for creators and users
        const users = await UserModel.find(
          {
            $or: [
              { name: { $regex: searchQuery, $options: "i" } },
              { username: { $regex: searchQuery, $options: "i" } },
            ],
            _id: { $ne: userId },
          },
          {
            name: 1,
            username: 1,
            avatar: 1,
            profilePicture: 1,
            role: 1,
          }
        )
          .limit(10)
          .lean();

        results.users = users.map((u: any) => ({
          ...u,
          profilePicture: u.avatar || u.profilePicture || null,
        }));
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error searching messaging:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Archive conversation
export const archiveConversation = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    conversation.status = "archived";
    await conversation.save();

    return res.status(200).json({ message: "Conversation archived" });
  } catch (error) {
    console.error("Error archiving conversation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete an empty direct conversation if no message was sent
export const deleteEmptyConversation = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { conversationId } = req.params;
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const msgCount = await Message.countDocuments({ conversationId, isDeleted: false });
    const inviteCount = await DiscoverInviteModel.countDocuments({ conversationId: String(conversationId) });

    if (msgCount === 0 && inviteCount === 0 && !conversation.campaignId && !conversation.promotionId) {
      await conversation.deleteOne();
      return res.status(200).json({ success: true, message: "Empty conversation deleted" });
    }

    return res.status(200).json({ success: false, message: "Conversation is not empty" });
  } catch (error) {
    console.error("Error deleting empty conversation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
