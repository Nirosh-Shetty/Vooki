import { Request, Response } from "express";
import UserModel from "../models/Users";
import DiscoverShortlistModel from "../models/DiscoverShortlist";
import DiscoverInviteModel from "../models/DiscoverInvite";
import CampaignModel from "../models/Campaign";
import PromotionModel from "../models/Promotion";
import { getRequestUser } from "../utils/requestUser";
import { findOrCreateDirectConversation } from "../utils/directConversation";
import {
  normalizeSocialConnectionsRecord,
  calculateEngagementRateForMetrics,
} from "../utils/socialConnections";

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
        { "influencerProfile.niche": regex },
      ];
    }

    if (String(niche).trim()) {
      query["influencerProfile.niche"] = new RegExp(String(niche).trim(), "i");
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
      query["influencerProfile.followers"] = followerRange;
    }

    const skip = (pageNum - 1) * limitNum;

    const [influencers, total] = await Promise.all([
      UserModel.find(query)
        .select(
          "name username avatar isVerified rating totalReviews influencerProfile.niche influencerProfile.location influencerProfile.summary influencerProfile.pricing influencerProfile.languages influencerProfile.socialLinks influencerProfile.statsConnection"
        )
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      UserModel.countDocuments(query),
    ]);

    const formatted = influencers
      .map((influencer: any) => {
        const statsMap = normalizeSocialConnectionsRecord(
          influencer?.influencerProfile?.statsConnection
        );

        const instagramStats = statsMap?.instagram;
        const youtubeStats = statsMap?.youtube;
        const facebookStats = statsMap?.facebook;

        const instagramFollowers = Number(instagramStats?.metrics?.followers || 0);
        const youtubeSubscribers = Number(youtubeStats?.metrics?.subscribers || 0);
        const facebookFollowers = Number(facebookStats?.metrics?.followers || 0);

        const followers = instagramFollowers + youtubeSubscribers + facebookFollowers;

        // Dynamic Engagement Rate calculation (matching Creator Profile / socialConnections reference)
        const platformRates: number[] = [];
        if (instagramStats?.metrics) {
          const rate = calculateEngagementRateForMetrics("instagram", instagramStats.metrics as any);
          if (typeof rate === "number" && rate > 0) platformRates.push(rate);
        }
        if (youtubeStats?.metrics) {
          const rate = calculateEngagementRateForMetrics("youtube", youtubeStats.metrics as any);
          if (typeof rate === "number" && rate > 0) platformRates.push(rate);
        }
        if (facebookStats?.metrics) {
          const rate = calculateEngagementRateForMetrics("facebook", facebookStats.metrics as any);
          if (typeof rate === "number" && rate > 0) platformRates.push(rate);
        }

        let engagementRate = 0;
        if (platformRates.length > 0) {
          engagementRate = Number(
            (platformRates.reduce((acc, curr) => acc + curr, 0) / platformRates.length).toFixed(1)
          );
        } else if (Number(influencer?.influencerProfile?.engagement || 0) > 0) {
          engagementRate = Number(Number(influencer.influencerProfile.engagement).toFixed(1));
        }

        if (minEngagementNum > 0 && engagementRate < minEngagementNum) return null;

        // Dynamic Average Views calculation from connected platforms
        let avgViews = 0;

        if (youtubeStats?.metrics) {
          const totalViews = Number(youtubeStats.metrics.totalViews || youtubeStats.metrics.views || 0);
          const videoCount = Number(youtubeStats.metrics.videoCount || 0);
          if (videoCount > 0 && totalViews > 0) {
            avgViews += Math.round(totalViews / videoCount);
          } else if (totalViews > 0) {
            avgViews += totalViews;
          }
        }

        if (instagramStats?.metrics) {
          const reach = Number(instagramStats.metrics.reach || 0);
          const impressions = Number(instagramStats.metrics.impressions || 0);
          const mediaCount = Number(instagramStats.metrics.mediaCount || 0);
          const igViews = reach || impressions;
          if (mediaCount > 0 && igViews > 0) {
            avgViews += Math.round(igViews / mediaCount);
          } else if (igViews > 0) {
            avgViews += igViews;
          }
        }

        // If no views recorded but has audience and engagement, estimate based on engagement rate
        if (avgViews === 0 && followers > 0 && engagementRate > 0) {
          avgViews = Math.round(followers * (engagementRate / 100));
        }

        // Dynamic Est CPV (Cost Per View)
        const pricingReel = Number(influencer?.influencerProfile?.pricing?.reel || 0);
        const pricingYoutube = Number(influencer?.influencerProfile?.pricing?.youtubeIntegration || 0);
        const pricingBase = pricingReel || pricingYoutube || 0;

        let estCpv = 0;
        if (avgViews > 0 && pricingBase > 0) {
          estCpv = Number((pricingBase / avgViews).toFixed(2));
        } else if (avgViews > 0) {
          estCpv = Number((Math.max(0.02, 6.5 / Math.max(avgViews, 100))).toFixed(2));
        }

        const fitScore = clamp(
          Math.round(55 + Math.min(30, engagementRate * 3.2) + (influencer.isVerified ? 7 : 0)),
          50,
          98
        );

        const platforms: string[] = [];
        if (statsMap?.instagram) platforms.push("instagram");
        if (statsMap?.youtube) platforms.push("youtube");
        if (statsMap?.facebook) platforms.push("facebook");

        // Derive tags from niche and languages
        const rawNiche = influencer?.influencerProfile?.niche || "General";
        const tags = [
          rawNiche,
          ...(Array.isArray(influencer?.influencerProfile?.languages)
            ? influencer.influencerProfile.languages.slice(0, 2)
            : []),
          "Campaign Ready",
        ].filter(Boolean);

        return {
          id: String(influencer._id),
          name: influencer.name || "",
          handle: influencer.username ? `@${influencer.username}` : "",
          niche: rawNiche,
          location: influencer?.influencerProfile?.location || "Global",
          summary: influencer?.influencerProfile?.summary || "",
          followers,
          engagementRate,
          avgViews,
          estCpv,
          fitScore,
          verified: Boolean(influencer.isVerified),
          rating: Number(influencer.rating || 0),
          totalReviews: Number(influencer.totalReviews || 0),
          tags,
          avatar: influencer.avatar || "",
          platforms,
          pricing: influencer?.influencerProfile?.pricing,
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
    // console.log("Creating discover invites for brand:", requester.id, "campaign:", campaignId, "influencers:", influencerIds, "label:", campaignLabel, "note:", note);

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
        campaignTitle: String(campaignLabel || campaign.name || ""),
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
        { name: 1, username: 1, "brandProfile.companyName": 1, profilePicture: 1 }
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
              brand?.brandProfile?.companyName || brand?.name || brand?.username || "Brand",
            brandHandle: brand?.username ? `@${brand.username}` : "",
            campaignId: String(item.campaignId || ""),
            campaignTitle: item.campaignTitle || "",
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
        { name: 1, username: 1, profilePicture: 1, "influencerProfile.niche": 1 }
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
            influencerNiche: influencer?.influencerProfile?.niche || "",
            campaignId: String(item.campaignId || ""),
            campaignTitle: item.campaignTitle || "",
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
