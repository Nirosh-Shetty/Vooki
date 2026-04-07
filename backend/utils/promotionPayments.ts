import { Earning, IEarning } from "../models/Earning";
import { Payment, IPayment } from "../models/Payment";
import { IPromotion } from "../models/Promotion";

type SyncPromotionPaymentOptions = {
  ensurePendingRecords?: boolean;
  markAsPaid?: boolean;
};

const normalizePaymentMethod = (paymentMethod?: string): "direct" | "escrow" =>
  paymentMethod === "escrow" ? "escrow" : "direct";

const buildDescription = (promotion: IPromotion) =>
  `${promotion.campaignTitle || "Campaign"} collaboration payout`;

export const validatePromotionPaymentTerms = (
  promotion: Pick<IPromotion, "paymentAmount" | "paymentDueAt" | "paymentMethod">
) => {
  if (!Number.isFinite(Number(promotion.paymentAmount)) || Number(promotion.paymentAmount) <= 0) {
    return "Set a payment amount greater than 0 before moving to payout."
  }

  const dueDate = new Date(promotion.paymentDueAt)
  if (Number.isNaN(dueDate.getTime())) {
    return "Set a valid payment due date before moving to payout."
  }

  return null
}

export const getPromotionFinancialRecords = async (promotionId: string) => {
  const [earning, payment] = await Promise.all([
    Earning.findOne({ promotionId }).lean(),
    Payment.findOne({ promotionId }).lean(),
  ]);

  return { earning, payment };
}

export const syncPromotionFinancialRecords = async (
  promotion: IPromotion,
  options: SyncPromotionPaymentOptions = {}
) => {
  const validationError = validatePromotionPaymentTerms(promotion);
  if (validationError) {
    throw new Error(validationError);
  }

  const promotionId = String(promotion._id);
  const paymentMethod = normalizePaymentMethod(promotion.paymentMethod);
  const shouldMarkAsPaid = Boolean(options.markAsPaid || promotion.paymentStatus === "paid");
  const shouldCreatePendingRecords = Boolean(
    options.ensurePendingRecords ||
      shouldMarkAsPaid ||
      promotion.status === "payment_pending" ||
      promotion.status === "completed"
  );
  const earningStatus: IEarning["status"] = shouldMarkAsPaid
    ? "paid"
    : shouldCreatePendingRecords
      ? "ready_for_payment"
      : "pending";

  const baseEarningUpdate = {
    influencerId: String(promotion.influencerId),
    brandId: String(promotion.brandId),
    campaignId: String(promotion.campaignId),
    promotionId,
    amount: Number(promotion.paymentAmount || 0),
    paymentMethod,
    currency: "USD",
    description: buildDescription(promotion),
    dueDate: new Date(promotion.paymentDueAt),
    status: earningStatus,
    failureReason: "",
  };

  if (!shouldCreatePendingRecords) {
    const existingEarning = await Earning.findOne({ promotionId });
    if (!existingEarning) {
      return { earning: null, payment: null };
    }

    if (existingEarning.status !== "paid") {
      Object.assign(existingEarning, baseEarningUpdate);
      await existingEarning.save();
    }

    const existingPayment = await Payment.findOne({ promotionId });
    if (existingPayment && existingPayment.status !== "completed") {
      existingPayment.amount = Number(promotion.paymentAmount || 0);
      existingPayment.paymentMethod = paymentMethod;
      existingPayment.dueDate = new Date(promotion.paymentDueAt);
      existingPayment.notes = buildDescription(promotion);
      await existingPayment.save();
    }

    return { earning: existingEarning, payment: existingPayment };
  }

  const earning = await Earning.findOneAndUpdate(
    { promotionId },
    {
      $set: {
        ...baseEarningUpdate,
        paidDate: shouldMarkAsPaid ? new Date() : undefined,
        transactionId: shouldMarkAsPaid ? promotionId : undefined,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const paymentStatus: IPayment["status"] = shouldMarkAsPaid ? "completed" : "pending";
  const payment = await Payment.findOneAndUpdate(
    { promotionId },
    {
      $set: {
        brandId: String(promotion.brandId),
        influencerId: String(promotion.influencerId),
        campaignId: String(promotion.campaignId),
        promotionId,
        earningId: String(earning._id),
        amount: Number(promotion.paymentAmount || 0),
        paymentMethod,
        currency: "USD",
        dueDate: new Date(promotion.paymentDueAt),
        notes: buildDescription(promotion),
        status: paymentStatus,
        processedDate: shouldMarkAsPaid ? new Date() : undefined,
      },
      $setOnInsert: {
        issuedDate: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return { earning, payment };
};
