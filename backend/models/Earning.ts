import { Schema, model, Document } from "mongoose";

export type EarningStatus = "pending" | "ready_for_payment" | "paid" | "failed";
export type PaymentMethod = "direct" | "escrow";

export interface IEarning extends Document {
  influencerId: string;
  campaignId: string;
  brandId: string;
  promotionId?: string;
  amount: number;
  status: EarningStatus;
  paymentMethod: PaymentMethod;
  currency: string;
  description: string;
  dueDate: Date;
  paidDate?: Date;
  transactionId?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EarningSchema = new Schema<IEarning>(
  {
    influencerId: {
      type: String,
      required: true,
      index: true,
    },
    campaignId: {
      type: String,
      required: true,
    },
    brandId: {
      type: String,
      required: true,
      index: true,
    },
    promotionId: {
      type: String,
      index: true,
      sparse: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "ready_for_payment", "paid", "failed"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["direct", "escrow"],
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    description: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    paidDate: Date,
    transactionId: String,
    failureReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
EarningSchema.index({ influencerId: 1, status: 1 });
EarningSchema.index({ brandId: 1, status: 1 });
EarningSchema.index({ campaignId: 1 });
EarningSchema.index({ promotionId: 1 }, { unique: true, sparse: true });
EarningSchema.index({ createdAt: -1 });

export const Earning = model<IEarning>("Earning", EarningSchema);
