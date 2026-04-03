import { Schema, model, Document } from "mongoose";

export interface IMessage extends Document {
  conversationId: string;
  senderId: string;
  messageType: "text" | "offer" | "counter_offer" | "system";
  text?: string;
  offerData?: {
    campaignTitle?: string;
    deliverableSummary?: string;
    paymentAmount?: number;
    advanceAmount?: number;
    draftDueAt?: Date;
    postAt?: Date;
    hashtags?: string[];
    discountCode?: string;
    note?: string;
  };
  mediaUrl?: string;
  mediaType?: "image" | "video" | "file";
  read: boolean;
  readAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: String,
      required: true,
      index: true, // critical for fast message fetch
    },

    senderId: {
      type: String,
      required: true,
    },

    messageType: {
      type: String,
      enum: ["text", "offer", "counter_offer", "system"],
      default: "text",
      index: true,
    },

    text: {
      type: String,
      trim: true,
    },

    offerData: {
      campaignTitle: { type: String, trim: true, default: "" },
      deliverableSummary: { type: String, trim: true, default: "" },
      paymentAmount: { type: Number, default: 0 },
      advanceAmount: { type: Number, default: 0 },
      draftDueAt: { type: Date, default: null },
      postAt: { type: Date, default: null },
      hashtags: { type: [String], default: [] },
      discountCode: { type: String, trim: true, default: "" },
      note: { type: String, trim: true, default: "" },
    },

    mediaUrl: {
      type: String,
    },

    mediaType: {
      type: String,
      enum: ["image", "video", "file"],
    },

    read: {
      type: Boolean,
      default: false,
      index: true, // for filtering unread messages
    },

    readAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<IMessage>("Message", MessageSchema);
