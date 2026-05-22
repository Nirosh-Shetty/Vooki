import { Schema, model, Document } from "mongoose";

export interface IConversation extends Document {
  participants: string[]; // List of user IDs
  lastMessage?: string;   // Cached last message text
  lastMessageId?: string; // Reference to last message document
  lastMessageAt?: Date;   // Timestamp of last message
  threadType: "direct" | "campaign" | "collaboration";
  campaignId?: string;
  promotionId?: string;
  campaignTitle?: string;
  status: "active" | "archived" | "closed";
  updatedAt: Date;
  createdAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: {
      type: [String],
      required: true,
      validate: (arr: string[]) => arr.length >= 2, // must have two users minimum
    },

    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageId: {
      type: String,
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    threadType: {
      type: String,
      enum: ["direct", "campaign", "collaboration"],
      default: "direct",
      index: true,
    },

    campaignId: {
      type: String,
      default: "",
      index: true,
    },

    promotionId: {
      type: String,
      default: "",
      index: true,
    },

    campaignTitle: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "archived", "closed"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

// Index to quickly find conversations between specific users
ConversationSchema.index({ participants: 1 });
// Index for filtering active conversations
ConversationSchema.index({ participants: 1, status: 1 });
ConversationSchema.index({ participants: 1, promotionId: 1 });
ConversationSchema.index({ participants: 1, campaignId: 1, promotionId: 1 });
// Index for sorting by last message
ConversationSchema.index({ lastMessageAt: -1 });

export default model<IConversation>("Conversation", ConversationSchema);
