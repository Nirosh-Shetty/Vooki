import { SocialConnection } from "../types/user";

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
        commentCount: pickNumber(rawMetrics.commentCount ?? rawMetrics.engagement),
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

export const normalizeSocialConnectionsRecord = (input?: unknown) => {
  const connections = toSocialConnectionsMap(input);
  return Object.fromEntries(
    Array.from(connections.entries()).map(([platform, value]) => [
      platform,
      normalizeSocialConnection(platform, value),
    ])
  ) as Record<string, SocialConnection>;
};
