import { Request, Response } from "express";
import mongoose from "mongoose";
import UserModel from "../../models/Users";
import PromotionModel from "../../models/Promotion";
import { calculateEngagementRateForMetrics } from "../../utils/socialConnections";


export const getPublicProfileByIdentifier = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const identifier = req.params.identifier || req.params.id || req.params.username;

    if (!identifier) {
      return res.status(400).json({ success: false, message: "Profile identifier is required" });
    }

    let user: any = null;

    const cleanIdentifier = String(identifier).trim();

    // 1. Try querying by _id if it's a valid MongoDB ObjectId
    if (mongoose.isValidObjectId(cleanIdentifier)) {
      user = await UserModel.findOne({
        _id: cleanIdentifier,
        $or: [{ isTempAccount: { $ne: true } }, { isVerified: true }, { isTempAccount: false }],
      })
        .select({
          _id: 1,
          name: 1,
          username: 1,
          avatar: 1,
          isVerified: 1,
          rating: 1,
          totalReviews: 1,
          influencerProfile: 1,
          role: 1,
        })
        .lean();
    }

    // 2. If not found by _id, query by username (case-insensitive)
    if (!user) {
      user = await UserModel.findOne({
        username: { $regex: new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        $or: [{ isTempAccount: { $ne: true } }, { isVerified: true }, { isTempAccount: false }],
      })
        .select({
          _id: 1,
          name: 1,
          username: 1,
          avatar: 1,
          isVerified: 1,
          rating: 1,
          totalReviews: 1,
          influencerProfile: 1,
          role: 1,
        })
        .lean();
    }

    // 3. Fallback: Query by _id directly if valid ObjectId
    if (!user && mongoose.isValidObjectId(cleanIdentifier)) {
      user = await UserModel.findOne({ _id: cleanIdentifier })
        .select({
          _id: 1,
          name: 1,
          username: 1,
          avatar: 1,
          isVerified: 1,
          rating: 1,
          totalReviews: 1,
          influencerProfile: 1,
          role: 1,
        })
        .lean();
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // 3. Fetch completed promotions
    const promotions = await PromotionModel.find({
      influencerId: String(user._id),
      status: "completed",
    })
      .select({
        _id: 0,
        campaignTitle: 1,
        brandId: 1,
        brandRating: 1,
        postAt: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .lean();


    // 4. Fetch brand details for these promotions
    const brandIds = [...new Set(promotions.map((p) => p.brandId))];
    const brands = await UserModel.find({
      _id: { $in: brandIds },
    })
      .select({
        _id: 1,
        username: 1,
        isVerified: 1,
        "brandProfile.companyName": 1,
      })
      .lean();

    const brandMap = new Map(brands.map((b) => [String(b._id), b]));

    // 5. Structure "Previous Collaborations" strictly
    const collaborations = promotions.map((promo) => {
      const brand = brandMap.get(String(promo.brandId));
      return {
        brandName: brand?.brandProfile?.companyName || brand?.username || "brand",
        isVerified: Boolean(brand?.isVerified),
        campaignTitle: promo.campaignTitle,
        date: promo.postAt || promo.createdAt,
      };
    });

    // 6. Structure "Reviews & Feedback" strictly
    const reviews = promotions
      .filter(
        (promo) =>
          promo.brandRating && (promo.brandRating.score !== undefined || promo.brandRating.review)
      )
      .map((promo) => {
        const brand = brandMap.get(String(promo.brandId));
        return {
          brandName: brand?.brandProfile?.companyName || brand?.username || "brand",
          rating: promo.brandRating?.score ?? 0, // renamed to rating if your frontend expects it
          score: promo.brandRating?.score ?? 0,
          review: promo.brandRating?.review?.trim() || "",
          date: promo.postAt || promo.createdAt,
        };
      });


    // 7. Strip OAuth tokens and calculate platform engagement rates
    const rawStats = user.influencerProfile?.statsConnection || {};
    const sanitizedStats: Record<string, any> = {};
    const engagementRates: number[] = [];
    const engagementBreakdown: Record<string, number | null> = {
      youtube: null,
      instagram: null,
      facebook: null,
      twitter: null,
    };

    let totalCalculatedFollowers = 0;

    Object.entries(rawStats).forEach(([platform, data]: [string, any]) => {
      if (data) {
        const platformRate = calculateEngagementRateForMetrics(platform, (data.metrics || {}) as any);
        if (typeof platformRate === "number") {
          engagementRates.push(platformRate);
        }
        const pKey = platform.toLowerCase() === "x" ? "twitter" : platform.toLowerCase();
        engagementBreakdown[pKey] = platformRate;

        const count = Number(data.metrics?.followers ?? data.metrics?.subscribers ?? 0);
        if (count > 0) {
          totalCalculatedFollowers += count;
        }

        sanitizedStats[platform] = {
          platform: data.platform,
          lastSynced: data.lastSynced,
          profile: data.profile,
          metrics: {
            ...(data.metrics || {}),
            engagementRate: platformRate ?? undefined,
          },
          engagementRate: platformRate ?? undefined,
        };
      }
    });

    const calculatedAvgEngagement =
      engagementRates.length > 0
        ? Number(
            (
              engagementRates.reduce((acc, curr) => acc + curr, 0) /
              engagementRates.length
            ).toFixed(1)
          )
        : Number(user.influencerProfile?.engagement || 0);

    const totalFollowers =
      totalCalculatedFollowers > 0
        ? totalCalculatedFollowers
        : Number(user.influencerProfile?.followers || 0);

    // 8. Final clean payload
    const publicProfile = {
      _id: String(user._id),
      id: String(user._id),
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      isVerified: user.isVerified,
      rating: user.rating,
      totalReviews: user.totalReviews,
      profile: {
        followers: totalFollowers,
        niche: user.influencerProfile?.niche || "General",
        location: user.influencerProfile?.location || "",
        summary: user.influencerProfile?.summary || "",
        highlight: user.influencerProfile?.highlight || "",
        audience: user.influencerProfile?.audience || "",
        engagement: calculatedAvgEngagement,
        engagementRate: calculatedAvgEngagement,
        engagementBreakdown,
        languages: user.influencerProfile?.languages || [],
        socialLinks: user.influencerProfile?.socialLinks || {},
        featuredContent: user.influencerProfile?.featuredContent || [],
        stats: sanitizedStats,
        collaborations,
        reviews,
      },
    };


    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res.status(200).json({
      success: true,
      data: publicProfile,
    });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getPublicProfileByUsername = getPublicProfileByIdentifier;

