import Message from "../models/Message";
import Conversation from "../models/Conversation";
import UserModel from "../models/Users";

type OfferMessageData = {
  campaignId?: string;
  promotionId?: string;
  campaignTitle?: string;
  deliverableSummary?: string;
  paymentAmount?: number;
  advanceAmount?: number;
  draftDueAt?: string | Date | null;
  postAt?: string | Date | null;
  hashtags?: string[];
  discountCode?: string;
  note?: string;
};

const normalizeOfferData = (offerData?: OfferMessageData | null) => {
  if (!offerData) return undefined;

  const toDateValue = (value?: string | Date | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  return {
    campaignId: String(offerData.campaignId || "").trim(),
    promotionId: String(offerData.promotionId || "").trim(),
    campaignTitle: String(offerData.campaignTitle || "").trim(),
    deliverableSummary: String(offerData.deliverableSummary || "").trim(),
    paymentAmount:
      typeof offerData.paymentAmount === "number" && Number.isFinite(offerData.paymentAmount)
        ? offerData.paymentAmount
        : 0,
    advanceAmount:
      typeof offerData.advanceAmount === "number" && Number.isFinite(offerData.advanceAmount)
        ? offerData.advanceAmount
        : 0,
    draftDueAt: toDateValue(offerData.draftDueAt),
    postAt: toDateValue(offerData.postAt),
    hashtags: Array.isArray(offerData.hashtags)
      ? offerData.hashtags.map((tag) => String(tag || "").trim()).filter(Boolean)
      : [],
    discountCode: String(offerData.discountCode || "").trim(),
    note: String(offerData.note || "").trim(),
  };
};

const buildStructuredMessagePreview = (
  messageType: "text" | "offer" | "counter_offer" | "system",
  offerData?: ReturnType<typeof normalizeOfferData>
) => {
  const title = offerData?.campaignTitle ? ` for ${offerData.campaignTitle}` : "";
  if (messageType === "offer") return `Shared an offer${title}`;
  if (messageType === "counter_offer") return `Requested changes${title}`;
  if (messageType === "system") return offerData?.note || "Shared a collaboration update";
  return "";
};

export const handleMessaging = (
  io: any,
  socket: any,
  userId: string
) => {
  // Join conversation room
  socket.on(
    "join-conversation",
    async (data: { conversationId: string }, callback?: (arg0: any) => void) => {
      try {
        const { conversationId } = data;

        // Verify user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
          return callback?.({
            success: false,
            message: "Unauthorized",
          });
        }

        // Join socket room for this conversation
        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);

        // Get unread count
        const unreadCount = await Message.countDocuments({
          conversationId,
          senderId: { $ne: userId },
          read: false,
        });

        callback?.({
          success: true,
          roomName,
          unreadCount,
        });
      } catch (error) {
        console.error("Error joining conversation:", error);
        callback?.({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // Leave conversation room
  socket.on("leave-conversation", (data: { conversationId: string }) => {
    const { conversationId } = data;
    const roomName = `conversation:${conversationId}`;
    socket.leave(roomName);
  });

  // Send message
  socket.on(
    "send-message",
    async (
      data: {
        conversationId: string;
        text?: string;
        messageType?: "text" | "offer" | "counter_offer" | "system";
        offerData?: OfferMessageData;
        mediaUrl?: string;
        mediaType?: "image" | "video" | "file";
      },
      callback?: (arg0: any) => void
    ) => {
      try {
        const {
          conversationId,
          text,
          messageType = "text",
          offerData,
          mediaUrl,
          mediaType,
        } = data;
        console.log("Backend received send-message:", {
          conversationId,
          text,
          messageType,
          userId,
        });

        const normalizedOfferData = normalizeOfferData(offerData);
        const normalizedText = String(text || "").trim();
        const structuredPreview = buildStructuredMessagePreview(messageType, normalizedOfferData);

        if (!normalizedText && !mediaUrl && !normalizedOfferData) {
          return callback?.({
            success: false,
            message: "Message text or media is required",
          });
        }

        // Verify user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
          return callback?.({
            success: false,
            message: "Unauthorized",
          });
        }

        // Create message
        const message = new Message({
          conversationId,
          senderId: userId,
          messageType,
          text: normalizedText || structuredPreview || null,
          offerData: normalizedOfferData || undefined,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          read: false,
        });

        await message.save();

        // Update conversation's last message preview for the list UI.
        conversation.lastMessage = message.text || (mediaType ? `[${mediaType}]` : "New message");
        conversation.lastMessageId = (message._id as any).toString();
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Get sender details
        const sender = await UserModel.findById(userId, {
          name: 1,
          username: 1,
          profilePicture: 1,
        }).lean();

        const messageData = {
          id: (message._id as any).toString(),
          sender,
          senderId: userId,
          text: message.text,
          messageType: message.messageType || "text",
          offerData: message.offerData || null,
          mediaUrl: message.mediaUrl,
          mediaType: message.mediaType,
          read: false,
          readAt: null,
          createdAt: message.createdAt,
        };

        // Broadcast to conversation room
        const roomName = `conversation:${conversationId}`;
        console.log("Broadcasting to room:", roomName, "with message:", messageData.text);
        io.to(roomName).emit("message-received", messageData);

        callback?.({
          success: true,
          message: messageData,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        callback?.({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // Mark messages as read
  socket.on(
    "mark-as-read",
    async (data: { conversationId: string }, callback?: (arg0: any) => void) => {
      try {
        const { conversationId } = data;

        // Verify user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
          return callback?.({
            success: false,
            message: "Unauthorized",
          });
        }

        // Update messages to read
        const result = await Message.updateMany(
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

        // Broadcast read status to conversation room
        const roomName = `conversation:${conversationId}`;
        io.to(roomName).emit("messages-read", {
          conversationId,
          readBy: userId,
          readAt: new Date(),
        });

        callback?.({
          success: true,
          updatedCount: result.modifiedCount,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
        callback?.({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );
};
