import { Request, Response } from "express";
import UserModel from "../models/Users";
import PromotionModel from "../models/Promotion";
import { Earning } from "../models/Earning";
import { getRequestUser } from "../utils/requestUser";
import { normalizeSocialConnectionsRecord } from "../utils/socialConnections";

/**
 * GET /api/analytics/creator/me
 *
 * Returns a comprehensive analytics payload for the authenticated creator,
 * aggregating data from social connections, promotions, and earnings.
 */
export const getCreatorAnalytics = async (req: Request, res: Response) => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    if (requester.role !== "influencer") {
      return res.status(403).json({ success: false, error: "Only creators can access creator analytics" });
    }

    const userId = String(requester.id);

    // Fetch user, promotions, and earnings in parallel
    const [user, promotions, earnings] = await Promise.all([
      UserModel.findById(userId)
        .select("name username avatar influencerProfile rating totalReviews isVerified createdAt")
        .lean(),
      PromotionModel.find({ influencerId: userId })
        .sort({ createdAt: -1 })
        .lean(),
      Earning.find({ influencerId: userId }).lean(),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // ── Social Platform Metrics ──
    const socialConnections = normalizeSocialConnectionsRecord(
      user?.influencerProfile?.statsConnection
    );

    const platforms: Record<string, any> = {};
    const engagementRates: number[] = [];

    Object.entries(socialConnections).forEach(([platform, data]: [string, any]) => {
      if (!data) return;

      const metrics = data.metrics || {};
      const profile = data.profile || {};

      if (platform === "youtube") {
        const subs = Number(metrics.subscribers || 0);
        const views = Number(metrics.totalViews || 0);
        const likes = Number(metrics.likes || 0);
        const comments = Number(metrics.comments || 0);
        const videoCount = Number(metrics.videoCount || 0);
        const engRate = subs > 0 ? Number((((likes + comments) / Math.max(videoCount, 1)) / subs * 100).toFixed(2)) : 0;

        if (engRate > 0) engagementRates.push(engRate);

        platforms.youtube = {
          connected: true,
          profile: {
            title: profile.title || "",
            customUrl: profile.customUrl || "",
            avatarUrl: profile.avatarUrl || "",
            channelId: profile.channelId || "",
          },
          metrics: {
            subscribers: subs,
            totalViews: views,
            videoCount,
            likes,
            comments,
            engagementRate: engRate,
          },
          lastSynced: data.lastSynced || null,
        };
      }

      if (platform === "instagram") {
        const followers = Number(metrics.followers || 0);
        const following = Number(metrics.following || 0);
        const mediaCount = Number(metrics.mediaCount || 0);
        // IG doesn't give us engagement data from the basic API, calculate from collabs later
        const engRate = Number(user?.influencerProfile?.engagement || 0);
        if (engRate > 0) engagementRates.push(engRate);

        platforms.instagram = {
          connected: true,
          profile: {
            username: profile.username || "",
            name: profile.name || "",
            profilePicture: profile.profilePicture || "",
            accountType: profile.accountType || "",
          },
          metrics: {
            followers,
            following,
            mediaCount,
            engagementRate: engRate,
          },
          lastSynced: data.lastSynced || null,
        };
      }
    });

    // Fill in disconnected platforms
    if (!platforms.youtube) platforms.youtube = { connected: false };
    if (!platforms.instagram) platforms.instagram = { connected: false };

    // ── Aggregate Engagement Rate ──
    const avgEngagement = engagementRates.length > 0
      ? Number((engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length).toFixed(2))
      : Number(user?.influencerProfile?.engagement || 0);

    // ── Promotion / Collaboration Performance ──
    let totalReach = 0;
    let totalViews = 0;
    let totalEngagement = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let completedCollabs = 0;
    let activeCollabs = 0;

    const activeStatuses = ["accepted", "content_in_progress", "posted", "metrics_submitted", "payment_pending"];
    const completedStatuses = ["completed"];

    const collaborationList = promotions.map((promo: any) => {
      const perf = promo.performance || {};
      const reach = Number(perf.reach || 0);
      const views = Number(perf.views || 0);
      const engagement = Number(perf.engagement || 0);
      const clicks = Number(perf.clicks || 0);
      const conversions = Number(perf.conversions || 0);

      totalReach += reach;
      totalViews += views;
      totalEngagement += engagement;
      totalClicks += clicks;
      totalConversions += conversions;

      if (completedStatuses.includes(promo.status)) completedCollabs++;
      if (activeStatuses.includes(promo.status)) activeCollabs++;

      return {
        id: String(promo._id),
        campaignTitle: promo.campaignTitle || "Untitled",
        brandId: promo.brandId,
        status: promo.status,
        deliverables: promo.deliverables || [],
        paymentAmount: Number(promo.paymentAmount || 0),
        paymentStatus: promo.paymentStatus || "pending",
        performance: { reach, views, engagement, clicks, conversions },
        postAt: promo.postAt,
        createdAt: promo.createdAt,
      };
    });

    // Enrich with brand names
    const brandIds = [...new Set(collaborationList.map((c: any) => c.brandId).filter(Boolean))];
    const brands = brandIds.length
      ? await UserModel.find({ _id: { $in: brandIds } }).select("_id name username avatar").lean()
      : [];
    const brandMap = new Map(brands.map((b: any) => [String(b._id), b]));

    const enrichedCollabs = collaborationList.map((c: any) => {
      const brand = brandMap.get(String(c.brandId));
      return {
        ...c,
        brandName: brand?.name || "Unknown Brand",
        brandHandle: brand?.username ? `@${brand.username}` : "",
        brandAvatar: brand?.avatar || "",
      };
    });

    // Top performing collabs (by reach, completed only)
    const topCollabs = [...enrichedCollabs]
      .filter((c) => c.performance.reach > 0 || c.performance.views > 0)
      .sort((a, b) => (b.performance.reach + b.performance.views) - (a.performance.reach + a.performance.views))
      .slice(0, 5);

    // ── Earnings Summary ──
    const earningsSummary = {
      totalEarned: 0,
      pending: 0,
      readyForPayment: 0,
      failed: 0,
      byMethod: { direct: 0, escrow: 0 },
      totalTransactions: earnings.length,
    };

    earnings.forEach((earning: any) => {
      const amount = Number(earning.amount || 0);
      if (earning.status === "paid") {
        earningsSummary.totalEarned += amount;
      } else if (earning.status === "pending") {
        earningsSummary.pending += amount;
      } else if (earning.status === "ready_for_payment") {
        earningsSummary.readyForPayment += amount;
      } else if (earning.status === "failed") {
        earningsSummary.failed += amount;
      }
      if (earning.paymentMethod === "direct") earningsSummary.byMethod.direct += amount;
      if (earning.paymentMethod === "escrow") earningsSummary.byMethod.escrow += amount;
    });

    // ── Response ──
    return res.json({
      success: true,
      data: {
        // Hero summary
        summary: {
          totalReach,
          totalViews,
          totalEngagement,
          totalClicks,
          totalConversions,
          engagementRate: avgEngagement,
          totalEarned: earningsSummary.totalEarned,
          completedCollabs,
          activeCollabs,
          totalCollabs: promotions.length,
        },
        // Platform breakdown
        platforms,
        // Collaboration performance
        collaborations: enrichedCollabs,
        topCollaborations: topCollabs,
        // Earnings overview
        earnings: earningsSummary,
      },
    });
  } catch (error) {
    console.error("Error fetching creator analytics:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch analytics" });
  }
};
