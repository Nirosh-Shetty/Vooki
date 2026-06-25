import { Schema, model, Document } from "mongoose";

export type CollaborationType =
  | "sponsored_post"
  | "affiliate"
  | "ambassador"
  | "ugc"
  | "event"
  | "long_term";

export type CompensationType = "fixed" | "range";

export interface IDeliverable {
  platform: string; // "instagram", "tiktok", "youtube"
  format: string; // "reel", "story", "post", "video", "carousel"
  quantity: number;
  description?: string;
}

export interface ICompensation {
  type: "fixed" | "range";
  amount?: number; // For fixed
  minAmount?: number; // For range
  maxAmount?: number; // For range
  currency: string; // "INR", "USD"
}

export interface ITimeline {
  postingStartDate: Date;
  postingEndDate: Date;
  draftDueDate?: Date;
  responseDeadline: Date; // When creator must respond to this invite
}

export interface ICounterOffer {
  _id?: string;
  createdBy: "brand" | "creator";
  createdAt?: Date;
  deliverables?: IDeliverable[];
  compensation?: ICompensation;
  timeline?: ITimeline;
  message?: string;
}

export interface IDiscoverInvite extends Document {
  brandId: string;
  influencerId: string;
  campaignId: string;
  campaignTitle?: string;
  note?: string;

  // Collaboration Details
  collaborationType?: CollaborationType;
  deliverables?: IDeliverable[];
  timeline?: ITimeline;
  compensation?: ICompensation;
  brandMessage?: string;

  // Negotiation Tracking
  status: "pending" | "counter_offered" | "accepted" | "declined";
  counterOffers: ICounterOffer[]; // History of all counter offers
  activeCounterOffer?: ICounterOffer; // Most recent active counter offer

  // Metadata
  conversationId?: string; // Links to chat thread once opened
  promotionId?: string; // Links to Promotion once accepted
  declineReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const DeliverableSchema = new Schema<IDeliverable>(
  {
    platform: { type: String, required: true, trim: true },
    format: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    description: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const CompensationSchema = new Schema<ICompensation>(
  {
    type: { type: String, enum: ["fixed", "range"], required: true },
    amount: { type: Number, min: 0 },
    minAmount: { type: Number, min: 0 },
    maxAmount: { type: Number, min: 0 },
    currency: { type: String, default: "INR", maxlength: 3 },
  },
  { _id: false }
);

const TimelineSchema = new Schema<ITimeline>(
  {
    postingStartDate: { type: Date, required: true },
    postingEndDate: { type: Date, required: true },
    draftDueDate: { type: Date },
    responseDeadline: { type: Date, required: true },
  },
  { _id: false }
);

const CounterOfferSchema = new Schema<ICounterOffer>(
  {
    createdBy: { type: String, enum: ["brand", "creator"], required: true },
    deliverables: { type: [DeliverableSchema], default: [] },
    compensation: { type: CompensationSchema },
    timeline: { type: TimelineSchema },
    message: { type: String, trim: true, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: true }
);

const DiscoverInviteSchema = new Schema<IDiscoverInvite>(
  {
    brandId: {
      type: String,
      required: true,
      index: true,
    },
    influencerId: {
      type: String,
      required: true,
      index: true,
    },
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    campaignTitle: {
      type: String,
      required: false,
      trim: true,
      maxlength: 140,
      default: "",
    },

    // Collaboration Details
    collaborationType: {
      type: String,
      enum: [
        "sponsored_post",
        "affiliate",
        "ambassador",
        "ugc",
        "event",
        "long_term",
      ],
      required: false,
    },
    deliverables: {
      type: [DeliverableSchema],
      required: false,
      default: [],
      validate: {
        validator: (arr: any[]) => arr.length === 0 || arr.every((item) => item && item.platform && item.format && item.quantity > 0),
        message: "Deliverables must be a non-empty array of valid deliverables when provided.",
      },
    },
    timeline: {
      type: TimelineSchema,
      required: false,
    },
    compensation: {
      type: CompensationSchema,
      required: false,
    },
    brandMessage: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    // Negotiation Tracking
    status: {
      type: String,
      enum: ["pending", "counter_offered", "accepted", "declined"],
      default: "pending",
      index: true,
    },
    counterOffers: {
      type: [CounterOfferSchema],
      default: [],
    },
    activeCounterOffer: {
      type: CounterOfferSchema,
      default: null,
    },

    // Metadata
    conversationId: {
      type: String,
      index: true,
      sparse: true,
    },
    promotionId: {
      type: String,
      index: true,
      sparse: true,
    },
    declineReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

DiscoverInviteSchema.index({
  brandId: 1,
  influencerId: 1,
  campaignId: 1,
  status: 1,
});
DiscoverInviteSchema.index({ influencerId: 1, status: 1 }); // For creator's invite feed
DiscoverInviteSchema.index({ brandId: 1, status: 1 }); // For brand's invite tracking

export default model<IDiscoverInvite>("DiscoverInvite", DiscoverInviteSchema);
