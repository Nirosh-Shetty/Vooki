import { Schema, model, Document } from "mongoose";

export type PromotionStatus =
  | "requested"
  | "negotiating"
  | "accepted"
  | "content_in_progress"
  | "posted"
  | "metrics_submitted"
  | "payment_pending"
  | "completed";

export interface IDeliverable {
  platform: string;
  format: string;
  quantity: number;
}

export interface IDeliverySubmission {
  proofUrl?: string;
  notes?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewStatus?: "pending" | "approved" | "changes_requested";
  reviewFeedback?: string;
}

export interface IPromotion extends Document {
  sourceInviteId?: string;
  campaignId: string;
  brandId: string;
  influencerId: string;
  campaignTitle: string;
  product: string;
  campaignGoal: "awareness" | "sales" | "launch" | "other";
  deliverables: IDeliverable[];
  draftDueAt: Date;
  postAt: Date;
  requiresDraftApproval: boolean;
  captionRequirements: string;
  brandTagRequired: boolean;
  hashtags: string[];
  linkRequired: boolean;
  discountCode: string;
  allowReuse: boolean;
  exclusivityDays?: number;
  paymentAmount: number;
  advanceAmount: number;
  paymentDueAt: Date;
  paymentMethod: string;
  paymentStatus: "pending" | "paid";
  performance: {
    reach: number;
    views: number;
    engagement: number;
  };
  deliverySubmission?: IDeliverySubmission;
  status: PromotionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverableSchema = new Schema<IDeliverable>(
  {
    platform: { type: String, required: true, trim: true },
    format: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const DeliverySubmissionSchema = new Schema<IDeliverySubmission>(
  {
    proofUrl: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewStatus: {
      type: String,
      enum: ["pending", "approved", "changes_requested"],
      default: null,
    },
    reviewFeedback: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const PromotionSchema = new Schema<IPromotion>(
  {
    sourceInviteId: { type: String, index: true, sparse: true },
    campaignId: { type: String, required: true },
    brandId: { type: String, required: true, index: true },
    influencerId: { type: String, required: true, index: true },
    campaignTitle: { type: String, required: true, trim: true, maxlength: 140 },
    product: { type: String, required: true, trim: true, maxlength: 140 },
    campaignGoal: {
      type: String,
      enum: ["awareness", "sales", "launch", "other"],
      default: "awareness",
    },
    deliverables: { type: [DeliverableSchema], default: [] },
    draftDueAt: { type: Date, required: true },
    postAt: { type: Date, required: true },
    requiresDraftApproval: { type: Boolean, default: true },
    captionRequirements: { type: String, trim: true, default: "" },
    brandTagRequired: { type: Boolean, default: false },
    hashtags: { type: [String], default: [] },
    linkRequired: { type: Boolean, default: false },
    discountCode: { type: String, trim: true, default: "" },
    allowReuse: { type: Boolean, default: false },
    exclusivityDays: { type: Number, min: 0 },
    paymentAmount: { type: Number, required: true, min: 0 },
    advanceAmount: { type: Number, default: 0, min: 0 },
    paymentDueAt: { type: Date, required: true },
    paymentMethod: { type: String, trim: true, default: "" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
      index: true,
    },
    performance: {
      reach: { type: Number, default: 0, min: 0 },
      views: { type: Number, default: 0, min: 0 },
      engagement: { type: Number, default: 0, min: 0 },
    },
    deliverySubmission: {
      type: DeliverySubmissionSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: [
        "requested",
        "negotiating",
        "accepted",
        "content_in_progress",
        "posted",
        "metrics_submitted",
        "payment_pending",
        "completed",
      ],
      default: "requested",
      index: true,
    },
  },
  { timestamps: true }
);

PromotionSchema.index({ campaignId: 1, influencerId: 1 });
PromotionSchema.index({ sourceInviteId: 1 }, { unique: true, sparse: true });
PromotionSchema.index({ brandId: 1, status: 1, createdAt: -1 });
PromotionSchema.index({ influencerId: 1, status: 1, createdAt: -1 });

export default model<IPromotion>("Promotion", PromotionSchema);
