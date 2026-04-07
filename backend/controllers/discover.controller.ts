import { Request, Response } from "express";
import UserModel from "../models/Users";
import DiscoverShortlistModel from "../models/DiscoverShortlist";
import DiscoverInviteModel from "../models/DiscoverInvite";
import CampaignModel from "../models/Campaign";
import PromotionModel from "../models/Promotion";
import { getRequestUser } from "../utils/requestUser";
import { findOrCreateDirectConversation } from "../utils/directConversation";

const parseNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const buildPromotionSeedFromCampaign = (campaign: any) => {
  const startDate = campaign?.startDate ? new Date(campaign.startDate) : new Date();
  const endDate = campaign?.endDate ? new Date(campaign.endDate) : startDate;
  const safePostAt = endDate >= startDate ? endDate : startDate;

  return {
    campaignTitle: String(campaign?.name || "Campaign collaboration").trim(),
    product: String(campaign?.name || "Campaign deliverable").trim(),
    campaignGoal: "awareness" as const,
    deliverables: [
      {
        platform: "tbd",
        format: "content",
        quantity: 1,
      },
    ],
    draftDueAt: startDate,
    postAt: safePostAt,
    requiresDraftApproval: true,
    captionRequirements: "",
    brandTagRequired: false,
    hashtags: [],
    linkRequired: false,
    discountCode: "",
    allowReuse: false,
    paymentAmount: 0,
    advanceAmount: 0,
    paymentDueAt: safePostAt,
    paymentMethod: "direct",
    paymentStatus: "pending" as const,
    performance: {
      reach: 0,
      views: 0,
      engagement: 0,
    },
    // Accepting an invite opens a collaboration workspace, but the commercial
    // agreement should still be negotiated in chat before execution starts.
    status: "negotiating" as const,
  };
};

const ensureConversationForInvite = async (invite: any) => {
  return findOrCreateDirectConversation(
    String(invite.brandId),
    String(invite.influencerId)
  );
};

const findOrCreatePromotionForAcceptedInvite = async (invite: any, campaign: any) => {
  const sourceInviteId = String(invite._id);
  const existingByInvite = await PromotionModel.findOne({ sourceInviteId });
  if (existingByInvite) {
    return { promotion: existingByInvite, created: false };
  }

  const existingByCampaignAndInfluencer = await PromotionModel.findOne({
    campaignId: String(invite.campaignId),
    brandId: String(invite.brandId),
    influencerId: String(invite.influencerId),
  });

  if (existingByCampaignAndInfluencer) {
    if (!existingByCampaignAndInfluencer.sourceInviteId) {
      existingByCampaignAndInfluencer.sourceInviteId = sourceInviteId;
      await existingByCampaignAndInfluencer.save();
    }
    return { promotion: existingByCampaignAndInfluencer, created: false };
  }

  const promotion = await PromotionModel.create({
    sourceInviteId,
    campaignId: String(invite.campaignId),
    brandId: String(invite.brandId),
    influencerId: String(invite.influencerId),
    ...buildPromotionSeedFromCampaign(campaign),
  });

  return { promotion, created: true };
};

export const getDiscoverInfluencers = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requesterRole = getRequestUser(req)?.role;
    if (!requesterRole) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      q = "",
      niche = "",
      minFollowers,
      maxFollowers,
      minEngagement,
      verified,
      page = 1,
      limit = 20,
    } = req.query;

    const minFollowersNum = parseNumber(minFollowers) ?? 0;
    const maxFollowersNum = parseNumber(maxFollowers);
    const minEngagementNum = parseNumber(minEngagement) ?? 0;
    const pageNum = Math.max(1, parseNumber(page) ?? 1);
    const limitNum = clamp(parseNumber(limit) ?? 20, 1, 50);

    const query: any = {
      role: "influencer",
    };

    if (String(q).trim()) {
      const regex = new RegExp(String(q).trim(), "i");
      query.$or = [
        { name: regex },
        { username: regex },
        { "influencerDetails.niche": regex },
      ];
    }

    if (String(niche).trim()) {
      query["influencerDetails.niche"] = new RegExp(String(niche).trim(), "i");
    }

    if (verified === "true") {
      query.isVerified = true;
    } else if (verified === "false") {
      query.isVerified = false;
    }

    const followerRange: any = {};
    if (minFollowersNum > 0) followerRange.$gte = minFollowersNum;
    if (typeof maxFollowersNum === "number") followerRange.$lte = maxFollowersNum;
    if (Object.keys(followerRange).length > 0) {
      query["influencerDetails.followers"] = followerRange;
    }

    const skip = (pageNum - 1) * limitNum;

    const [influencers, total] = await Promise.all([
      UserModel.find(query)
        .select(
          "name username profilePicture isVerified influencerDetails.niche influencerDetails.followers"
        )
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      UserModel.countDocuments(query),
    ]);

    const formatted = influencers
      .map((influencer: any) => {
        const followers = Number(influencer?.influencerDetails?.followers || 0);
        const engagementRate = clamp(
          3 + Math.log10(Math.max(followers, 10)) * 1.35,
          1.8,
          10.5
        );

        if (engagementRate < minEngagementNum) return null;

        const avgViews = Math.round(followers * (engagementRate / 100) * 4.3);
        const estCpv = avgViews > 0 ? (Math.max(0.02, 6.5 / avgViews)).toFixed(2) : "0.08";
        const fitScore = clamp(
          Math.round(55 + Math.min(30, engagementRate * 3.2) + (influencer.isVerified ? 7 : 0)),
          50,
          98
        );

        return {
          id: String(influencer._id),
          name: influencer.name || "",
          handle: influencer.username ? `@${influencer.username}` : "",
          niche: influencer?.influencerDetails?.niche || "General",
          location: "Unknown",
          followers,
          engagementRate: Number(engagementRate.toFixed(1)),
          avgViews,
          estCpv: Number(estCpv),
          fitScore,
          verified: Boolean(influencer.isVerified),
          tags: ["Campaign Ready", "Fast Response", "ROI Trackable"],
          profilePicture: influencer.profilePicture || "",
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      items: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: skip + formatted.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching discover influencers:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDiscoverShortlist = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (requester.role !== "brand") {
      return res.status(403).json({ message: "Only brand accounts can use shortlist" });
    }

    const items = await DiscoverShortlistModel.find({ brandId: requester.id })
      .select("influencerId")
      .lean();

    return res.status(200).json({
      influencerIds: items.map((item: any) => String(item.influencerId)),
    });
  } catch (error) {
    console.error("Error fetching shortlist:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addToDiscoverShortlist = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (requester.role !== "brand") {
      return res.status(403).json({ message: "Only brand accounts can shortlist influencers" });
    }

    const { influencerId } = req.body;
    if (!influencerId) {
      return res.status(400).json({ message: "influencerId is required" });
    }

    const influencer = await UserModel.findOne({
      _id: influencerId,
      role: "influencer",
    })
      .select("_id")
      .lean();

    if (!influencer) {
      return res.status(404).json({ message: "Influencer not found" });
    }

    await DiscoverShortlistModel.findOneAndUpdate(
      { brandId: requester.id, influencerId: String(influencerId) },
      { $setOnInsert: { brandId: requester.id, influencerId: String(influencerId) } },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: "Added to shortlist" });
  } catch (error) {
    console.error("Error adding shortlist item:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const removeFromDiscoverShortlist = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (requester.role !== "brand") {
      return res.status(403).json({ message: "Only brand accounts can shortlist influencers" });
    }

    const { influencerId } = req.params;
    if (!influencerId) {
      return res.status(400).json({ message: "influencerId is required" });
    }

    await DiscoverShortlistModel.deleteOne({
      brandId: requester.id,
      influencerId: String(influencerId),
    });

    return res.status(200).json({ message: "Removed from shortlist" });
  } catch (error) {
    console.error("Error removing shortlist item:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createDiscoverInvites = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (requester.role !== "brand") {
      return res.status(403).json({ message: "Only brand accounts can send invites" });
    }

    const { influencerIds, campaignId, campaignLabel = "", note = "" } = req.body;
    if (!Array.isArray(influencerIds) || influencerIds.length === 0) {
      return res.status(400).json({ message: "influencerIds array is required" });
    }
    if (!campaignId) {
      return res.status(400).json({ message: "campaignId is required" });
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

    const uniqueIds = Array.from(new Set(influencerIds.map((value: any) => String(value))));

    const influencers = await UserModel.find({
      _id: { $in: uniqueIds },
      role: "influencer",
    })
      .select("_id")
      .lean();
    const validIds = new Set(influencers.map((item: any) => String(item._id)));

    const created: string[] = [];
    const skipped: string[] = [];

    for (const influencerId of uniqueIds) {
      if (!validIds.has(influencerId)) {
        skipped.push(influencerId);
        continue;
      }

      const existingPending = await DiscoverInviteModel.findOne({
        brandId: requester.id,
        influencerId,
        campaignId: String(campaign._id),
        status: "pending",
      })
        .select("_id")
        .lean();

      if (existingPending) {
        skipped.push(influencerId);
        continue;
      }

      const invite = await DiscoverInviteModel.create({
        brandId: requester.id,
        influencerId,
        campaignId: String(campaign._id),
        campaignLabel: String(campaignLabel || campaign.name || ""),
        note: String(note || ""),
        status: "pending",
      });
      created.push(String(invite.influencerId));
    }

    return res.status(200).json({
      message: "Invites processed",
      created,
      skipped,
    });
  } catch (error) {
    console.error("Error creating discover invites:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDiscoverInvites = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { status = "pending", campaignId, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseNumber(page) ?? 1);
    const limitNum = clamp(parseNumber(limit) ?? 20, 1, 50);
    const skip = (pageNum - 1) * limitNum;

    const statusFilter =
      status === "all"
        ? undefined
        : {
            status: String(status),
          };

    if (requester.role === "influencer") {
      const query: any = {
        influencerId: requester.id,
        ...(statusFilter || {}),
      };
      if (campaignId) {
        query.campaignId = String(campaignId);
      }

      const [items, total] = await Promise.all([
        DiscoverInviteModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        DiscoverInviteModel.countDocuments(query),
      ]);

      const inviteIds = items.map((item: any) => String(item._id));
      const brandIds = Array.from(new Set(items.map((item: any) => String(item.brandId))));
      const brands = await UserModel.find(
        { _id: { $in: brandIds } },
        { name: 1, username: 1, "brandDetails.companyName": 1, profilePicture: 1 }
      ).lean();
      const promotions = await PromotionModel.find(
        { sourceInviteId: { $in: inviteIds } },
        { _id: 1, sourceInviteId: 1, status: 1 }
      ).lean();
      const brandMap = new Map(brands.map((brand: any) => [String(brand._id), brand]));
      const promotionMap = new Map(
        promotions.map((promotion: any) => [String(promotion.sourceInviteId), promotion])
      );

      return res.status(200).json({
        items: items.map((item: any) => {
          const brand = brandMap.get(String(item.brandId));
          const promotion = promotionMap.get(String(item._id));
          return {
            id: String(item._id),
            brandId: String(item.brandId),
            brandName:
              brand?.brandDetails?.companyName || brand?.name || brand?.username || "Brand",
            brandHandle: brand?.username ? `@${brand.username}` : "",
            campaignId: String(item.campaignId || ""),
            campaignLabel: item.campaignLabel || "",
            note: item.note || "",
            status: item.status,
            promotionId: promotion?._id ? String(promotion._id) : "",
            promotionStatus: promotion?.status || "",
            createdAt: item.createdAt,
          };
        }),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          hasMore: skip + items.length < total,
        },
      });
    }

    if (requester.role === "brand") {
      const query: any = {
        brandId: requester.id,
        ...(statusFilter || {}),
      };
      if (campaignId) {
        query.campaignId = String(campaignId);
      }

      const [items, total] = await Promise.all([
        DiscoverInviteModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        DiscoverInviteModel.countDocuments(query),
      ]);

      const inviteIds = items.map((item: any) => String(item._id));
      const influencerIds = Array.from(
        new Set(items.map((item: any) => String(item.influencerId)))
      );
      const influencers = await UserModel.find(
        { _id: { $in: influencerIds } },
        { name: 1, username: 1, profilePicture: 1, "influencerDetails.niche": 1 }
      ).lean();
      const promotions = await PromotionModel.find(
        { sourceInviteId: { $in: inviteIds } },
        { _id: 1, sourceInviteId: 1, status: 1 }
      ).lean();
      const influencerMap = new Map(
        influencers.map((influencer: any) => [String(influencer._id), influencer])
      );
      const promotionMap = new Map(
        promotions.map((promotion: any) => [String(promotion.sourceInviteId), promotion])
      );

      return res.status(200).json({
        items: items.map((item: any) => {
          const influencer = influencerMap.get(String(item.influencerId));
          const promotion = promotionMap.get(String(item._id));
          return {
            id: String(item._id),
            influencerId: String(item.influencerId),
            influencerName: influencer?.name || influencer?.username || "Influencer",
            influencerHandle: influencer?.username ? `@${influencer.username}` : "",
            influencerNiche: influencer?.influencerDetails?.niche || "",
            campaignId: String(item.campaignId || ""),
            campaignLabel: item.campaignLabel || "",
            note: item.note || "",
            status: item.status,
            promotionId: promotion?._id ? String(promotion._id) : "",
            promotionStatus: promotion?.status || "",
            createdAt: item.createdAt,
          };
        }),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          hasMore: skip + items.length < total,
        },
      });
    }

    return res.status(403).json({ message: "Role not supported for invites" });
  } catch (error) {
    console.error("Error fetching discover invites:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const respondToDiscoverInvite = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (requester.role !== "influencer") {
      return res.status(403).json({ message: "Only influencers can respond to invites" });
    }

    const { inviteId } = req.params;
    const { action } = req.body;

    if (!inviteId) {
      return res.status(400).json({ message: "inviteId is required" });
    }

    if (action !== "accepted" && action !== "rejected") {
      return res.status(400).json({ message: "action must be accepted or rejected" });
    }

    const invite = await DiscoverInviteModel.findOne({
      _id: inviteId,
      influencerId: requester.id,
    });

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    if (invite.status !== "pending") {
      return res.status(409).json({ message: "Invite already processed" });
    }

    invite.status = action;
    await invite.save();

    let promotion: any = null;
    let collaborationCreated = false;

    if (action === "accepted") {
      const campaign = await CampaignModel.findOne({
        _id: String(invite.campaignId),
        brandId: String(invite.brandId),
      })
        .select("_id name startDate endDate")
        .lean();

      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found for invite" });
      }

      const promotionResult = await findOrCreatePromotionForAcceptedInvite(invite, campaign);
      promotion = promotionResult.promotion;
      collaborationCreated = promotionResult.created;
      await ensureConversationForInvite(invite);

      if (collaborationCreated) {
        await CampaignModel.updateOne(
          { _id: campaign._id, brandId: String(invite.brandId) },
          { $inc: { acceptedCreators: 1 } }
        );
      }
    }

    return res.status(200).json({
      message:
        action === "accepted"
          ? collaborationCreated
            ? "Invite accepted and collaboration opened"
            : "Invite accepted and linked to existing collaboration"
          : "Invite rejected",
      invite: {
        id: String(invite._id),
        status: invite.status,
      },
      promotion: promotion
        ? {
            id: String(promotion._id),
            status: promotion.status,
          }
        : null,
    });
  } catch (error) {
    console.error("Error responding to discover invite:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
