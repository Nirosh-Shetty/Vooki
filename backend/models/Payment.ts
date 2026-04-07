import { Schema, model, Document } from "mongoose";

export type PaymentStatus = "pending" | "processing" | "completed" | "failed";
export type PaymentMethod = "direct" | "escrow";

export interface IPayment extends Document {
  brandId: string;
  influencerId: string;
  campaignId: string;
  earningId: string;
  promotionId?: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  currency: string;
  issuedDate: Date;
  dueDate: Date;
  processedDate?: Date;
  failureReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
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
    earningId: {
      type: String,
      required: true,
      unique: true,
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
      enum: ["pending", "processing", "completed", "failed"],
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
    issuedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    processedDate: Date,
    failureReason: String,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PaymentSchema.index({ brandId: 1, status: 1 });
PaymentSchema.index({ influencerId: 1, status: 1 });
PaymentSchema.index({ campaignId: 1 });
PaymentSchema.index({ promotionId: 1 }, { sparse: true });
PaymentSchema.index({ createdAt: -1 });

export const Payment = model<IPayment>("Payment", PaymentSchema);
