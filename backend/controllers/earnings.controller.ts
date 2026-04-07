import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import CampaignModel from "../models/Campaign";
import { Earning, EarningStatus } from "../models/Earning";
import PromotionModel from "../models/Promotion";
import UserModel from "../models/Users";
import { getRequestUser } from "../utils/requestUser";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const parseNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const validStatuses: EarningStatus[] = ["pending", "ready_for_payment", "paid", "failed"];

const getInfluencerRequesterId = (req: Request, res: Response, influencerId?: string) => {
  const requester = getRequestUser(req);
  if (!requester?.id) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return null;
  }
  if (requester.role !== "influencer") {
    res.status(403).json({ success: false, error: "Only influencers can access earnings" });
    return null;
  }
  if (influencerId && String(influencerId) !== String(requester.id)) {
    res.status(403).json({ success: false, error: "You can only access your own earnings" });
    return null;
  }
  return String(requester.id);
};

const getEarningViewer = (req: Request, res: Response) => {
  const requester = getRequestUser(req);
  if (!requester?.id) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return null;
  }
  if (!["brand", "influencer"].includes(requester.role)) {
    res.status(403).json({ success: false, error: "Role not supported for earnings" });
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

const enrichEarnings = async (earnings: any[]) => {
  const brandIds = Array.from(new Set(earnings.map((earning) => String(earning.brandId)).filter(Boolean)));
  const campaignIds = Array.from(new Set(earnings.map((earning) => String(earning.campaignId)).filter(Boolean)));
  const promotionIds = Array.from(new Set(earnings.map((earning) => String(earning.promotionId || "")).filter(Boolean)));

  const [brands, campaigns, promotions] = await Promise.all([
    brandIds.length
      ? UserModel.find({ _id: { $in: brandIds } }).select("_id name username").lean()
      : Promise.resolve([]),
    campaignIds.length
      ? CampaignModel.find({ _id: { $in: campaignIds } }).select("_id name").lean()
      : Promise.resolve([]),
    promotionIds.length
      ? PromotionModel.find({ _id: { $in: promotionIds } })
          .select("_id campaignTitle performance paymentAmount paymentDueAt paymentMethod paymentStatus")
          .lean()
      : Promise.resolve([]),
  ]);

  const brandMap = new Map(brands.map((brand: any) => [String(brand._id), brand]));
  const campaignMap = new Map(campaigns.map((campaign: any) => [String(campaign._id), campaign]));
  const promotionMap = new Map(promotions.map((promotion: any) => [String(promotion._id), promotion]));

  return earnings.map((earning) => {
    const brand = brandMap.get(String(earning.brandId));
    const campaign = campaignMap.get(String(earning.campaignId));
    const promotion = earning.promotionId
      ? promotionMap.get(String(earning.promotionId))
      : undefined;

    return {
      id: String(earning._id),
      influencerId: String(earning.influencerId),
      brandId: String(earning.brandId),
      campaignId: String(earning.campaignId),
      promotionId: earning.promotionId ? String(earning.promotionId) : undefined,
      amount: Number(earning.amount || 0),
      status: earning.status,
      paymentMethod: earning.paymentMethod,
      currency: earning.currency || "USD",
      description: earning.description || "",
      dueDate: earning.dueDate,
      datePaid: earning.paidDate,
      transactionId: earning.transactionId || "",
      failureReason: earning.failureReason || "",
      createdAt: earning.createdAt,
      brandName: formatUserName(brand as any),
      brandHandle: brand?.username ? `@${brand.username}` : "",
      campaignTitle: promotion?.campaignTitle || campaign?.name || "Campaign",
      reach: Number(promotion?.performance?.reach || 0),
      views: Number(promotion?.performance?.views || 0),
      engagement: Number(promotion?.performance?.engagement || 0),
    };
  });
};

export const getInfluencerEarnings = async (req: Request, res: Response) => {
  try {
    const requestedInfluencerId = req.params.influencerId;
    const influencerId = getInfluencerRequesterId(req, res, requestedInfluencerId);
    if (!influencerId) return;

    const { status, skip = 0, limit = 20 } = req.query;
    const query: Record<string, unknown> = { influencerId };

    if (status) {
      const statusValue = String(status) as EarningStatus;
      if (!validStatuses.includes(statusValue)) {
        return res.status(400).json({ success: false, error: "Invalid earning status" });
      }
      query.status = statusValue;
    }

    const skipValue = Math.max(0, parseNumber(skip, 0));
    const limitValue = clamp(parseNumber(limit, 20), 1, 100);

    const [earnings, total] = await Promise.all([
      Earning.find(query).sort({ createdAt: -1 }).skip(skipValue).limit(limitValue).lean(),
      Earning.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: await enrichEarnings(earnings),
      pagination: {
        total,
        skip: skipValue,
        limit: limitValue,
      },
    });
  } catch (error) {
    console.error("Error fetching influencer earnings:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch earnings" });
  }
};

export const getMyInfluencerEarnings = async (req: Request, res: Response) => {
  req.params.influencerId = getRequestUser(req)?.id || "";
  return getInfluencerEarnings(req, res);
};

export const getInfluencerEarningsSummary = async (req: Request, res: Response) => {
  try {
    const requestedInfluencerId = req.params.influencerId;
    const influencerId = getInfluencerRequesterId(req, res, requestedInfluencerId);
    if (!influencerId) return;

    const earnings = await Earning.find({ influencerId }).lean();

    const summary = {
      totalEarned: 0,
      pending: 0,
      readyForPayment: 0,
      paid: 0,
      byPaymentMethod: {
        direct: 0,
        escrow: 0,
      },
      byStatus: {
        pending: 0,
        ready_for_payment: 0,
        paid: 0,
        failed: 0,
      },
    };

    earnings.forEach((earning) => {
      summary.byPaymentMethod[earning.paymentMethod] += earning.amount;
      summary.byStatus[earning.status] += earning.amount;

      if (earning.status === "paid") {
        summary.totalEarned += earning.amount;
        summary.paid += earning.amount;
      } else if (earning.status === "ready_for_payment") {
        summary.readyForPayment += earning.amount;
      } else if (earning.status === "pending") {
        summary.pending += earning.amount;
      }
    });

    return res.json({ success: true, data: summary });
  } catch (error) {
    console.error("Error fetching earnings summary:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch summary" });
  }
};

export const getMyInfluencerEarningsSummary = async (req: Request, res: Response) => {
  req.params.influencerId = getRequestUser(req)?.id || "";
  return getInfluencerEarningsSummary(req, res);
};

export const getEarningById = async (req: Request, res: Response) => {
  try {
    const requester = getEarningViewer(req, res);
    if (!requester) return;

    const { earningId } = req.params;
    if (!earningId || !isValidObjectId(earningId)) {
      return res.status(404).json({ success: false, error: "Earning not found" });
    }

    const earning = await Earning.findById(earningId).lean();
    if (!earning) {
      return res.status(404).json({ success: false, error: "Earning not found" });
    }

    const canAccess =
      (requester.role === "influencer" && String(earning.influencerId) === String(requester.id)) ||
      (requester.role === "brand" && String(earning.brandId) === String(requester.id));

    if (!canAccess) {
      return res.status(404).json({ success: false, error: "Earning not found" });
    }

    const [enriched] = await enrichEarnings([earning]);
    return res.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error fetching earning:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch earning" });
  }
};

export const createEarning = async (req: Request, res: Response) => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    if (requester.role !== "brand") {
      return res.status(403).json({ success: false, error: "Only brands can create earnings" });
    }

    const {
      influencerId,
      campaignId,
      promotionId,
      amount,
      paymentMethod,
      description,
      dueDate,
      currency = "USD",
    } = req.body || {};

    if (!influencerId || !campaignId || !amount || !paymentMethod) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const earning = new Earning({
      influencerId: String(influencerId),
      campaignId: String(campaignId),
      brandId: String(requester.id),
      promotionId: promotionId ? String(promotionId) : undefined,
      amount: Number(amount),
      paymentMethod: String(paymentMethod) === "escrow" ? "escrow" : "direct",
      currency: String(currency || "USD"),
      description: String(description || "").trim(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "pending",
    });

    await earning.save();

    const [enriched] = await enrichEarnings([earning.toObject()]);
    return res.status(201).json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error creating earning:", error);
    return res.status(500).json({ success: false, error: "Failed to create earning" });
  }
};

export const updateEarningStatus = async (req: Request, res: Response) => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    if (requester.role !== "brand") {
      return res.status(403).json({ success: false, error: "Only brands can update earning status" });
    }

    const { earningId } = req.params;
    const { status, failureReason, transactionId } = req.body || {};
    const nextStatus = String(status) as EarningStatus;

    if (!validStatuses.includes(nextStatus)) {
      return res.status(400).json({ success: false, error: "Valid status is required" });
    }

    const earning = await Earning.findById(earningId);
    if (!earning || String(earning.brandId) !== String(requester.id)) {
      return res.status(404).json({ success: false, error: "Earning not found" });
    }

    earning.status = nextStatus;
    if (nextStatus === "paid") {
      earning.paidDate = new Date();
      earning.transactionId = transactionId ? String(transactionId) : earning.transactionId;
      earning.failureReason = "";
    }
    if (nextStatus === "failed") {
      earning.failureReason = String(failureReason || "").trim();
    }
    await earning.save();

    const [enriched] = await enrichEarnings([earning.toObject()]);
    return res.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error updating earning:", error);
    return res.status(500).json({ success: false, error: "Failed to update earning" });
  }
};

export const getEarningsByCampaign = async (req: Request, res: Response) => {
  try {
    const requester = getEarningViewer(req, res);
    if (!requester) return;

    const { campaignId } = req.params;
    if (!campaignId || !isValidObjectId(campaignId)) {
      return res.status(400).json({ success: false, error: "Invalid campaignId" });
    }

    const query: Record<string, unknown> = { campaignId };
    if (requester.role === "brand") query.brandId = requester.id;
    if (requester.role === "influencer") query.influencerId = requester.id;

    const earnings = await Earning.find(query).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: await enrichEarnings(earnings) });
  } catch (error) {
    console.error("Error fetching campaign earnings:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch earnings" });
  }
};
