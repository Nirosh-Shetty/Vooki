import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import CampaignModel, {
  CampaignPriority,
  CampaignStatus,
} from "../models/Campaign";

const parseNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const allowedStatus: CampaignStatus[] = [
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
];
const allowedPriority: CampaignPriority[] = ["low", "medium", "high"];

const statusTransitions: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ["active", "archived"],
  active: ["paused", "completed", "archived"],
  paused: ["active", "completed", "archived"],
  completed: ["archived"],
  archived: [],
};

const formatCampaign = (campaign: any) => ({
  id: String(campaign._id),
  brandId: String(campaign.brandId),
  name: campaign.name,
  objective: campaign.objective,
  niche: campaign.niche,
  status: campaign.status,
  priority: campaign.priority,
  budgetTotal: Number(campaign.budgetTotal || 0),
  budgetSpent: Number(campaign.budgetSpent || 0),
  currency: campaign.currency || "USD",
  roi: Number(campaign.roi || 0),
  startDate: campaign.startDate,
  endDate: campaign.endDate,
  invitedCreators: Number(campaign.invitedCreators || 0),
  acceptedCreators: Number(campaign.acceptedCreators || 0),
  deliverablesDone: Number(campaign.deliverablesDone || 0),
  deliverablesTotal: Number(campaign.deliverablesTotal || 0),
  createdAt: campaign.createdAt,
  updatedAt: campaign.updatedAt,
});

const getRequester = (req: Request) => getRequestUser(req);

export const createCampaign = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (requester.role !== "brand") {
      return res.status(403).json({ message: "Only brand accounts can create campaigns" });
    }

    const {
      name = "",
      objective = "",
      niche = "General",
      priority = "medium",
      budgetTotal,
      budgetSpent = 0,
      currency = "USD",
      roi = 0,
      startDate,
      endDate,
      deliverablesTotal = 0,
      deliverablesDone = 0,
      invitedCreators = 0,
      acceptedCreators = 0,
    } = req.body || {};

    const trimmedName = String(name).trim();
    const trimmedObjective = String(objective).trim();
    const normalizedPriority = String(priority) as CampaignPriority;
    const normalizedNiche = String(niche || "General").trim() || "General";
    const totalBudget = parseNumber(budgetTotal);
    const spentBudget = parseNumber(budgetSpent) ?? 0;
    const parsedRoi = parseNumber(roi) ?? 0;
    const parsedDeliverablesTotal = Math.max(0, parseNumber(deliverablesTotal) ?? 0);
    const parsedDeliverablesDone = Math.max(0, parseNumber(deliverablesDone) ?? 0);
    const parsedInvitedCreators = Math.max(0, parseNumber(invitedCreators) ?? 0);
    const parsedAcceptedCreators = Math.max(0, parseNumber(acceptedCreators) ?? 0);
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;

    if (!trimmedName) return res.status(400).json({ message: "name is required" });
    if (!trimmedObjective) {
      return res.status(400).json({ message: "objective is required" });
    }
    if (totalBudget === undefined || totalBudget < 0) {
      return res.status(400).json({ message: "budgetTotal must be a non-negative number" });
    }
    if (!(parsedStartDate instanceof Date) || Number.isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({ message: "startDate must be a valid date" });
    }
    if (!(parsedEndDate instanceof Date) || Number.isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ message: "endDate must be a valid date" });
    }
    if (parsedEndDate < parsedStartDate) {
      return res.status(400).json({ message: "endDate cannot be before startDate" });
    }
    if (!allowedPriority.includes(normalizedPriority)) {
      return res.status(400).json({ message: "priority must be low, medium, or high" });
    }
    if (spentBudget < 0 || spentBudget > totalBudget) {
      return res.status(400).json({ message: "budgetSpent must be between 0 and budgetTotal" });
    }
    if (parsedAcceptedCreators > parsedInvitedCreators) {
      return res.status(400).json({ message: "acceptedCreators cannot exceed invitedCreators" });
    }
    if (parsedDeliverablesDone > parsedDeliverablesTotal) {
      return res.status(400).json({ message: "deliverablesDone cannot exceed deliverablesTotal" });
    }

    const campaign = await CampaignModel.create({
      brandId: requester.id,
      name: trimmedName,
      objective: trimmedObjective,
      niche: normalizedNiche,
      status: "draft",
      priority: normalizedPriority,
      budgetTotal: totalBudget,
      budgetSpent: spentBudget,
      currency: String(currency || "USD").toUpperCase(),
      roi: parsedRoi,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      deliverablesTotal: parsedDeliverablesTotal,
      deliverablesDone: parsedDeliverablesDone,
      invitedCreators: parsedInvitedCreators,
      acceptedCreators: parsedAcceptedCreators,
    });

    return res.status(201).json({
      message: "Campaign created",
      campaign: formatCampaign(campaign),
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listCampaigns = async (req: Request, res: Response): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (requester.role !== "brand") {
      return res.status(403).json({ message: "Only brand accounts can list campaigns" });
    }

    const {
      q = "",
      status = "all",
      priority = "all",
      page = 1,
      limit = 20,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseNumber(page) ?? 1);
    const limitNum = clamp(parseNumber(limit) ?? 20, 1, 50);
    const skip = (pageNum - 1) * limitNum;

    const query: any = { brandId: requester.id };
    if (String(q).trim()) {
      const regex = new RegExp(String(q).trim(), "i");
      query.$or = [{ name: regex }, { objective: regex }, { niche: regex }];
    }

    if (status !== "all") {
      const statusValue = String(status) as CampaignStatus;
      if (!allowedStatus.includes(statusValue)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      query.status = statusValue;
    }

    if (priority !== "all") {
      const priorityValue = String(priority) as CampaignPriority;
      if (!allowedPriority.includes(priorityValue)) {
        return res.status(400).json({ message: "Invalid priority filter" });
      }
      query.priority = priorityValue;
    }

    const sortField =
      sort === "startDate" || sort === "endDate" || sort === "createdAt"
        ? String(sort)
        : "updatedAt";
    const sortOrder = String(order).toLowerCase() === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      CampaignModel.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CampaignModel.countDocuments(query),
    ]);

    return res.status(200).json({
      items: items.map(formatCampaign),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: skip + items.length < total,
      },
    });
  } catch (error) {
    console.error("Error listing campaigns:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getCampaignById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (requester.role !== "brand") {
      return res.status(403).json({ message: "Only brand accounts can view campaigns" });
    }

    const { campaignId } = req.params;
    if (!campaignId || !isValidObjectId(campaignId)) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const campaign = await CampaignModel.findOne({
      _id: campaignId,
      brandId: requester.id,
    }).lean();

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    return res.status(200).json({ campaign: formatCampaign(campaign) });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCampaign = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (requester.role !== "brand") {
      return res.status(403).json({ message: "Only brand accounts can update campaigns" });
    }

    const { campaignId } = req.params;
    if (!campaignId || !isValidObjectId(campaignId)) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const campaign = await CampaignModel.findOne({
      _id: campaignId,
      brandId: requester.id,
    });
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const updates: Record<string, any> = {};
    const {
      name,
      objective,
      niche,
      priority,
      budgetTotal,
      budgetSpent,
      currency,
      roi,
      startDate,
      endDate,
      invitedCreators,
      acceptedCreators,
      deliverablesDone,
      deliverablesTotal,
    } = req.body || {};

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return res.status(400).json({ message: "name cannot be empty" });
      updates.name = trimmed;
    }
    if (objective !== undefined) {
      const trimmed = String(objective).trim();
      if (!trimmed) return res.status(400).json({ message: "objective cannot be empty" });
      updates.objective = trimmed;
    }
    if (niche !== undefined) {
      updates.niche = String(niche).trim() || "General";
    }
    if (priority !== undefined) {
      const value = String(priority) as CampaignPriority;
      if (!allowedPriority.includes(value)) {
        return res.status(400).json({ message: "priority must be low, medium, or high" });
      }
      updates.priority = value;
    }
    if (budgetTotal !== undefined) {
      const value = parseNumber(budgetTotal);
      if (value === undefined || value < 0) {
        return res.status(400).json({ message: "budgetTotal must be a non-negative number" });
      }
      updates.budgetTotal = value;
    }
    if (budgetSpent !== undefined) {
      const value = parseNumber(budgetSpent);
      if (value === undefined || value < 0) {
        return res.status(400).json({ message: "budgetSpent must be a non-negative number" });
      }
      updates.budgetSpent = value;
    }
    if (currency !== undefined) {
      updates.currency = String(currency).toUpperCase().trim();
    }
    if (roi !== undefined) {
      const value = parseNumber(roi);
      if (value === undefined || value < 0) {
        return res.status(400).json({ message: "roi must be a non-negative number" });
      }
      updates.roi = value;
    }
    if (startDate !== undefined) {
      const value = new Date(startDate);
      if (Number.isNaN(value.getTime())) {
        return res.status(400).json({ message: "startDate must be a valid date" });
      }
      updates.startDate = value;
    }
    if (endDate !== undefined) {
      const value = new Date(endDate);
      if (Number.isNaN(value.getTime())) {
        return res.status(400).json({ message: "endDate must be a valid date" });
      }
      updates.endDate = value;
    }
    if (invitedCreators !== undefined) {
      const value = parseNumber(invitedCreators);
      if (value === undefined || value < 0) {
        return res.status(400).json({ message: "invitedCreators must be a non-negative number" });
      }
      updates.invitedCreators = value;
    }
    if (acceptedCreators !== undefined) {
      const value = parseNumber(acceptedCreators);
      if (value === undefined || value < 0) {
        return res.status(400).json({ message: "acceptedCreators must be a non-negative number" });
      }
      updates.acceptedCreators = value;
    }
    if (deliverablesDone !== undefined) {
      const value = parseNumber(deliverablesDone);
      if (value === undefined || value < 0) {
        return res.status(400).json({ message: "deliverablesDone must be a non-negative number" });
      }
      updates.deliverablesDone = value;
    }
    if (deliverablesTotal !== undefined) {
      const value = parseNumber(deliverablesTotal);
      if (value === undefined || value < 0) {
        return res.status(400).json({ message: "deliverablesTotal must be a non-negative number" });
      }
      updates.deliverablesTotal = value;
    }

    const nextBudgetTotal = updates.budgetTotal ?? campaign.budgetTotal;
    const nextBudgetSpent = updates.budgetSpent ?? campaign.budgetSpent;
    const nextStartDate = updates.startDate ?? campaign.startDate;
    const nextEndDate = updates.endDate ?? campaign.endDate;
    const nextInvitedCreators = updates.invitedCreators ?? campaign.invitedCreators;
    const nextAcceptedCreators = updates.acceptedCreators ?? campaign.acceptedCreators;
    const nextDeliverablesDone = updates.deliverablesDone ?? campaign.deliverablesDone;
    const nextDeliverablesTotal =
      updates.deliverablesTotal ?? campaign.deliverablesTotal;

    if (nextBudgetSpent > nextBudgetTotal) {
      return res.status(400).json({ message: "budgetSpent cannot exceed budgetTotal" });
    }
    if (nextEndDate < nextStartDate) {
      return res.status(400).json({ message: "endDate cannot be before startDate" });
    }
    if (nextAcceptedCreators > nextInvitedCreators) {
      return res.status(400).json({ message: "acceptedCreators cannot exceed invitedCreators" });
    }
    if (nextDeliverablesDone > nextDeliverablesTotal) {
      return res.status(400).json({ message: "deliverablesDone cannot exceed deliverablesTotal" });
    }

    Object.assign(campaign, updates);
    await campaign.save();

    return res.status(200).json({
      message: "Campaign updated",
      campaign: formatCampaign(campaign),
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCampaignStatus = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequester(req);
    if (!requester?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (requester.role !== "brand") {
      return res.status(403).json({ message: "Only brand accounts can update campaign status" });
    }

    const { campaignId } = req.params;
    const { status } = req.body || {};
    const nextStatus = String(status) as CampaignStatus;

    if (!campaignId || !isValidObjectId(campaignId)) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (!allowedStatus.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid campaign status" });
    }

    const campaign = await CampaignModel.findOne({
      _id: campaignId,
      brandId: requester.id,
    });
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status === nextStatus) {
      return res.status(200).json({
        message: "Campaign status unchanged",
        campaign: formatCampaign(campaign),
      });
    }

    const allowedNext = statusTransitions[campaign.status] || [];
    if (!allowedNext.includes(nextStatus)) {
      return res.status(409).json({
        message: `Status transition not allowed from ${campaign.status} to ${nextStatus}`,
      });
    }

    campaign.status = nextStatus;
    await campaign.save();

    return res.status(200).json({
      message: "Campaign status updated",
      campaign: formatCampaign(campaign),
    });
  } catch (error) {
    console.error("Error updating campaign status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
import { getRequestUser } from "../utils/requestUser";
