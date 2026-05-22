import { Schema, model, Document } from "mongoose";

export interface IDiscoverShortlist extends Document {
  brandId: string;
  influencerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiscoverShortlistSchema = new Schema<IDiscoverShortlist>(
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
  },
  { timestamps: true }
);

DiscoverShortlistSchema.index({ brandId: 1, influencerId: 1 }, { unique: true });

export default model<IDiscoverShortlist>("DiscoverShortlist", DiscoverShortlistSchema);
