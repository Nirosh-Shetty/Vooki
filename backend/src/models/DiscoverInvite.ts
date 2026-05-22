import { Schema, model, Document } from "mongoose";

export interface IDiscoverInvite extends Document {
  brandId: string;
  influencerId: string;
  campaignId: string;
  campaignLabel?: string;
  note?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

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
    },
    campaignLabel: {
      type: String,
      trim: true,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

DiscoverInviteSchema.index({ brandId: 1, influencerId: 1, campaignId: 1, status: 1 });

export default model<IDiscoverInvite>("DiscoverInvite", DiscoverInviteSchema);
