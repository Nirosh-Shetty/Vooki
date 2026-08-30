import { Request, Response } from "express";
import axios from "axios";
import { google } from "googleapis";
import crypto from "crypto";
import UserModel from "../models/Users";
import { IUser, SocialConnection } from "../types/user";
import { generateToken } from "../utils/generateToken";
import { getRequestUser, getRequestUserId } from "../utils/requestUser";
import {
  mergeSocialConnection,
  normalizeSocialConnectionsRecord,
  toSocialConnectionsMap,
} from "../utils/socialConnections";

const STATE_SECRET = process.env.SOCIAL_STATE_SECRET || "super-secret";
const STATE_TTL_MS = 5 * 60 * 1000; // 5 mins

const buildState = (userId: string) => {
  const payload = `${userId}:${Date.now()}`;
  const hmac = crypto.createHmac("sha256", STATE_SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}:${hmac}`;
};

const verifyState = (state?: string) => {
  if (!state) return null;
  const [encoded, signature] = state.split(":");
  if (!encoded || !signature) return null;
  const payload = Buffer.from(encoded, "base64").toString("utf-8");
  const expected = crypto.createHmac("sha256", STATE_SECRET).update(payload).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  const [userId, timestamp] = payload.split(":");
  if (!userId || !timestamp) return null;
  if (Date.now() - Number(timestamp) > STATE_TTL_MS) return null;
  return userId;
};

const ensureInfluencer = (req: Request) => getRequestUser(req)?.role === "influencer";

const requireAuthUser = (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return userId as string;
};

const AUTH_COOKIE_MAXAGE = Number(process.env.JWT_AUTH_TOKEN_MAXAGE) || 5 * 24 * 60 * 60 * 1000;

const setAuthTokenCookie = (res: Response, user: Pick<IUser, "_id" | "role" | "username">) => {
  const token = generateToken(user._id.toString(), user.role, user.username || "");
  res.cookie("auth_token", token, {
    httpOnly: true,
    domain: process.env.COOKIE_DOMAIN,
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: AUTH_COOKIE_MAXAGE,
    sameSite: (process.env.COOKIE_SAMESITE || "lax") as "lax" | "strict" | "none",
  });
};

const saveSocialConnection = async (
  user: IUser,
  platform: string,
  payload: SocialConnection
) => {
  if (!user.influencerProfile) {
    user.influencerProfile = {} as any;
  }

  const connections = toSocialConnectionsMap(user.influencerProfile!.statsConnection);

  const nextConnection = mergeSocialConnection(
    platform,
    connections.get(platform),
    payload
  );
  connections.set(platform, nextConnection);

  user.influencerProfile!.statsConnection = connections;

  user.markModified("influencerProfile.statsConnection");
  await user.save();
  return nextConnection;
};

const buildYoutubeClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BACKEND_URL}/api/social/connect/youtube/callback`
  );
};

/* ── Direct Instagram Login (no Facebook Pages) ── */

const IG_REDIRECT_URI = `${process.env.BACKEND_URL}/api/social/connect/instagram/callback`;
const IG_SCOPES = "instagram_business_basic,instagram_business_manage_insights";

const getIGAppId = () => process.env.INSTAGRAM_APP_ID || "";
const getIGAppSecret = () => process.env.INSTAGRAM_APP_SECRET || "";

const buildInstagramAuthUrl = (state: string) => {
  const params = new URLSearchParams({
    enable_fb_login: "0",
    force_authentication: "1",
    client_id: getIGAppId(),
    redirect_uri: IG_REDIRECT_URI,
    response_type: "code",
    scope: IG_SCOPES,
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
};

const exchangeIGCodeForToken = async (code: string) => {
  const { data } = await axios.post(
    "https://api.instagram.com/oauth/access_token",
    new URLSearchParams({
      client_id: getIGAppId(),
      client_secret: getIGAppSecret(),
      grant_type: "authorization_code",
      redirect_uri: IG_REDIRECT_URI,
      code,
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return { accessToken: data.access_token as string, userId: data.user_id as string };
};

const exchangeIGLongLivedToken = async (shortToken: string) => {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: getIGAppSecret(),
    access_token: shortToken,
  });
  const { data } = await axios.get(`https://graph.instagram.com/access_token?${params.toString()}`);
  return data.access_token as string;
};

const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const handleSocialCallback = async (
  state: string | undefined,
  res: Response,
  handler: (userId: string) => Promise<void>
) => {
  const userId = verifyState(state);
  if (!userId) {
    return res.status(400).json({ message: "Invalid or expired state" });
  }
  try {
    return await handler(userId);
  } catch (err: any) {
    const status = err?.status ?? 500;
    const message = err?.message ?? "Social connection failed";
    if (!res.headersSent) {
      return res.status(status).json({ message });
    }
  }
};

export const startYoutubeConnect = async (req: Request, res: Response) => {
  const userId = requireAuthUser(req, res);
  if (!userId) return;
  if (!ensureInfluencer(req)) {
    return res.status(403).json({ message: "Only influencers can connect YouTube" });
  }
  const oauth2Client = buildYoutubeClient();
  const state = buildState(userId);
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: YOUTUBE_SCOPES,
    state,
  });
  return res.status(200).json({ url });
};

export const handleYoutubeCallback = async (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  if (error) {
    return res.status(400).json({ message: "YouTube connection denied" });
  }

  await handleSocialCallback(state as string, res, async (userId) => {
    const oauth2Client = buildYoutubeClient();
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    const youtube = google.youtube("v3");
    const ytAnalytics = google.youtubeAnalytics("v2");

    // 1. Fetch channel snippet & basic stats
    const response = await youtube.channels.list({
      auth: oauth2Client,
      part: ["snippet", "statistics"],
      mine: true,
    });

    const channel = response.data.items?.[0];
    if (!channel) {
      throw { status: 400, message: "Unable to fetch YouTube channel" };
    }

    let totalLikes = 0;
    let totalComments = 0;

    // 2. Fetch channel-wide aggregate likes and comments
    try {
      const analyticsRes = await ytAnalytics.reports.query({
        auth: oauth2Client,
        ids: "channel==MINE",
        startDate: "2005-01-01",
        endDate: new Date().toISOString().split("T")[0],
        metrics: "likes,comments",
      });

      const rows = analyticsRes.data.rows;
      if (rows && rows.length > 0) {
        totalLikes = Number(rows[0][0] || 0);
        totalComments = Number(rows[0][1] || 0);
      }
    } catch (analyticsErr) {
      console.warn("Analytics API query failed, skipping aggregate engagement:", analyticsErr);
    }

    // 3. Assign metrics directly without checking channel.statistics.commentCount
    const metrics = {
      subscribers: Number(channel.statistics?.subscriberCount || 0),
      totalViews: Number(channel.statistics?.viewCount || 0),
      videoCount: Number(channel.statistics?.videoCount || 0),
      hiddenSubscriberCount: Boolean(channel.statistics?.hiddenSubscriberCount),
      likes: totalLikes,
      comments: totalComments,
    };

    const user = await UserModel.findById(userId);
    if (!user) throw { status: 404, message: "User not found" };

    await saveSocialConnection(user, "youtube", {
      platform: "youtube",
      accessToken: tokens.access_token ?? undefined,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      profile: {
        channelId: channel.id,
        title: channel.snippet?.title,
        customUrl: channel.snippet?.customUrl,
        avatarUrl:
          channel.snippet?.thumbnails?.high?.url ||
          channel.snippet?.thumbnails?.default?.url,
      },
      metrics,
      lastSynced: new Date(),
    });

    setAuthTokenCookie(res, user);
    return res.redirect(`${process.env.FRONTEND_URL}/influencer/profile?connected=youtube`);
  });
};
export const startInstagramConnect = async (req: Request, res: Response) => {
  const userId = requireAuthUser(req, res);
  if (!userId) return;
  if (!ensureInfluencer(req)) {
    return res.status(403).json({ message: "Only influencers can connect Instagram" });
  }
  const state = buildState(userId);
  const url = buildInstagramAuthUrl(state);
  return res.status(200).json({ url });
};

export const handleInstagramCallback = async (req: Request, res: Response) => {
  const { code, state, error: authError, error_reason } = req.query;

  if (authError) {
    console.error("Instagram auth error:", authError, error_reason);
    return res.redirect(
      `${process.env.FRONTEND_URL}/influencer/profile?error=instagram_denied`
    );
  }

  await handleSocialCallback(state as string, res, async (userId) => {
    // 1. Exchange code for short-lived token
    const { accessToken: shortToken, userId: igUserId } = await exchangeIGCodeForToken(
      code as string
    );

    // 2. Exchange for long-lived token (~60 days)
    const accessToken = await exchangeIGLongLivedToken(shortToken);

    // 3. Fetch profile + metrics directly from Instagram Graph API
    const { data: igProfile } = await axios.get(
      `https://graph.instagram.com/v21.0/me?fields=user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count&access_token=${accessToken}`
    );

    const metrics = {
      followers: Number(igProfile.followers_count || 0),
      following: Number(igProfile.follows_count || 0),
      mediaCount: Number(igProfile.media_count || 0),
    };

    const user = await UserModel.findById(userId);
    if (!user) throw { status: 404, message: "User not found" };

    await saveSocialConnection(user, "instagram", {
      platform: "instagram",
      accessToken,
      profile: {
        instagramId: igProfile.user_id || igUserId,
        username: igProfile.username,
        name: igProfile.name,
        accountType: igProfile.account_type,
        profilePicture: igProfile.profile_picture_url,
      },
      metrics,
      lastSynced: new Date(),
    });

    setAuthTokenCookie(res, user);
    return res.redirect(
      `${process.env.FRONTEND_URL}/influencer/profile?connected=instagram`
    );
  });
};

export const handleInstagramDisconnect = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthUser(req, res);
    if (!userId) return;

    if (!ensureInfluencer(req)) {
      return res.status(403).json({ message: "Only influencers can manage connected accounts" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const connections = toSocialConnectionsMap(
      user.influencerProfile?.statsConnection || (user as any).statsConnection
    );

    if (!connections.get("instagram")) {
      return res.status(404).json({ message: "Instagram account is not connected" });
    }

    connections.delete("instagram");

    if (user.influencerProfile) {
      user.influencerProfile.statsConnection = connections;
      user.markModified("influencerProfile.statsConnection");
    }

    await user.save();

    return res.status(200).json({
      message: "Instagram account disconnected successfully",
      platform: "instagram",
    });
  } catch (error) {
    console.error("Error in handleInstagramDisconnect:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const connectSocialAccount = async (req: Request, res: Response) => {
  const userId = requireAuthUser(req, res);
  if (!userId) return;
  if (!ensureInfluencer(req)) {
    return res.status(403).json({ message: "Only influencers can connect social accounts" });
  }
  const { platform, accessToken, refreshToken, expiresIn, profile, metadata, metrics, stats } = req.body;
  if (!platform || typeof platform !== "string") {
    return res.status(400).json({ message: "Platform is required" });
  }
  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  await saveSocialConnection(user, platform, {
    platform,
    accessToken,
    refreshToken,
    expiresAt: expiresIn ? new Date(Date.now() + Number(expiresIn) * 1000) : undefined,
    profile: typeof profile === "object" && profile ? profile : metadata,
    metrics: typeof metrics === "object" && metrics ? metrics : stats,
    lastSynced: new Date(),
  });
  return res.status(200).json({ message: "Social account connected", platform });
};

export const getSocialConnections = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthUser(req, res);
    if (!userId) return;

    // Use .lean() for fast read-only queries and plain JS objects
    const user = await UserModel.findById(userId)
      .select("statsConnection influencerProfile.statsConnection")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const source = user.influencerProfile?.statsConnection || (user as any).statsConnection;
    const rawConnections = normalizeSocialConnectionsRecord(source);

    // Sanitize to prevent leaking sensitive OAuth access/refresh tokens to the client
    const connections: Record<string, any> = {};
    if (rawConnections && typeof rawConnections === "object") {
      for (const [platform, conn] of Object.entries(rawConnections)) {
        if (!conn) continue;
        const c = conn as any;
        connections[platform] = {
          platform: c.platform || platform,
          profile: c.profile || null,
          metrics: c.metrics || null,
          lastSynced: c.lastSynced || null,
        };
      }
    }
    return res.status(200).json({ connections });
  } catch (error) {
    console.error("Error in getSocialConnections:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateSocialMetrics = async (req: Request, res: Response) => {
  const userId = requireAuthUser(req, res);
  if (!userId) return;
  const { platform, metrics, stats } = req.body;
  const nextMetrics = typeof metrics === "object" && metrics ? metrics : stats;
  if (!platform || typeof platform !== "string" || typeof nextMetrics !== "object" || !nextMetrics) {
    return res.status(400).json({ message: "Platform and stats are required" });
  }
  const user = await UserModel.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  const connections = toSocialConnectionsMap(user.statsConnection || user.influencerProfile?.statsConnection);
  if (!connections.get(platform)) {
    return res.status(404).json({ message: "Connection not found" });
  }
  await saveSocialConnection(user, platform, {
    platform,
    metrics: nextMetrics,
    lastSynced: new Date(),
  });
  return res.status(200).json({ message: "Stats updated", platform });
};

export const getConnectedAccounts = async (req: Request, res: Response) => {
  const userId = requireAuthUser(req, res);
  if (!userId) return;

  // Use .lean() for read-only queries
  const user = await UserModel.findById(userId).lean();
  if (!user) return res.status(404).json({ message: "User not found" });

  const connections: Record<string, SocialConnection> = {};
  const statsMap = user.influencerProfile?.statsConnection;

  if (statsMap) {
    // If statsMap is a Map or a plain Object from lean()
    const entries = statsMap instanceof Map
      ? Array.from(statsMap.entries())
      : Object.entries(statsMap);

    for (const [platformKey, conn] of entries) {
      if (!conn) continue;

      connections[platformKey] = {
        platform: conn.platform || platformKey,
        profile: conn.profile,
        metrics: conn.metrics,
        lastSynced: conn.lastSynced
          ? conn.lastSynced instanceof Date ? conn.lastSynced : new Date(conn.lastSynced)
          : null,
      };
    }
  }

  return res.status(200).json({ connections });
};


export const handleYoutubeDisconnect = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthUser(req, res);
    if (!userId) return;

    if (!ensureInfluencer(req)) {
      return res.status(403).json({ message: "Only influencers can manage connected accounts" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const connections = toSocialConnectionsMap(
      user.influencerProfile?.statsConnection || (user as any).statsConnection
    );

    const ytConnection = connections.get("youtube");
    if (!ytConnection) {
      return res.status(404).json({ message: "YouTube account is not connected" });
    }

    // Attempt to revoke the Google OAuth token
    const tokenToRevoke = ytConnection.refreshToken || ytConnection.accessToken;
    if (tokenToRevoke) {
      try {
        const oauth2Client = buildYoutubeClient();
        await oauth2Client.revokeToken(tokenToRevoke);
      } catch (revokeErr) {
        console.warn("Failed to revoke YouTube OAuth token with Google:", revokeErr);
      }
    }

    // Remove YouTube from the connection map
    connections.delete("youtube");

    if (user.influencerProfile) {
      user.influencerProfile.statsConnection = connections;
      user.markModified("influencerProfile.statsConnection");
    }

    if ((user as any).statsConnection) {
      (user as any).statsConnection = connections;
      user.markModified("statsConnection");
    }

    await user.save();

    return res.status(200).json({
      message: "YouTube account disconnected successfully",
      platform: "youtube",
    });
  } catch (error) {
    console.error("Error in handleYoutubeDisconnect:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};