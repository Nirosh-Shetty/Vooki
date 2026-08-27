import { Request, Response } from "express";
import UserModel from "../../models/Users";
import PromotionModel from "../../models/Promotion";

export const getPublicProfileByUsername = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { username } = req.params;

    // 1. Regex check
    if (!username || !/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // 2. Query influencer
    const user = await UserModel.findOne({
      username: username.toLowerCase(),
      role: "influencer",
      isTempAccount: false,
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
      })
      .lean();

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
        "brandDetails.companyName": 1,
      })
      .lean();

    const brandMap = new Map(brands.map((b) => [String(b._id), b]));

    // 5. Structure "Previous Collaborations" strictly
    const collaborations = promotions.map((promo) => {
      const brand = brandMap.get(String(promo.brandId));
      return {
        brandName: brand?.brandDetails?.companyName || brand?.username || "brand",
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
          brandName: brand?.brandDetails?.companyName || brand?.username || "brand",
          rating: promo.brandRating?.score ?? 0, // renamed to rating if your frontend expects it
          score: promo.brandRating?.score ?? 0,
          review: promo.brandRating?.review?.trim() || "",
          date: promo.postAt || promo.createdAt,
        };
      });


    // 7. Strip OAuth tokens from statsConnection
    const rawStats = user.influencerProfile?.statsConnection || {};
    const sanitizedStats: Record<string, any> = {};

    Object.entries(rawStats).forEach(([platform, data]: [string, any]) => {
      if (data) {
        sanitizedStats[platform] = {
          platform: data.platform,
          lastSynced: data.lastSynced,
          profile: data.profile,
          metrics: data.metrics,
        };
      }
    });

    // 8. Final clean payload
    const publicProfile = {
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      isVerified: user.isVerified,
      rating: user.rating,
      totalReviews: user.totalReviews,
      profile: {
        followers: user.influencerProfile?.followers || 0,
        niche: user.influencerProfile?.niche || "General",
        location: user.influencerProfile?.location || "",
        summary: user.influencerProfile?.summary || "",
        highlight: user.influencerProfile?.highlight || "",
        audience: user.influencerProfile?.audience || "",
        engagement: user.influencerProfile?.engagement || 0,
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
