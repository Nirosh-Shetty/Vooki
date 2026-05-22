import { Schema, model, Document } from "mongoose";

export type CampaignStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived";
export type CampaignPriority = "low" | "medium" | "high";

export interface ICampaign extends Document {
  brandId: string;
  name: string;
  objective: string;
  niche: string;
  status: CampaignStatus;
  priority: CampaignPriority;
  budgetTotal: number;
  budgetSpent: number;
  currency: string;
  roi: number;
  startDate: Date;
  endDate: Date;
  invitedCreators: number;
  acceptedCreators: number;
  deliverablesDone: number;
  deliverablesTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    brandId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    objective: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    niche: {
      type: String,
      trim: true,
      default: "General",
      maxlength: 80,
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed", "archived"],
      default: "draft",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    budgetTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    budgetSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      default: "USD",
      maxlength: 8,
    },
    roi: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    invitedCreators: {
      type: Number,
      default: 0,
      min: 0,
    },
    acceptedCreators: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliverablesDone: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliverablesTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

CampaignSchema.index({ brandId: 1, updatedAt: -1 });

export default model<ICampaign>("Campaign", CampaignSchema);
