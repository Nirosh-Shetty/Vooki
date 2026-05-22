import { Request, Response } from "express";
import Conversation from "../../models/Conversation";
import Message from "../../models/Message";
import UserModel from "../../models/Users";
import { getRequestUserId } from "../../utils/requestUser";
import {
  findOrCreateDirectConversation,
  reconcileDirectConversationsForUser,
} from "../../utils/directConversation";

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

    await reconcileDirectConversationsForUser(userId);

    const conversations = await Conversation.find({
      participants: userId,
      status,
    })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const enrichedConversations = await Promise.all(
      conversations.map(async (conv: any) => {
        const otherParticipantId = conv.participants.find(
          (id: string) => id !== userId
        );
        const otherUser = await UserModel.findById(otherParticipantId, {
          name: 1,
          username: 1,
          profilePicture: 1,
          role: 1,
        }).lean();

        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: userId },
          read: false,
        });

        return {
          id: (conv._id as any).toString(),
          participants: conv.participants,
          lastMessage: conv.lastMessage || "",
          lastMessageAt: conv.lastMessageAt,
          status: conv.status,
          unreadCount,
          otherUser,
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
    console.error("Error fetching conversations:", error);
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

    const orderedMessages = messages.reverse();

    const enrichedMessages = await Promise.all(
      orderedMessages.map(async (msg: any) => {
        const sender = await UserModel.findById(msg.senderId, {
          name: 1,
          username: 1,
          profilePicture: 1,
        }).lean();

        return {
          id: (msg._id as any).toString(),
          sender,
          senderId: msg.senderId,
          messageType: msg.messageType || "text",
          text: msg.text,
          offerData: msg.offerData || null,
          mediaUrl: msg.mediaUrl,
          mediaType: msg.mediaType,
          read: msg.read,
          readAt: msg.readAt,
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

// Get or create conversation with another user
export const getOrCreateConversation = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { otherUserId } = req.body;
    if (!otherUserId) {
      return res.status(400).json({ message: "otherUserId is required" });
    }

    const conversation = await findOrCreateDirectConversation(userId, String(otherUserId));
    if (conversation.status !== "active") {
      conversation.status = "active";
      await conversation.save();
    }

    const otherUser = await UserModel.findById(otherUserId, {
      name: 1,
      username: 1,
      profilePicture: 1,
      role: 1,
    }).lean();

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

    await Message.updateMany(
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

    return res.status(200).json({ message: "Messages marked as read" });
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
          profilePicture: 1,
          role: 1,
        }
      )
        .limit(10)
        .lean();

      results.users = users;
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
