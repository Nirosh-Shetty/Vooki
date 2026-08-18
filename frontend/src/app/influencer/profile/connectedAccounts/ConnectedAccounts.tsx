"use client";

import { CheckCircle2, Facebook, Instagram, Youtube, RefreshCw, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PlatformKey = "youtube" | "instagram" | "facebook";

export const SOCIAL_PLATFORMS: PlatformKey[] = ["youtube", "instagram", "facebook"];

// --- Type Definitions ---
export type YoutubeConnectionEntry = {
  platform: "youtube";
  profile?: {
    channelId?: string;
    title?: string;
    customUrl?: string;
    avatarUrl?: string;
  };
  metrics?: {
    subscribers?: number;
    totalViews?: number;
    videoCount?: number;
    likes?: number;
    comments?: number;
    hiddenSubscriberCount?: boolean;
  };
  lastSynced?: string;
};

export type InstagramConnectionEntry = {
  platform: "instagram";
  profile?: {
    instagramId?: string;
    username?: string;
    profilePicture?: string;
    pageId?: string;
    pageName?: string;
  };
  metrics?: {
    followers?: number;
    mediaCount?: number;
    reach?: number;
    impressions?: number;
    likes?: number;
    comments?: number;
  };
  lastSynced?: string;
};

export type FacebookConnectionEntry = {
  platform: "facebook";
  profile?: {
    pageId?: string;
    pageName?: string;
    profileUrl?: string;
  };
  metrics?: {
    followers?: number;
    likes?: number;
    comments?: number;
    engagement?: number;
  };
  lastSynced?: string;
};

export type GenericSocialConnectionEntry = {
  platform?: string;
  profile?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  lastSynced?: string;
};

export type SocialConnectionEntry =
  | YoutubeConnectionEntry
  | InstagramConnectionEntry
  | FacebookConnectionEntry
  | GenericSocialConnectionEntry;

// --- Helper Functions ---
export const isYoutubeConnection = (
  connection?: SocialConnectionEntry
): connection is YoutubeConnectionEntry => connection?.platform === "youtube";

export const isInstagramConnection = (
  connection?: SocialConnectionEntry
): connection is InstagramConnectionEntry => connection?.platform === "instagram";

export const isFacebookConnection = (
  connection?: SocialConnectionEntry
): connection is FacebookConnectionEntry => connection?.platform === "facebook";

export const formatMetric = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
};

// --- Internal Card Component ---
function SocialPlatformRow({
  platform,
  connection,
  isConnecting,
  isDisconnecting,
  onConnect,
  onDisconnect,
}: {
  platform: PlatformKey;
  connection?: SocialConnectionEntry;
  isConnecting: boolean;
  isDisconnecting: boolean;
  onConnect: (platform: PlatformKey) => void;
  onDisconnect?: (platform: PlatformKey) => void;
}) {
  const isYouTube = platform === "youtube";
  const isInsta = platform === "instagram";

  const title = isYouTube ? "YouTube" : isInsta ? "Instagram" : "Facebook";
  const Icon = isYouTube ? Youtube : isInsta ? Instagram : Facebook;

  const brandColorClass = isYouTube ? "text-red-500" : isInsta ? "text-pink-500" : "text-blue-600";

  const brandBgClass = isYouTube
    ? "bg-red-500/10 group-hover:bg-red-500 group-hover:text-white"
    : isInsta
      ? "bg-pink-500/10 group-hover:bg-pink-500 group-hover:text-white"
      : "bg-blue-600/10 group-hover:bg-blue-600 group-hover:text-white";

  const isConnected = Boolean(connection);

  let primaryMetricLabel = "Followers";
  let primaryMetricValue: number | undefined = undefined;
  let secondaryMetrics: { label: string; value?: number }[] = [];

  if (isConnected) {
    if (isYouTube && isYoutubeConnection(connection)) {
      primaryMetricLabel = "Subscribers";
      primaryMetricValue = connection.metrics?.subscribers ?? 0;
      secondaryMetrics = [
        { label: "Views", value: connection.metrics?.totalViews ?? 0 },
        { label: "Videos", value: connection.metrics?.videoCount ?? 0 },
        { label: "Likes", value: connection.metrics?.likes ?? 0 },
        { label: "Comments", value: connection.metrics?.comments ?? 0 },
      ];
    } else if (isInsta && isInstagramConnection(connection)) {
      primaryMetricLabel = "Followers";
      primaryMetricValue = connection.metrics?.followers ?? 0;
      secondaryMetrics = [
        { label: "Posts", value: connection.metrics?.mediaCount ?? 0 },
        { label: "Reach", value: connection.metrics?.reach ?? 0 },
        { label: "Impressions", value: connection.metrics?.impressions ?? 0 },
      ];
    } else if (isFacebookConnection(connection)) {
      primaryMetricLabel = "Followers";
      primaryMetricValue = connection.metrics?.followers ?? 0;
      secondaryMetrics = [
        { label: "Page Likes", value: connection.metrics?.likes ?? 0 },
        { label: "Engagement", value: connection.metrics?.engagement ?? 0 },
      ];
    }
  }

  return (
    <div className="flex flex-col p-4 rounded-2xl bg-[color:var(--vooki-app-surface-strong)]/30 border border-[color:var(--vooki-app-border)] gap-4 hover:border-[color:var(--vooki-accent)] transition-all group">
      {/* Top Section: Icon and Labeled Action Pill */}
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${brandBgClass} ${brandColorClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <div className="flex items-center bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)] rounded-lg p-0.5 shadow-xs">
              {/* Sync Button with Text */}
              <button
                type="button"
                onClick={() => onConnect(platform)}
                disabled={isConnecting || isDisconnecting}
                title="Sync live metrics"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`h-3 w-3 ${
                    isConnecting ? "animate-spin text-[color:var(--vooki-accent)]" : ""
                  }`}
                />
                <span>{isConnecting ? "Syncing..." : "Sync"}</span>
              </button>

              <div className="h-3.5 w-px bg-[color:var(--vooki-app-border)]" />

              {/* Explicit Disconnect Button with Text */}
              {onDisconnect && (
                <button
                  type="button"
                  onClick={() => onDisconnect(platform)}
                  disabled={isConnecting || isDisconnecting}
                  title={`Disconnect ${title}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Unlink className="h-3 w-3" />
                  <span>{isDisconnecting ? "Disconnecting..." : "Disconnect"}</span>
                </button>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => onConnect(platform)}
              disabled={isConnecting}
              className="h-8 px-3.5 rounded-lg text-xs font-bold transition-all bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] hover:-translate-y-0.5 shadow-sm"
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Section: Metrics & Title */}
      <div className="flex flex-col mt-2">
        <p className="text-sm font-bold text-[color:var(--vooki-app-text-strong)] flex items-center gap-1.5">
          {title} {isConnected && <CheckCircle2 className={`h-3.5 w-3.5 ${brandColorClass}`} />}
        </p>

        {isConnected ? (
          <div className="mt-2 flex flex-col gap-3">
            {/* Primary Highlight Metric */}
            <div>
              <span className="text-2xl font-black tracking-tight text-[color:var(--vooki-app-text-strong)] block">
                {formatMetric(primaryMetricValue)}
              </span>
              <span className="text-[11px] font-bold text-[color:var(--vooki-app-text-subtle)] uppercase tracking-wider">
                {primaryMetricLabel}
              </span>
            </div>

            {/* Secondary Showcase Metrics */}
            {secondaryMetrics.length > 0 && (
              <div
                className={`grid gap-2 pt-2 border-t border-[color:var(--vooki-app-border)]/60 ${
                  secondaryMetrics.length === 4
                    ? "grid-cols-4"
                    : secondaryMetrics.length === 3
                    ? "grid-cols-3"
                    : secondaryMetrics.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {secondaryMetrics.map((item) => (
                  <div key={item.label} className="flex flex-col">
                    <span className="text-xs font-bold text-[color:var(--vooki-app-text-strong)]">
                      {formatMetric(item.value)}
                    </span>
                    <span className="text-[10px] text-[color:var(--vooki-app-text-subtle)] truncate">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-1">
            <span className="text-lg font-bold tracking-tight text-[color:var(--vooki-app-text-subtle)] block">
              -
            </span>
            <span className="text-[11px] font-bold text-[color:var(--vooki-app-text-subtle)] uppercase tracking-wider">
              Not connected
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Exported Component ---
interface ConnectedAccountsProps {
  connections: Record<string, SocialConnectionEntry>;
  connecting: string | null;
  disconnecting?: string | null;
  connectError: string | null;
  onConnect: (platform: PlatformKey) => void;
  onDisconnect?: (platform: PlatformKey) => void;
}

export function ConnectedAccounts({
  connections,
  connecting,
  disconnecting,
  connectError,
  onConnect,
  onDisconnect,
}: ConnectedAccountsProps) {
  return (
    <div className="rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-sm flex flex-col lg:col-span-2">
      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)]">
          Connected Accounts
        </h3>
        <p className="text-xs text-[color:var(--vooki-app-text-subtle)] mt-1">
          Connect your platforms to automatically sync real-time metrics to your media kit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SOCIAL_PLATFORMS.map((platform) => (
          <SocialPlatformRow
            key={platform}
            platform={platform}
            connection={connections[platform]}
            isConnecting={connecting === platform}
            isDisconnecting={disconnecting === platform}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        ))}
      </div>

      {connectError && (
        <p className="mt-5 text-sm text-center text-red-500 font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
          {connectError}
        </p>
      )}
    </div>
  );
}