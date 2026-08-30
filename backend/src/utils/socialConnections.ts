import { StatsConnection as SocialConnection } from "../types/user";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toPlainRecord = (value: unknown): Record<string, unknown> => {
  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }
  if (isRecord(value) && typeof (value as { toObject?: () => unknown }).toObject === "function") {
    return toPlainRecord((value as { toObject: () => unknown }).toObject());
  }
  if (isRecord(value)) {
    return value;
  }
  return {};
};

const pickString = (value: unknown) => (typeof value === "string" && value.trim() ? value : undefined);

const pickNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
};

const pickBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  return undefined;
};

const pickDate = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
};

const compactRecord = <T extends Record<string, unknown>>(value: T): T => {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as T;
};

export const toSocialConnectionsMap = (input?: unknown) => {
  if (!input) return new Map<string, unknown>();
  if (input instanceof Map) return new Map(input.entries());
  if (Array.isArray(input)) return new Map(input as Array<[string, unknown]>);
  return new Map(Object.entries(toPlainRecord(input)));
};

export const normalizeSocialConnection = (
  platform: string,
  input?: unknown
): SocialConnection => {
  const raw = toPlainRecord(input);
  const rawProfile = toPlainRecord(raw.profile ?? raw.metadata);
  const rawMetrics = toPlainRecord(raw.metrics ?? raw.stats);

  const base = {
    platform,
    accessToken: pickString(raw.accessToken),
    refreshToken: pickString(raw.refreshToken),
    expiresAt: pickDate(raw.expiresAt),
    lastSynced: pickDate(raw.lastSynced),
  };

  if (platform === "youtube") {
    return {
      ...base,
      platform: "youtube",
      profile: compactRecord({
        channelId: pickString(rawProfile.channelId),
        title: pickString(rawProfile.title ?? rawProfile.channelTitle),
        customUrl: pickString(rawProfile.customUrl),
        avatarUrl: pickString(rawProfile.avatarUrl ?? rawProfile.profilePicture),
      }),
      metrics: compactRecord({
        subscribers: pickNumber(rawMetrics.subscribers ?? rawMetrics.followers),
        totalViews: pickNumber(rawMetrics.totalViews ?? rawMetrics.views),
        videoCount: pickNumber(rawMetrics.videoCount),
        likes: pickNumber(rawMetrics.likes),
        comments: pickNumber(rawMetrics.comments ?? rawMetrics.commentCount),
        hiddenSubscriberCount: pickBoolean(rawMetrics.hiddenSubscriberCount),
      }),
    };
  }

  if (platform === "instagram") {
    return {
      ...base,
      platform: "instagram",
      profile: compactRecord({
        instagramId: pickString(rawProfile.instagramId),
        username: pickString(rawProfile.username),
        profilePicture: pickString(rawProfile.profilePicture),
        pageId: pickString(rawProfile.pageId),
        pageName: pickString(rawProfile.pageName),
      }),
      metrics: compactRecord({
        followers: pickNumber(rawMetrics.followers ?? rawMetrics.subscribers),
        mediaCount: pickNumber(rawMetrics.mediaCount ?? rawMetrics.views),
        reach: pickNumber(rawMetrics.reach),
        impressions: pickNumber(rawMetrics.impressions),
        likes: pickNumber(rawMetrics.likes),
        comments: pickNumber(rawMetrics.comments),
      }),
    };
  }

  if (platform === "facebook") {
    return {
      ...base,
      platform: "facebook",
      profile: compactRecord({
        pageId: pickString(rawProfile.pageId),
        pageName: pickString(rawProfile.pageName),
        profileUrl: pickString(rawProfile.profileUrl),
      }),
      metrics: compactRecord({
        followers: pickNumber(rawMetrics.followers),
        likes: pickNumber(rawMetrics.likes),
        comments: pickNumber(rawMetrics.comments),
        engagement: pickNumber(rawMetrics.engagement),
      }),
    };
  }

  return {
    ...base,
    platform,
    profile: compactRecord(rawProfile),
    metrics: compactRecord(rawMetrics),
  };
};

export const mergeSocialConnection = (
  platform: string,
  existing: unknown,
  incoming: unknown
): SocialConnection => {
  const current = normalizeSocialConnection(platform, existing);
  const next = normalizeSocialConnection(platform, incoming);

  return {
    ...current,
    ...next,
    platform,
    accessToken: next.accessToken ?? current.accessToken,
    refreshToken: next.refreshToken ?? current.refreshToken,
    expiresAt: next.expiresAt ?? current.expiresAt,
    lastSynced: next.lastSynced ?? new Date(),
    profile: compactRecord({
      ...(current.profile || {}),
      ...(next.profile || {}),
    }),
    metrics: compactRecord({
      ...(current.metrics || {}),
      ...(next.metrics || {}),
    }),
  };
};

// Define a clear interface for your metrics object
export interface SocialMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  reposts?: number; // Important for X/Twitter
  followers?: number;
  subscribers?: number;
  totalViews?: number;
  views?: number;
  reach?: number;
  impressions?: number;
  engagementRate?: number;
  engagement?: number;
}

export const calculateEngagementRateForMetrics = (
  platform: string,
  metrics: SocialMetrics = {}
): number | null => {
  // 1. Use explicitly provided rates if they exist and are valid
  if (typeof metrics.engagementRate === "number" && metrics.engagementRate > 0) {
    return Number(metrics.engagementRate.toFixed(1));
  }
  if (typeof metrics.engagement === "number" && metrics.engagement > 0) {
    return Number(metrics.engagement.toFixed(1));
  }

  const p = platform.toLowerCase();

  // 2. Broaden the definition of "Interactions"
  const likes = Number(metrics.likes || 0);
  const comments = Number(metrics.comments || 0);
  const shares = Number(metrics.shares || 0);
  const saves = Number(metrics.saves || 0);
  const reposts = Number(metrics.reposts || 0);

  const interactions = likes + comments + shares + saves + reposts;

  // 3. Gather potential denominators
  const followers = Number(metrics.followers || metrics.subscribers || 0);
  const views = Number(metrics.totalViews || metrics.views || 0);
  const reach = Number(metrics.reach || metrics.impressions || 0);

  // 4. Determine the best denominator based on the platform
  let denominator = 0;

  if (p === "youtube") {
    // For video platforms, Views are the true measure of audience size
    denominator = views > 0 ? views : followers;
  } else if (p === "instagram") {
    // For IG, Reach is preferred over follower count if available
    denominator = reach > 0 ? reach : followers;
  } else {
    // For Twitter, FB, or default fallback
    denominator = followers > 0 ? followers : reach;
  }

  // 5. Calculate the true mathematical rate
  if (denominator > 0) {
    const rawRate = (interactions / denominator) * 100;

    // Apply reasonable maximum bounds to prevent skewed data on viral posts 
    // (e.g. 100 followers but 10,000 views)
    let maxBound = 15.0;
    if (p === "facebook") maxBound = 12.0;
    if (p === "twitter" || p === "x") maxBound = 10.0;

    // Notice we removed the Math.max(1.0) artificial floor. 
    // If engagement is 0.1%, it should show 0.1%.
    return Number(Math.min(maxBound, rawRate).toFixed(1));
  }

  // 6. Fallback if no audience data exists at all
  // Returning null allows your frontend UI to cleanly display a "-" or "N/A"
  return null; 
};

export const normalizeSocialConnectionsRecord = (input?: unknown) => {
  const connections = toSocialConnectionsMap(input);
  return Object.fromEntries(
    Array.from(connections.entries()).map(([platform, value]) => {
      const normalized = normalizeSocialConnection(platform, value);
      const calculatedRate = calculateEngagementRateForMetrics(platform, (normalized.metrics || {}) as SocialMetrics);
      return [
        platform,
        {
          ...normalized,
          metrics: {
            ...(normalized.metrics || {}),
            engagementRate: calculatedRate ?? undefined,
          },
          engagementRate: calculatedRate ?? undefined,
        },
      ];
    })
  ) as Record<string, SocialConnection>;
};