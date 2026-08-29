"use client";

import { useState } from "react";
import { CheckCircle2, Facebook, Instagram, Youtube, RefreshCw, Unlink, AlertCircle, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type PlatformKey = "youtube" | "instagram" | "facebook" | "twitter";

export const SOCIAL_PLATFORMS: PlatformKey[] = ["youtube", "instagram", "facebook", "twitter"];

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
    engagementRate?: number;
  };
  engagementRate?: number;
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
    engagementRate?: number;
  };
  engagementRate?: number;
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
    engagementRate?: number;
  };
  engagementRate?: number;
  lastSynced?: string;
};

export type TwitterConnectionEntry = {
  platform: "twitter";
  profile?: {
    twitterId?: string;
    username?: string;
    name?: string;
    profilePicture?: string;
  };
  metrics?: {
    followers?: number;
    following?: number;
    tweets?: number;
    likes?: number;
    engagementRate?: number;
  };
  engagementRate?: number;
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
  | TwitterConnectionEntry
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

export const isTwitterConnection = (
  connection?: SocialConnectionEntry
): connection is TwitterConnectionEntry => connection?.platform === "twitter";

export const formatMetric = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
};

const getPlatformTitle = (platform: PlatformKey) => {
  if (platform === "youtube") return "YouTube";
  if (platform === "instagram") return "Instagram";
  if (platform === "facebook") return "Facebook";
  return "X (Twitter)";
};

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "h-5 w-5 fill-current"} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// --- Internal Card Component ---
function SocialPlatformRow({
  platform,
  connection,
  isConnecting,
  isDisconnecting,
  onConnect,
  onRequestDisconnect,
}: {
  platform: PlatformKey;
  connection?: SocialConnectionEntry;
  isConnecting: boolean;
  isDisconnecting: boolean;
  onConnect: (platform: PlatformKey) => void;
  onRequestDisconnect?: (platform: PlatformKey) => void;
}) {
  const isYouTube = platform === "youtube";
  const isInsta = platform === "instagram";
  const isFacebook = platform === "facebook";
  const isTwitter = platform === "twitter";

  const title = getPlatformTitle(platform);
  const Icon = isYouTube ? Youtube : isInsta ? Instagram : isFacebook ? Facebook : TwitterIcon;

  const iconBgClass = isYouTube
    ? "bg-[#FEF0F0] text-[#FF0000] dark:bg-red-950/40 dark:text-red-400"
    : isInsta
    ? "bg-[#FDF0F5] text-[#E1306C] dark:bg-pink-950/40 dark:text-pink-400"
    : isFacebook
    ? "bg-[#EFF4FE] text-[#1877F2] dark:bg-blue-950/40 dark:text-blue-400"
    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100";

  const isConnected = Boolean(connection);

  let primaryMetricLabel = "FOLLOWERS";
  let primaryMetricValue: number | undefined = undefined;
  let secondaryMetrics: { label: string; value?: number }[] = [];

  if (isConnected) {
    if (isYouTube && isYoutubeConnection(connection)) {
      primaryMetricLabel = "SUBSCRIBERS";
      primaryMetricValue = connection.metrics?.subscribers ?? 0;
      secondaryMetrics = [
        { label: "Views", value: connection.metrics?.totalViews ?? 0 },
        { label: "Videos", value: connection.metrics?.videoCount ?? 0 },
        { label: "Likes", value: connection.metrics?.likes ?? 0 },
      ];
    } else if (isInsta && isInstagramConnection(connection)) {
      primaryMetricLabel = "FOLLOWERS";
      primaryMetricValue = connection.metrics?.followers ?? 0;
      secondaryMetrics = [
        { label: "Posts", value: connection.metrics?.mediaCount ?? 0 },
        { label: "Reach", value: connection.metrics?.reach ?? 0 },
        { label: "Impressions", value: connection.metrics?.impressions ?? 0 },
      ];
    } else if (isFacebookConnection(connection)) {
      primaryMetricLabel = "FOLLOWERS";
      primaryMetricValue = connection.metrics?.followers ?? 0;
      secondaryMetrics = [
        { label: "Page Likes", value: connection.metrics?.likes ?? 0 },
        { label: "Engagement", value: connection.metrics?.engagement ?? 0 },
      ];
    } else if (isTwitter && isTwitterConnection(connection)) {
      primaryMetricLabel = "FOLLOWERS";
      primaryMetricValue = connection.metrics?.followers ?? 0;
      secondaryMetrics = [
        { label: "Following", value: connection.metrics?.following ?? 0 },
        { label: "Posts", value: connection.metrics?.tweets ?? 0 },
        { label: "Likes", value: connection.metrics?.likes ?? 0 },
      ];
    }
  }

  return (
    <div className="rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 flex flex-col justify-between shadow-xs transition-all hover:border-[color:var(--vooki-app-active-border)] min-h-[270px] group">
      {/* Top Row: Icon + Connect / Sync Actions */}
      <div className="flex items-center justify-between">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBgClass}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <div className="flex items-center bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] rounded-lg p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => onConnect(platform)}
                disabled={isConnecting || isDisconnecting}
                title="Sync live metrics"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface)] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`h-3 w-3 ${
                    isConnecting ? "animate-spin text-[color:var(--vooki-accent)]" : ""
                  }`}
                />
                <span>{isConnecting ? "Syncing..." : "Sync"}</span>
              </button>

              <div className="h-3.5 w-px bg-[color:var(--vooki-app-border)]" />

              {onRequestDisconnect && (
                <button
                  type="button"
                  onClick={() => onRequestDisconnect(platform)}
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
              className="h-8 px-3.5 rounded-lg text-xs font-bold transition-all bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] hover:-translate-y-0.5 shadow-sm cursor-pointer"
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>
      </div>

      {/* Middle Section: Name + Primary Metric */}
      <div className="mt-6 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-base text-[color:var(--vooki-app-text-strong)]">
            {title}
          </span>
          {isConnected && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
        </div>

        <p className="text-3xl font-extrabold tracking-tight text-[color:var(--vooki-app-text-strong)]">
          {isConnected && primaryMetricValue !== undefined
            ? formatMetric(primaryMetricValue)
            : "-"}
        </p>

        <p className="text-[10px] font-bold tracking-wider uppercase text-[color:var(--vooki-app-text-muted)]">
          {primaryMetricLabel}
        </p>
      </div>

      {/* Bottom Row: Detailed Metrics OR Unconnected State */}
      <div className="mt-6 pt-4 border-t border-[color:var(--vooki-app-border-strong)]">
        {isConnected && secondaryMetrics.length > 0 ? (
          <div
            className={`grid gap-1 text-center ${
              secondaryMetrics.length === 3
                ? "grid-cols-3"
                : secondaryMetrics.length === 2
                ? "grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {secondaryMetrics.map((item) => (
              <div key={item.label}>
                <p className="text-xs font-bold text-[color:var(--vooki-app-text-strong)]">
                  {formatMetric(item.value)}
                </p>
                <span className="text-[10px] text-[color:var(--vooki-app-text-muted)]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-xs text-[color:var(--vooki-app-text-muted)] py-1">
            {isConnected ? "No additional data" : "Not connected yet"}
          </p>
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
  const [platformToDisconnect, setPlatformToDisconnect] = useState<PlatformKey | null>(null);

  const confirmDisconnect = () => {
    if (!platformToDisconnect) return;
    onDisconnect?.(platformToDisconnect);
    setPlatformToDisconnect(null);
  };

  return (
    <>
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[color:var(--vooki-app-text-strong)] flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[color:var(--vooki-app-active-icon)]" />
              <span>Connected Accounts</span>
            </h2>
            <p className="text-xs text-[color:var(--vooki-app-text-subtle)] mt-0.5">
              Connect your platforms to automatically sync real-time metrics to your media kit.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SOCIAL_PLATFORMS.map((platform) => (
            <SocialPlatformRow
              key={platform}
              platform={platform}
              connection={connections[platform]}
              isConnecting={connecting === platform}
              isDisconnecting={disconnecting === platform}
              onConnect={onConnect}
              onRequestDisconnect={(p) => setPlatformToDisconnect(p)}
            />
          ))}
        </div>

        {connectError && (
          <p className="mt-4 text-sm text-center text-red-500 font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
            {connectError}
          </p>
        )}
      </section>

      {/* Disconnect Confirmation Modal */}
      {platformToDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center zoom-in-95 animate-in duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              Disconnect {getPlatformTitle(platformToDisconnect)}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Are you sure you want to disconnect your {getPlatformTitle(platformToDisconnect)} account? Live metrics will no longer sync automatically.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setPlatformToDisconnect(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}