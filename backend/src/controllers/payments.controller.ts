import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import CampaignModel from "../models/Campaign";
import { Earning } from "../models/Earning";
import { Payment, PaymentStatus } from "../models/Payment";
import PromotionModel from "../models/Promotion";
import UserModel from "../models/Users";
import { getRequestUser } from "../utils/requestUser";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const validStatuses: PaymentStatus[] = ["pending", "processing", "completed", "failed"];
const validMethods = new Set(["direct", "escrow"]);

const getBrandRequesterId = (req: Request, res: Response, brandId?: string) => {
  const requester = getRequestUser(req);
  if (!requester?.id) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return null;
  }
  if (requester.role !== "brand") {
    res.status(403).json({ success: false, error: "Only brands can access payments" });
    return null;
  }
  if (brandId && String(brandId) !== String(requester.id)) {
    res.status(403).json({ success: false, error: "You can only access your own payments" });
    return null;
  }
  return String(requester.id);
};

const getPaymentViewer = (req: Request, res: Response) => {
  const requester = getRequestUser(req);
  if (!requester?.id) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return null;
  }
  if (!["brand", "influencer"].includes(requester.role)) {
    res.status(403).json({ success: false, error: "Role not supported for payments" });
    return null;
  }
  return requester;
};

const formatUserName = (user?: { name?: string; username?: string }) => {
  if (!user) return "Unknown user";
  if (user.name?.trim()) return user.name.trim();
  if (user.username?.trim()) return `@${user.username.trim()}`;
  return "Unknown user";
};

const enrichPayments = async (payments: any[]) => {
  const influencerIds = Array.from(new Set(payments.map((payment) => String(payment.influencerId)).filter(Boolean)));
  const campaignIds = Array.from(new Set(payments.map((payment) => String(payment.campaignId)).filter(Boolean)));
  const promotionIds = Array.from(new Set(payments.map((payment) => String(payment.promotionId || "")).filter(Boolean)));

  const [influencers, campaigns, promotions] = await Promise.all([
    influencerIds.length
      ? UserModel.find({ _id: { $in: influencerIds } }).select("_id name username").lean()
      : Promise.resolve([]),
    campaignIds.length
      ? CampaignModel.find({ _id: { $in: campaignIds } }).select("_id name").lean()
      : Promise.resolve([]),
    promotionIds.length
      ? PromotionModel.find({ _id: { $in: promotionIds } }).select("_id campaignTitle").lean()
      : Promise.resolve([]),
  ]);

  const influencerMap = new Map(influencers.map((user: any) => [String(user._id), user]));
  const campaignMap = new Map(campaigns.map((campaign: any) => [String(campaign._id), campaign]));
  const promotionMap = new Map(promotions.map((promotion: any) => [String(promotion._id), promotion]));

  return payments.map((payment) => {
    const influencer = influencerMap.get(String(payment.influencerId));
    const campaign = campaignMap.get(String(payment.campaignId));
    const promotion = payment.promotionId
      ? promotionMap.get(String(payment.promotionId))
      : undefined;

    return {
      id: String(payment._id),
      brandId: String(payment.brandId),
      influencerId: String(payment.influencerId),
      campaignId: String(payment.campaignId),
      promotionId: payment.promotionId ? String(payment.promotionId) : undefined,
      earningId: String(payment.earningId),
      amount: Number(payment.amount || 0),
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      currency: payment.currency || "USD",
      issuedDate: payment.issuedDate,
      dueDate: payment.dueDate,
      processedDate: payment.processedDate,
      failureReason: payment.failureReason || "",
      notes: payment.notes || "",
      influencerName: formatUserName(influencer as any),
      influencerHandle: influencer?.username ? `@${influencer.username}` : "",
      campaignTitle: promotion?.campaignTitle || campaign?.name || "Campaign",
    };
  });
};

export const getBrandPayments = async (req: Request, res: Response) => {
  try {
    const requestedBrandId = req.params.brandId;
    const brandId = getBrandRequesterId(req, res, requestedBrandId);
    if (!brandId) return;

    const { status, skip = 0, limit = 20, paymentMethod } = req.query;
    const query: Record<string, unknown> = { brandId };

    if (status) {
      const statusValue = String(status) as PaymentStatus;
      if (!validStatuses.includes(statusValue)) {
        return res.status(400).json({ success: false, error: "Invalid payment status" });
      }
      query.status = statusValue;
    }

    if (paymentMethod) {
      const method = String(paymentMethod);
      if (!validMethods.has(method)) {
        return res.status(400).json({ success: false, error: "Invalid payment method" });
      }
      query.paymentMethod = method;
    }

    const skipValue = Math.max(0, parseNumber(skip, 0));
    const limitValue = clamp(parseNumber(limit, 20), 1, 100);

    const [payments, total] = await Promise.all([
      Payment.find(query).sort({ createdAt: -1 }).skip(skipValue).limit(limitValue).lean(),
      Payment.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: await enrichPayments(payments),
      pagination: {
        total,
        skip: skipValue,
        limit: limitValue,
      },
    });
  } catch (error) {
    console.error("Error fetching brand payments:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch payments" });
  }
};

export const getMyBrandPayments = async (req: Request, res: Response) => {
  req.params.brandId = getRequestUser(req)?.id || "";
  return getBrandPayments(req, res);
};

export const getBrandPaymentsSummary = async (req: Request, res: Response) => {
  try {
    const requestedBrandId = req.params.brandId;
    const brandId = getBrandRequesterId(req, res, requestedBrandId);
    if (!brandId) return;

    const payments = await Payment.find({ brandId }).lean();

    const summary = {
      totalSpent: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      byPaymentMethod: {
        direct: 0,
        escrow: 0,
      },
      byStatus: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      },
    };

    payments.forEach((payment) => {
      summary.totalSpent += payment.amount;
      summary.byPaymentMethod[payment.paymentMethod] += payment.amount;
      summary.byStatus[payment.status] += payment.amount;

      if (payment.status === "completed") summary.completed += payment.amount;
      if (payment.status === "processing") summary.processing += payment.amount;
      if (payment.status === "pending") summary.pending += payment.amount;
      if (payment.status === "failed") summary.failed += payment.amount;
    });

    return res.json({ success: true, data: summary });
  } catch (error) {
    console.error("Error fetching payments summary:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch summary" });
  }
};

export const getMyBrandPaymentsSummary = async (req: Request, res: Response) => {
  req.params.brandId = getRequestUser(req)?.id || "";
  return getBrandPaymentsSummary(req, res);
};

export const getPaymentMethodBreakdown = async (req: Request, res: Response) => {
  try {
    const requestedBrandId = req.params.brandId;
    const brandId = getBrandRequesterId(req, res, requestedBrandId);
    if (!brandId) return;

    const payments = await Payment.find({ brandId }).lean();
    const breakdown = {
      direct: { total: 0, count: 0, pending: 0, processing: 0, completed: 0, failed: 0 },
      escrow: { total: 0, count: 0, pending: 0, processing: 0, completed: 0, failed: 0 },
    };

    payments.forEach((payment) => {
      const bucket = breakdown[payment.paymentMethod];
      bucket.total += payment.amount;
      bucket.count += 1;
      bucket[payment.status] += payment.amount;
    });

    return res.json({ success: true, data: breakdown });
  } catch (error) {
    console.error("Error fetching payment breakdown:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch breakdown" });
  }
};

export const getMyPaymentMethodBreakdown = async (req: Request, res: Response) => {
  req.params.brandId = getRequestUser(req)?.id || "";
  return getPaymentMethodBreakdown(req, res);
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const requester = getPaymentViewer(req, res);
    if (!requester) return;

    const { paymentId } = req.params;
    if (!paymentId || !isValidObjectId(paymentId)) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    const payment = await Payment.findById(paymentId).lean();
    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    const canAccess =
      (requester.role === "brand" && String(payment.brandId) === String(requester.id)) ||
      (requester.role === "influencer" && String(payment.influencerId) === String(requester.id));

    if (!canAccess) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    const [enriched] = await enrichPayments([payment]);
    return res.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error fetching payment:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch payment" });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const brandId = getBrandRequesterId(req, res, req.body?.brandId);
    if (!brandId) return;

    const {
      influencerId,
      campaignId,
      promotionId,
      earningId,
      amount,
      paymentMethod,
      dueDate,
      currency = "USD",
      notes,
    } = req.body || {};

    if (!influencerId || !campaignId || !earningId || !amount || !paymentMethod) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const earning = await Earning.findById(earningId);
    if (!earning || String(earning.brandId) !== brandId) {
      return res.status(404).json({ success: false, error: "Linked earning not found" });
    }

    const payment = new Payment({
      brandId,
      influencerId: String(influencerId),
      campaignId: String(campaignId),
      promotionId: promotionId ? String(promotionId) : undefined,
      earningId: String(earningId),
      amount: Number(amount),
      paymentMethod: String(paymentMethod) === "escrow" ? "escrow" : "direct",
      currency: String(currency || "USD"),
      issuedDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "pending",
      notes: String(notes || "").trim(),
    });

    await payment.save();

    const [enriched] = await enrichPayments([payment.toObject()]);
    return res.status(201).json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(500).json({ success: false, error: "Failed to create payment" });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    if (requester.role !== "brand") {
      return res.status(403).json({ success: false, error: "Only brands can update payment status" });
    }

    const { paymentId } = req.params;
    const { status, failureReason, notes } = req.body || {};
    const nextStatus = String(status) as PaymentStatus;

    if (!validStatuses.includes(nextStatus)) {
      return res.status(400).json({ success: false, error: "Valid status is required" });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment || String(payment.brandId) !== String(requester.id)) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    payment.status = nextStatus;
    if (notes !== undefined) payment.notes = String(notes || "").trim();
    if (nextStatus === "completed") {
      payment.processedDate = new Date();
      payment.failureReason = "";
    }
    if (nextStatus === "failed") {
      payment.failureReason = String(failureReason || "").trim();
    }
    await payment.save();

    if (nextStatus === "completed") {
      await Earning.findByIdAndUpdate(payment.earningId, {
        status: "paid",
        paidDate: payment.processedDate || new Date(),
        transactionId: String(payment._id),
        failureReason: "",
      });

      if (payment.promotionId) {
        const promotion = await PromotionModel.findById(payment.promotionId);
        if (promotion) {
          promotion.paymentStatus = "paid";
          if (promotion.status === "metrics_submitted" || promotion.status === "payment_pending") {
            promotion.status = "completed";
          }
          await promotion.save();
        }
      }
    } else if (nextStatus === "failed") {
      await Earning.findByIdAndUpdate(payment.earningId, {
        status: "failed",
        failureReason: payment.failureReason || "Payment failed",
      });
    } else if (nextStatus === "processing") {
      await Earning.findByIdAndUpdate(payment.earningId, {
        status: "ready_for_payment",
        failureReason: "",
      });
    }

    const [enriched] = await enrichPayments([payment.toObject()]);
    return res.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error updating payment:", error);
    return res.status(500).json({ success: false, error: "Failed to update payment" });
  }
};

export const getPaymentsByCampaign = async (req: Request, res: Response) => {
  try {
    const brandId = getBrandRequesterId(req, res);
    if (!brandId) return;

    const { campaignId } = req.params;
    if (!campaignId || !isValidObjectId(campaignId)) {
      return res.status(400).json({ success: false, error: "Invalid campaignId" });
    }

    const payments = await Payment.find({ campaignId, brandId }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: await enrichPayments(payments) });
  } catch (error) {
    console.error("Error fetching campaign payments:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch payments" });
  }
};

export const processPendingPayments = async (req: Request, res: Response) => {
  try {
    const requestedBrandId = req.params.brandId;
    const brandId = getBrandRequesterId(req, res, requestedBrandId);
    if (!brandId) return;

    const { paymentIds } = req.body || {};
    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({ success: false, error: "Payment IDs array is required" });
    }

    const result = await Payment.updateMany(
      {
        _id: { $in: paymentIds },
        brandId,
        status: "pending",
      },
      {
        $set: {
          status: "processing",
          updatedAt: new Date(),
        },
      }
    );

    return res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} payments are now processing`,
      },
    });
  } catch (error) {
    console.error("Error processing payments:", error);
    return res.status(500).json({ success: false, error: "Failed to process payments" });
  }
};
