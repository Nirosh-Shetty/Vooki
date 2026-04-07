import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import CampaignModel from "../models/Campaign";
import PromotionModel, { PromotionStatus } from "../models/Promotion";
import UserModel from "../models/Users";
import { getRequestUser } from "../utils/requestUser";
import {
  syncPromotionFinancialRecords,
  validatePromotionPaymentTerms,
} from "../utils/promotionPayments";

const parseNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getRequester = (req: Request) => getRequestUser(req);

const allowedStatuses: PromotionStatus[] = [
  "requested",
  "negotiating",
  "accepted",
  "content_in_progress",
  "posted",
  "metrics_submitted",
  "payment_pending",
  "completed",
];

const editableStatuses = new Set<PromotionStatus>([
  "requested",
  "negotiating",
  "accepted",
]);

const formatPromotion = (promotion: any) => ({
  id: String(promotion._id),
  campaignId: String(promotion.campaignId),
  brandId: String(promotion.brandId),
  influencerId: String(promotion.influencerId),
  campaignTitle: promotion.campaignTitle,
  product: promotion.product,
  campaignGoal: promotion.campaignGoal,
  deliverables: promotion.deliverables || [],
  draftDueAt: promotion.draftDueAt,
  postAt: promotion.postAt,
  requiresDraftApproval: Boolean(promotion.requiresDraftApproval),
  captionRequirements: promotion.captionRequirements || "",
  brandTagRequired: Boolean(promotion.brandTagRequired),
  hashtags: promotion.hashtags || [],
  linkRequired: Boolean(promotion.linkRequired),
  discountCode: promotion.discountCode || "",
  allowReuse: Boolean(promotion.allowReuse),
  exclusivityDays:
    typeof promotion.exclusivityDays === "number" ? promotion.exclusivityDays : undefined,
  paymentAmount: Number(promotion.paymentAmount || 0),
  advanceAmount: Number(promotion.advanceAmount || 0),
  paymentDueAt: promotion.paymentDueAt,
  paymentMethod: promotion.paymentMethod || "",
  paymentStatus: promotion.paymentStatus,
  performance: {
    reach: Number(promotion?.performance?.reach || 0),
    views: Number(promotion?.performance?.views || 0),
    engagement: Number(promotion?.performance?.engagement || 0),
  },
  deliverySubmission: {
    proofUrl: promotion?.deliverySubmission?.proofUrl || "",
    notes: promotion?.deliverySubmission?.notes || "",
    submittedAt: promotion?.deliverySubmission?.submittedAt,
    reviewedAt: promotion?.deliverySubmission?.reviewedAt,
    reviewStatus: promotion?.deliverySubmission?.reviewStatus || "",
    reviewFeedback: promotion?.deliverySubmission?.reviewFeedback || "",
  },
  status: promotion.status,
  createdAt: promotion.createdAt,
  updatedAt: promotion.updatedAt,
});

const canAccessPromotion = (promotion: any, requester: any) =>
  requester?.role === "brand"
    ? String(promotion.brandId) === String(requester.id)
    : requester?.role === "influencer"
      ? String(promotion.influencerId) === String(requester.id)
      : false;

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const createPromotion = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) return res.status(401).json({ message: "Unauthorized" });
    if (requester.role !== "brand") {
      return res.status(403).json({ message: "Only brands can create promotions" });
    }

    const {
      campaignId,
      influencerId,
      campaignTitle = "",
      product = "",
      campaignGoal = "awareness",
      deliverables = [],
      draftDueAt,
      postAt,
      requiresDraftApproval = true,
      captionRequirements = "",
      brandTagRequired = false,
      hashtags = [],
      linkRequired = false,
      discountCode = "",
      allowReuse = false,
      exclusivityDays,
      paymentAmount,
      advanceAmount = 0,
      paymentDueAt,
      paymentMethod = "",
    } = req.body || {};

    if (!campaignId || !isValidObjectId(String(campaignId))) {
      return res.status(400).json({ message: "Valid campaignId is required" });
    }
    if (!influencerId || !isValidObjectId(String(influencerId))) {
      return res.status(400).json({ message: "Valid influencerId is required" });
    }

    const campaign = await CampaignModel.findOne({
      _id: String(campaignId),
      brandId: requester.id,
    })
      .select("_id name")
      .lean();
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const influencer = await UserModel.findOne({
      _id: String(influencerId),
      role: "influencer",
    })
      .select("_id")
      .lean();
    if (!influencer) {
      return res.status(404).json({ message: "Influencer not found" });
    }

    const normalizedDeliverables = Array.isArray(deliverables)
      ? deliverables
          .map((item: any) => ({
            platform: String(item?.platform || "").trim(),
            format: String(item?.format || "").trim(),
            quantity: Math.max(1, parseNumber(item?.quantity) ?? 1),
          }))
          .filter((item: any) => item.platform && item.format)
      : [];

    if (!normalizedDeliverables.length) {
      return res.status(400).json({ message: "At least one deliverable is required" });
    }

    const parsedDraftDueAt = parseDate(draftDueAt);
    const parsedPostAt = parseDate(postAt);
    const parsedPaymentDueAt = parseDate(paymentDueAt);
    const parsedPaymentAmount = parseNumber(paymentAmount);
    const parsedAdvanceAmount = parseNumber(advanceAmount) ?? 0;
    const parsedExclusivityDays = parseNumber(exclusivityDays);

    if (!parsedDraftDueAt) return res.status(400).json({ message: "Valid draftDueAt is required" });
    if (!parsedPostAt) return res.status(400).json({ message: "Valid postAt is required" });
    if (!parsedPaymentDueAt) {
      return res.status(400).json({ message: "Valid paymentDueAt is required" });
    }
    if (parsedPostAt < parsedDraftDueAt) {
      return res.status(400).json({ message: "postAt cannot be before draftDueAt" });
    }
    if (parsedPaymentAmount === undefined || parsedPaymentAmount < 0) {
      return res.status(400).json({ message: "paymentAmount must be a non-negative number" });
    }
    if (parsedAdvanceAmount < 0 || parsedAdvanceAmount > parsedPaymentAmount) {
      return res.status(400).json({ message: "advanceAmount must be between 0 and paymentAmount" });
    }
    if (parsedExclusivityDays !== undefined && parsedExclusivityDays < 0) {
      return res.status(400).json({ message: "exclusivityDays must be non-negative" });
    }

    const promotion = await PromotionModel.create({
      campaignId: String(campaign._id),
      brandId: requester.id,
      influencerId: String(influencer._id),
      campaignTitle: String(campaignTitle || campaign.name || "").trim(),
      product: String(product || "").trim(),
      campaignGoal: ["awareness", "sales", "launch", "other"].includes(String(campaignGoal))
        ? String(campaignGoal)
        : "other",
      deliverables: normalizedDeliverables,
      draftDueAt: parsedDraftDueAt,
      postAt: parsedPostAt,
      requiresDraftApproval: Boolean(requiresDraftApproval),
      captionRequirements: String(captionRequirements || "").trim(),
      brandTagRequired: Boolean(brandTagRequired),
      hashtags: Array.isArray(hashtags)
        ? hashtags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
        : [],
      linkRequired: Boolean(linkRequired),
      discountCode: String(discountCode || "").trim(),
      allowReuse: Boolean(allowReuse),
      exclusivityDays:
        parsedExclusivityDays !== undefined ? Math.round(parsedExclusivityDays) : undefined,
      paymentAmount: parsedPaymentAmount,
      advanceAmount: parsedAdvanceAmount,
      paymentDueAt: parsedPaymentDueAt,
      paymentMethod: String(paymentMethod || "").trim(),
      paymentStatus: "pending",
      status: "requested",
    });

    await CampaignModel.updateOne(
      { _id: campaign._id, brandId: requester.id },
      { $inc: { invitedCreators: 1 } }
    );

    return res.status(201).json({
      message: "Promotion created",
      promotion: formatPromotion(promotion),
    });
  } catch (error) {
    console.error("Error creating promotion:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listPromotions = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) return res.status(401).json({ message: "Unauthorized" });
    if (requester.role !== "brand" && requester.role !== "influencer") {
      return res.status(403).json({ message: "Role not supported for promotions" });
    }

    const { campaignId, status = "all", q = "", page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseNumber(page) ?? 1);
    const limitNum = clamp(parseNumber(limit) ?? 20, 1, 50);
    const skip = (pageNum - 1) * limitNum;

    const query: any = requester.role === "brand" ? { brandId: requester.id } : { influencerId: requester.id };

    if (campaignId) {
      if (!isValidObjectId(String(campaignId))) {
        return res.status(400).json({ message: "Invalid campaignId filter" });
      }
      query.campaignId = String(campaignId);
    }

    if (status !== "all") {
      const statusValue = String(status) as PromotionStatus;
      if (!allowedStatuses.includes(statusValue)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      query.status = statusValue;
    }

    if (String(q).trim()) {
      const regex = new RegExp(String(q).trim(), "i");
      query.$or = [{ campaignTitle: regex }, { product: regex }];
    }

    const [items, total] = await Promise.all([
      PromotionModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limitNum).lean(),
      PromotionModel.countDocuments(query),
    ]);

    return res.status(200).json({
      items: items.map(formatPromotion),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: skip + items.length < total,
      },
    });
  } catch (error) {
    console.error("Error listing promotions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPromotionById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) return res.status(401).json({ message: "Unauthorized" });
    if (requester.role !== "brand" && requester.role !== "influencer") {
      return res.status(403).json({ message: "Role not supported for promotions" });
    }

    const { promotionId } = req.params;
    if (!promotionId || !isValidObjectId(promotionId)) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    const promotion = await PromotionModel.findById(promotionId).lean();
    if (!promotion || !canAccessPromotion(promotion, requester)) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    return res.status(200).json({ promotion: formatPromotion(promotion) });
  } catch (error) {
    console.error("Error fetching promotion:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePromotionTerms = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) return res.status(401).json({ message: "Unauthorized" });
    if (requester.role !== "brand" && requester.role !== "influencer") {
      return res.status(403).json({ message: "Role not supported for promotions" });
    }

    const { promotionId } = req.params;
    if (!promotionId || !isValidObjectId(promotionId)) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    const promotion = await PromotionModel.findById(promotionId);
    if (!promotion || !canAccessPromotion(promotion, requester)) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    if (requester.role !== "brand") {
      return res.status(403).json({
        message: "Only brands can revise agreement terms. Use chat to request changes.",
      });
    }
    if (!editableStatuses.has(promotion.status)) {
      return res.status(409).json({ message: "Terms can only be edited during request/negotiation phase" });
    }

    const updates: Record<string, any> = {};
    const {
      deliverables,
      draftDueAt,
      postAt,
      requiresDraftApproval,
      captionRequirements,
      brandTagRequired,
      hashtags,
      linkRequired,
      discountCode,
      allowReuse,
      exclusivityDays,
      paymentAmount,
      advanceAmount,
      paymentDueAt,
      paymentMethod,
    } = req.body || {};

    if (deliverables !== undefined) {
      if (!Array.isArray(deliverables) || deliverables.length === 0) {
        return res.status(400).json({ message: "deliverables must be a non-empty array" });
      }
      const normalized = deliverables
        .map((item: any) => ({
          platform: String(item?.platform || "").trim(),
          format: String(item?.format || "").trim(),
          quantity: Math.max(1, parseNumber(item?.quantity) ?? 1),
        }))
        .filter((item: any) => item.platform && item.format);

      if (!normalized.length) {
        return res.status(400).json({ message: "deliverables must include valid platform and format" });
      }
      updates.deliverables = normalized;
    }

    if (draftDueAt !== undefined) {
      const date = parseDate(draftDueAt);
      if (!date) return res.status(400).json({ message: "draftDueAt must be a valid date" });
      updates.draftDueAt = date;
    }
    if (postAt !== undefined) {
      const date = parseDate(postAt);
      if (!date) return res.status(400).json({ message: "postAt must be a valid date" });
      updates.postAt = date;
    }

    const nextDraftDueAt = updates.draftDueAt ?? promotion.draftDueAt;
    const nextPostAt = updates.postAt ?? promotion.postAt;
    if (nextPostAt < nextDraftDueAt) {
      return res.status(400).json({ message: "postAt cannot be before draftDueAt" });
    }

    if (requiresDraftApproval !== undefined) updates.requiresDraftApproval = Boolean(requiresDraftApproval);
    if (captionRequirements !== undefined) updates.captionRequirements = String(captionRequirements || "").trim();
    if (brandTagRequired !== undefined) updates.brandTagRequired = Boolean(brandTagRequired);
    if (hashtags !== undefined) {
      updates.hashtags = Array.isArray(hashtags)
        ? hashtags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
        : [];
    }
    if (linkRequired !== undefined) updates.linkRequired = Boolean(linkRequired);
    if (discountCode !== undefined) updates.discountCode = String(discountCode || "").trim();
    if (allowReuse !== undefined) updates.allowReuse = Boolean(allowReuse);
    if (exclusivityDays !== undefined) {
      const parsed = parseNumber(exclusivityDays);
      if (parsed === undefined || parsed < 0) {
        return res.status(400).json({ message: "exclusivityDays must be non-negative" });
      }
      updates.exclusivityDays = Math.round(parsed);
    }
    if (paymentAmount !== undefined) {
      const parsed = parseNumber(paymentAmount);
      if (parsed === undefined || parsed < 0) {
        return res.status(400).json({ message: "paymentAmount must be non-negative" });
      }
      updates.paymentAmount = parsed;
    }
    if (advanceAmount !== undefined) {
      const parsed = parseNumber(advanceAmount);
      if (parsed === undefined || parsed < 0) {
        return res.status(400).json({ message: "advanceAmount must be non-negative" });
      }
      updates.advanceAmount = parsed;
    }
    if (paymentDueAt !== undefined) {
      const date = parseDate(paymentDueAt);
      if (!date) return res.status(400).json({ message: "paymentDueAt must be a valid date" });
      updates.paymentDueAt = date;
    }
    if (paymentMethod !== undefined) updates.paymentMethod = String(paymentMethod || "").trim();

    const nextPaymentAmount = updates.paymentAmount ?? promotion.paymentAmount;
    const nextAdvanceAmount = updates.advanceAmount ?? promotion.advanceAmount;
    if (nextAdvanceAmount > nextPaymentAmount) {
      return res.status(400).json({ message: "advanceAmount cannot exceed paymentAmount" });
    }

    Object.assign(promotion, updates);
    await promotion.save();

    try {
      await syncPromotionFinancialRecords(promotion);
    } catch (error) {
      console.error("Error syncing promotion financial records after terms update:", error);
    }

    return res.status(200).json({
      message: "Promotion terms updated",
      promotion: formatPromotion(promotion),
    });
  } catch (error) {
    console.error("Error updating promotion terms:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePromotionStatus = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) return res.status(401).json({ message: "Unauthorized" });
    if (requester.role !== "brand" && requester.role !== "influencer") {
      return res.status(403).json({ message: "Role not supported for promotions" });
    }

    const { promotionId } = req.params;
    const { status } = req.body || {};
    const nextStatus = String(status) as PromotionStatus;
    if (!promotionId || !isValidObjectId(promotionId)) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid promotion status" });
    }

    const promotion = await PromotionModel.findById(promotionId);
    if (!promotion || !canAccessPromotion(promotion, requester)) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    if (promotion.status === nextStatus) {
      return res.status(200).json({
        message: "Promotion status unchanged",
        promotion: formatPromotion(promotion),
      });
    }

    const current = promotion.status;
    let allowed = false;

    if (requester.role === "brand") {
      allowed =
        (current === "requested" && nextStatus === "negotiating") ||
        (current === "negotiating" && nextStatus === "requested") ||
        (current === "accepted" && nextStatus === "content_in_progress") ||
        (current === "metrics_submitted" && nextStatus === "payment_pending") ||
        (current === "payment_pending" && nextStatus === "completed");
    }

    if (requester.role === "influencer") {
      allowed =
        (current === "requested" && (nextStatus === "negotiating" || nextStatus === "accepted")) ||
        (current === "negotiating" && nextStatus === "accepted") ||
        (current === "content_in_progress" && nextStatus === "posted") ||
        (current === "posted" && nextStatus === "metrics_submitted");
    }

    if (!allowed) {
      return res.status(409).json({
        message: `Status transition not allowed from ${current} to ${nextStatus} for ${requester.role}`,
      });
    }

    if (nextStatus === "payment_pending") {
      const validationError = validatePromotionPaymentTerms(promotion);
      if (validationError) {
        return res.status(409).json({ message: validationError });
      }
    }

    const acceptingNow =
      current !== "accepted" &&
      nextStatus === "accepted" &&
      String(promotion.brandId) !== "";

    promotion.status = nextStatus;
    await promotion.save();

    if (acceptingNow) {
      await CampaignModel.updateOne(
        { _id: promotion.campaignId, brandId: promotion.brandId },
        { $inc: { acceptedCreators: 1 } }
      );
    }

    if (nextStatus === "payment_pending") {
      await syncPromotionFinancialRecords(promotion, { ensurePendingRecords: true });
    }

    return res.status(200).json({
      message: "Promotion status updated",
      promotion: formatPromotion(promotion),
    });
  } catch (error) {
    console.error("Error updating promotion status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const submitPromotionPerformance = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) return res.status(401).json({ message: "Unauthorized" });
    if (requester.role !== "influencer") {
      return res.status(403).json({ message: "Only influencers can submit performance" });
    }

    const { promotionId } = req.params;
    const { reach, views, engagement } = req.body || {};
    if (!promotionId || !isValidObjectId(promotionId)) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    const promotion = await PromotionModel.findById(promotionId);
    if (!promotion || !canAccessPromotion(promotion, requester)) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    if (promotion.status !== "posted" && promotion.status !== "metrics_submitted") {
      return res.status(409).json({ message: "Performance can only be submitted after posting" });
    }

    const parsedReach = parseNumber(reach);
    const parsedViews = parseNumber(views);
    const parsedEngagement = parseNumber(engagement);

    if (
      parsedReach === undefined ||
      parsedReach < 0 ||
      parsedViews === undefined ||
      parsedViews < 0 ||
      parsedEngagement === undefined ||
      parsedEngagement < 0
    ) {
      return res.status(400).json({ message: "reach, views, and engagement must be non-negative numbers" });
    }

    promotion.performance = {
      reach: Math.round(parsedReach),
      views: Math.round(parsedViews),
      engagement: Number(parsedEngagement.toFixed(2)),
    };
    promotion.status = "metrics_submitted";
    await promotion.save();

    return res.status(200).json({
      message: "Performance submitted",
      promotion: formatPromotion(promotion),
    });
  } catch (error) {
    console.error("Error submitting performance:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const submitPromotionDelivery = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) return res.status(401).json({ message: "Unauthorized" });
    if (requester.role !== "influencer") {
      return res.status(403).json({ message: "Only influencers can submit delivery proof" });
    }

    const { promotionId } = req.params;
    const { proofUrl = "", notes = "" } = req.body || {};
    if (!promotionId || !isValidObjectId(promotionId)) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    const promotion = await PromotionModel.findById(promotionId);
    if (!promotion || !canAccessPromotion(promotion, requester)) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    if (!["accepted", "content_in_progress", "posted"].includes(promotion.status)) {
      return res.status(409).json({ message: "Delivery proof can only be submitted during execution" });
    }

    promotion.deliverySubmission = {
      proofUrl: String(proofUrl || "").trim(),
      notes: String(notes || "").trim(),
      submittedAt: new Date(),
      reviewedAt: undefined,
      reviewStatus: "pending",
      reviewFeedback: "",
    };

    if (promotion.status === "accepted") {
      promotion.status = "content_in_progress";
    }

    await promotion.save();

    return res.status(200).json({
      message: "Delivery proof submitted",
      promotion: formatPromotion(promotion),
    });
  } catch (error) {
    console.error("Error submitting delivery proof:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const reviewPromotionDelivery = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) return res.status(401).json({ message: "Unauthorized" });
    if (requester.role !== "brand") {
      return res.status(403).json({ message: "Only brands can review delivery proof" });
    }

    const { promotionId } = req.params;
    const { action, feedback = "" } = req.body || {};
    if (!promotionId || !isValidObjectId(promotionId)) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    if (action !== "approved" && action !== "changes_requested") {
      return res.status(400).json({ message: "action must be approved or changes_requested" });
    }

    const promotion = await PromotionModel.findById(promotionId);
    if (!promotion || !canAccessPromotion(promotion, requester)) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    if (!promotion.deliverySubmission?.submittedAt) {
      return res.status(409).json({ message: "No delivery proof has been submitted yet" });
    }

    promotion.deliverySubmission = {
      proofUrl: promotion.deliverySubmission.proofUrl || "",
      notes: promotion.deliverySubmission.notes || "",
      submittedAt: promotion.deliverySubmission.submittedAt,
      reviewedAt: new Date(),
      reviewStatus: action,
      reviewFeedback: String(feedback || "").trim(),
    };

    if (action === "changes_requested") {
      promotion.status = "content_in_progress";
    }

    await promotion.save();

    return res.status(200).json({
      message:
        action === "approved"
          ? "Delivery proof approved"
          : "Change request sent to creator",
      promotion: formatPromotion(promotion),
    });
  } catch (error) {
    console.error("Error reviewing delivery proof:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markPromotionPaid = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) return res.status(401).json({ message: "Unauthorized" });
    if (requester.role !== "brand") {
      return res.status(403).json({ message: "Only brands can mark payment as paid" });
    }

    const { promotionId } = req.params;
    if (!promotionId || !isValidObjectId(promotionId)) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    const promotion = await PromotionModel.findById(promotionId);
    if (!promotion || !canAccessPromotion(promotion, requester)) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    if (!["metrics_submitted", "payment_pending", "completed"].includes(promotion.status)) {
      return res.status(409).json({
        message: "Payment can only be recorded after performance is submitted.",
      });
    }

    const validationError = validatePromotionPaymentTerms(promotion);
    if (validationError) {
      return res.status(409).json({ message: validationError });
    }

    promotion.paymentStatus = "paid";
    if (
      promotion.status === "metrics_submitted" ||
      promotion.status === "payment_pending"
    ) {
      promotion.status = "completed";
    } else if (promotion.status !== "completed") {
      promotion.status = "payment_pending";
    }
    await promotion.save();
    await syncPromotionFinancialRecords(promotion, { ensurePendingRecords: true, markAsPaid: true });

    return res.status(200).json({
      message: "Payment status updated",
      promotion: formatPromotion(promotion),
    });
  } catch (error) {
    console.error("Error marking promotion as paid:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
