import { Request, Response } from "express";
import UserModel from "../models/Users";
import PromotionModel from "../models/Promotion";
import { Earning } from "../models/Earning";
import { getRequestUser } from "../utils/requestUser";
import { normalizeSocialConnectionsRecord } from "../utils/socialConnections";
import CampaignModel from "../models/Campaign";
// import { Payment } from "../models/Payment";
import mongoose from "mongoose";
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

/**
 * GET /api/analytics/brand/me
/**
 * GET /api/analytics/brand/me
 *
 * Returns a comprehensive analytics payload for the authenticated brand,
 * pre-calculated using MongoDB aggregation pipelines for optimal performance.
 */
export const getBrandAnalytics = async (req: Request, res: Response) => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    if (requester.role !== "brand") {
      return res.status(403).json({ success: false, error: "Only brands can access brand analytics" });
    }

    const brandObjectId = new mongoose.Types.ObjectId(requester.id as string);
    const { range = "all" } = req.query;

    let dateMatch: any = {};
    if (range !== "all") {
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
      dateMatch = { createdAt: { $gte: new Date(Date.now() - days * 86400000) } };
    }

    const matchStage = { $match: { brandId: brandObjectId, ...dateMatch } };

    // Execute aggregations concurrently for high performance
    const [
      campaignStatsRes,
      promoStatsRes,
      pipelineData,
      budgetChartData,
      topCreatorsData,
      campaignPerfData,
      promoTrend,
      campaignTrend
    ] = await Promise.all([
      // 1. Campaign Hero Stats
      CampaignModel.aggregate([
        matchStage,
        {
          $group: {
            _id: null,
            totalBudget: { $sum: "$budgetTotal" },
            totalSpent: { $sum: "$budgetSpent" },
            activeCampaigns: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            totalRoi: { $sum: { $cond: [{ $gt: ["$roi", 0] }, "$roi", 0] } },
            roiCount: { $sum: { $cond: [{ $gt: ["$roi", 0] }, 1, 0] } }
          }
        }
      ]),
      // 2. Promotion Hero Stats
      PromotionModel.aggregate([
        matchStage,
        {
          $group: {
            _id: null,
            totalReach: { $sum: "$performance.reach" },
            totalViews: { $sum: "$performance.views" },
            totalEngagement: { $sum: "$performance.engagement" },
            liveCollabs: { $sum: { $cond: [{ $ne: ["$status", "completed"] }, 1, 0] } },
            completedCollabs: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            uniqueCreators: { $addToSet: "$influencerId" }
          }
        }
      ]),
      // 3. Pipeline Counts
      PromotionModel.aggregate([
        matchStage,
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      // 4. Budget Utilization Chart
      CampaignModel.aggregate([
        { $match: { brandId: brandObjectId, status: { $in: ["active", "completed", "paused"] }, ...dateMatch } },
        { $sort: { budgetTotal: -1 } },
        { $limit: 6 },
        { $project: { _id: 0, name: 1, Budget: "$budgetTotal", Spent: "$budgetSpent" } }
      ]),
      // 5. Top Creators
      PromotionModel.aggregate([
        matchStage,
        {
          $group: {
            _id: "$influencerId",
            name: { $first: "$influencerName" },
            handle: { $first: "$influencerHandle" },
            reach: { $sum: "$performance.reach" },
            views: { $sum: "$performance.views" },
            collabs: { $sum: 1 }
          }
        },
        { $sort: { reach: -1, views: -1 } },
        { $limit: 5 }
      ]),
      // 6. Campaign Performance with Lookups
      CampaignModel.aggregate([
        { $match: { brandId: brandObjectId, status: { $ne: "draft" }, ...dateMatch } },
        { $sort: { roi: -1, budgetSpent: -1 } },
        { $limit: 6 },
        {
          $lookup: {
            from: "promotions",
            localField: "_id",
            foreignField: "campaignId",
            as: "promos"
          }
        },
        {
          $project: {
            id: "$_id",
            name: 1,
            niche: 1,
            status: 1,
            roi: 1,
            budgetTotal: 1,
            budgetSpent: 1,
            promoCount: { $size: "$promos" },
            reach: { $sum: "$promos.performance.reach" }
          }
        }
      ]),
      // 7. Trends (Promotions)
      PromotionModel.aggregate([
        { $match: { brandId: brandObjectId, paymentStatus: "paid", ...dateMatch } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$updatedAt" } },
            Spent: { $sum: "$paymentAmount" }
          }
        }
      ]),
      // 8. Trends (Campaigns)
      CampaignModel.aggregate([
        matchStage,
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            Budget: { $sum: "$budgetTotal" }
          }
        }
      ])
    ]);

    // Format stats
    const cStats = campaignStatsRes[0] || { totalBudget: 0, totalSpent: 0, activeCampaigns: 0, totalRoi: 0, roiCount: 0 };
    const pStats = promoStatsRes[0] || { totalReach: 0, totalViews: 0, totalEngagement: 0, liveCollabs: 0, completedCollabs: 0, uniqueCreators: [] };

    const avgRoi = cStats.roiCount > 0 ? cStats.totalRoi / cStats.roiCount : 0;
    const cpv = pStats.totalViews > 0 ? cStats.totalSpent / pStats.totalViews : 0;
    const cpe = pStats.totalEngagement > 0 ? cStats.totalSpent / pStats.totalEngagement : 0;

    const stats = {
      totalBudget: cStats.totalBudget,
      totalSpent: cStats.totalSpent,
      avgRoi,
      totalReach: pStats.totalReach,
      totalViews: pStats.totalViews,
      totalEngagement: pStats.totalEngagement,
      liveCollabs: pStats.liveCollabs,
      completedCollabs: pStats.completedCollabs,
      uniqueCreators: pStats.uniqueCreators.length,
      activeCampaigns: cStats.activeCampaigns,
      cpv,
      cpe
    };

    // Format Pipeline
    const pipelineCounts = {
      requested: 0, negotiating: 0, accepted: 0, content_in_progress: 0,
      posted: 0, metrics_submitted: 0, payment_pending: 0, completed: 0
    };
    let pipelineTotal = 0;
    pipelineData.forEach(p => {
      if (p._id in pipelineCounts) {
        pipelineCounts[p._id as keyof typeof pipelineCounts] = p.count;
        pipelineTotal += p.count;
      }
    });

    // Merge Trends
    const trendsMap: Record<string, { month: string; Spent: number; Budget: number }> = {};
    const parseMonth = (ym: string) => {
      const [year, m] = ym.split("-");
      const d = new Date(Number(year), Number(m) - 1);
      return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    };

    promoTrend.forEach(t => {
      if (!t._id) return;
      trendsMap[t._id] = { month: parseMonth(t._id), Spent: t.Spent, Budget: 0 };
    });
    campaignTrend.forEach(t => {
      if (!t._id) return;
      if (!trendsMap[t._id]) trendsMap[t._id] = { month: parseMonth(t._id), Spent: 0, Budget: 0 };
      trendsMap[t._id].Budget = t.Budget;
    });

    const spendingTrend = Object.entries(trendsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    // Format Top Creators
    const topCreators = topCreatorsData.map(c => ({
      id: String(c._id),
      name: c.name || "Creator",
      handle: c.handle || "",
      reach: c.reach,
      views: c.views,
      collabs: c.collabs
    }));

    return res.json({
      success: true,
      data: {
        stats,
        pipelineCounts,
        pipelineTotal,
        spendingTrend,
        budgetChartData,
        topCreators,
        campaignPerf: campaignPerfData,
        hasData: cStats.totalBudget > 0 || pStats.totalReach > 0
      },
    });
  } catch (error) {
    console.error("Error fetching brand analytics:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch analytics" });
  }
};
