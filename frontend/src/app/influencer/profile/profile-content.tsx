"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Award,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Globe,
  Heart,
  ImageIcon,
  Instagram,
  LayoutDashboard,
  LockKeyhole,
  MessageCircle,
  Play,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Video,
  Youtube,
  Copy,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PlatformKey = "youtube" | "instagram";

type YoutubeConnectionEntry = {
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
    commentCount?: number;
    hiddenSubscriberCount?: boolean;
  };
  lastSynced?: string;
};

type InstagramConnectionEntry = {
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
  };
  lastSynced?: string;
};

type GenericSocialConnectionEntry = {
  platform?: string;
  profile?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  lastSynced?: string;
};

type SocialConnectionEntry =
  | YoutubeConnectionEntry
  | InstagramConnectionEntry
  | GenericSocialConnectionEntry;

type InfluencerProfile = {
  _id: string;
  role: "influencer";
  name: string;
  username?: string;
  email?: string;
  profilePicture?: string;
  rating?: number;
  totalReviews?: number;
  influencerDetails?: {
    niche?: string;
    followers?: number;
    engagement?: number;
    summary?: string;
    socialLinks?: Record<string, string>;
    highlight?: string;
    audience?: string;
    socialConnections?: Record<string, SocialConnectionEntry>;
  };
  avatar?: string;
};

type PlatformMetric = {
  label: string;
  value?: number;
};

const SOCIAL_PLATFORMS: PlatformKey[] = ["youtube", "instagram"];

const isYoutubeConnection = (
  connection?: SocialConnectionEntry
): connection is YoutubeConnectionEntry => connection?.platform === "youtube";

const isInstagramConnection = (
  connection?: SocialConnectionEntry
): connection is InstagramConnectionEntry => connection?.platform === "instagram";

const formatMetric = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
};

const formatDate = (value?: string) => {
  if (!value) return "Not synced yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently synced";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function MetricPill({
  icon: Icon,
  label,
  value,
  iconColor = "text-[color:var(--vooki-app-active-icon)]",
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  iconColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-[color:var(--vooki-app-text-soft)]">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
        {value}
      </p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--vooki-app-text-muted)]">
            {eyebrow}
          </p>
        )}
        <h2 className="text-lg font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function SocialConnectionCard({
  platform,
  connection,
  isConnecting,
  onConnect,
}: {
  platform: PlatformKey;
  connection?: SocialConnectionEntry;
  isConnecting: boolean;
  onConnect: (platform: PlatformKey) => void;
}) {
  const isYouTube = platform === "youtube";
  const typedConnection = isYouTube
    ? isYoutubeConnection(connection)
      ? connection
      : undefined
    : isInstagramConnection(connection)
      ? connection
      : undefined;

  const title = isYouTube ? "YouTube" : "Instagram";
  const Icon = isYouTube ? Youtube : Instagram;

  // Brand specific colors
  const brandColorClass = isYouTube
    ? "text-red-500 dark:text-red-500"
    : "text-pink-500 dark:text-pink-400";
  const brandBgClass = isYouTube ? "bg-red-500/10" : "bg-pink-500/10";
  const brandBorderClass = isYouTube ? "border-red-500/20" : "border-pink-500/20";

  const metrics: PlatformMetric[] = isYouTube
    ? isYoutubeConnection(typedConnection)
      ? [
        { label: "Subscribers", value: typedConnection.metrics?.subscribers },
        { label: "Total views", value: typedConnection.metrics?.totalViews },
        { label: "Videos", value: typedConnection.metrics?.videoCount },
      ].filter((item) => item.value !== undefined && item.value !== null)
      : []
    : isInstagramConnection(typedConnection)
      ? [
        { label: "Followers", value: typedConnection.metrics?.followers },
        { label: "Posts", value: typedConnection.metrics?.mediaCount },
        { label: "Reach", value: typedConnection.metrics?.reach },
      ].filter((item) => item.value !== undefined && item.value !== null)
      : [];

  const handle = isYouTube
    ? isYoutubeConnection(typedConnection)
      ? typedConnection.profile?.title || typedConnection.profile?.customUrl
      : undefined
    : isInstagramConnection(typedConnection)
      ? typedConnection.profile?.username
        ? `@${typedConnection.profile.username}`
        : typedConnection.profile?.pageName
      : undefined;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`absolute right-0 top-0 h-20 w-20 rounded-bl-full ${brandBgClass}`} />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-11 w-11 place-items-center rounded-2xl border ${brandBorderClass} ${brandBgClass}`}
          >
            <Icon className={`h-5 w-5 ${brandColorClass}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-[color:var(--vooki-app-text-strong)]">{title}</p>
              {typedConnection ? (
                <CheckCircle2 className={`h-4 w-4 ${brandColorClass}`} />
              ) : (
                <span className="h-2 w-2 rounded-full bg-[color:var(--vooki-app-border-strong)]" />
              )}
            </div>
            <p className="text-xs text-[color:var(--vooki-app-text-soft)]">
              {typedConnection ? "Connected to Vooki" : "Connect to unlock verified insights"}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => onConnect(platform)}
          disabled={isConnecting}
          className={`rounded-xl border transition-colors hover:cursor-pointer ${typedConnection
              ? "border-[color:var(--vooki-app-border-strong)] bg-transparent text-[color:var(--vooki-app-text-strong)] hover:bg-black/5 dark:hover:bg-white/10"
              : "border-transparent bg-zinc-700 text-white hover:bg-zinc-900 dark:bg-zinc-300 dark:text-zinc-900 dark:hover:bg-white shadow-sm"
            }`}
        >
          {isConnecting ? "Connecting..." : typedConnection ? "Reconnect" : "Connect"}
        </Button>
      </div>

      {typedConnection ? (
        <div className="relative mt-5 space-y-4">
          {handle && (
            <div className="flex items-center justify-between rounded-2xl bg-[color:var(--vooki-app-surface-strong)] px-3 py-2.5">
              <span className="text-xs text-[color:var(--vooki-app-text-soft)]">Account</span>
              <span className="max-w-[180px] truncate text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                {handle}
              </span>
            </div>
          )}

          {metrics.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {metrics.slice(0, 3).map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-3"
                >
                  <p className="text-[10px] uppercase tracking-wide text-[color:var(--vooki-app-text-soft)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-base font-semibold text-[color:var(--vooki-app-text-strong)]">
                    {formatMetric(item.value)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="flex items-center gap-1.5 text-xs text-[color:var(--vooki-app-text-soft)]">
            <Clock3 className="h-3.5 w-3.5" />
            Last synced {formatDate(typedConnection.lastSynced)}
          </p>
        </div>
      ) : (
        <div className="relative mt-5 rounded-2xl border border-dashed border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
          <p className="text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
            Make your profile more discoverable
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--vooki-app-text-soft)]">
            Connect {title} so Vooki can use verified channel data when matching you with relevant
            brands.
          </p>
        </div>
      )}
    </div>
  );
}

function MiniActivity({
  icon: Icon,
  title,
  meta,
}: {
  icon: typeof TrendingUp;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:var(--vooki-app-active-bg)] border border-[color:var(--vooki-app-active-border)]">
        <Icon className="h-4 w-4 text-[color:var(--vooki-app-active-icon)]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[color:var(--vooki-app-text-strong)]">{title}</p>
        <p className="mt-0.5 text-xs text-[color:var(--vooki-app-text-soft)]">{meta}</p>
      </div>
    </div>
  );
}

export function ProfileContent() {
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const searchParams = useSearchParams();
  const connectedPlatform = searchParams?.get("connected");

  const [socialConnections, setSocialConnections] = useState<Record<string, SocialConnectionEntry>>(
    {}
  );

  const handleCopyProfileLink = async () => {
    if (!profile?._id) return;

    try {
      // Constructs the full absolute URL for the clipboard
      const profileUrl = `${window.location.origin}/creator/${profile._id}`;
      await navigator.clipboard.writeText(profileUrl);

      setIsCopied(true);
      // Reset the icon back to 'copy' after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const loadConnections = async (signal: AbortSignal) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/social/connections`,
        {
          credentials: "include",
          cache: "no-store",
          signal,
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      setSocialConnections(data.connections || {});
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Failed to refresh social connections", err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/me`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Unable to load profile");

        const data: InfluencerProfile = await response.json();

        if (data.role !== "influencer") {
          throw new Error("Expected an influencer account");
        }

        setProfile(data);
        await loadConnections(controller.signal);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Profile unavailable");
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [connectedPlatform]);

  const socialEntries = useMemo(() => {
    return Object.entries(profile?.influencerDetails?.socialLinks || {}).filter(([, value]) =>
      Boolean(value)
    );
  }, [profile]);

  const connections: Record<string, SocialConnectionEntry> = {
    ...(profile?.influencerDetails?.socialConnections ?? {}),
    ...socialConnections,
  };

  const connectedCount = SOCIAL_PLATFORMS.filter((platform) =>
    Boolean(connections[platform])
  ).length;

  const profileCompleteness = useMemo(() => {
    if (!profile) return 0;

    const checks = [
      Boolean(profile.name),
      Boolean(profile.username),
      Boolean(profile.profilePicture),
      Boolean(profile.influencerDetails?.summary),
      Boolean(profile.influencerDetails?.niche),
      connectedCount > 0,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile, connectedCount]);

  const totalFollowers = useMemo(() => {
    const youtube = isYoutubeConnection(connections.youtube)
      ? (connections.youtube.metrics?.subscribers ?? 0)
      : 0;
    const instagram = isInstagramConnection(connections.instagram)
      ? (connections.instagram.metrics?.followers ?? 0)
      : 0;

    return Math.max(profile?.influencerDetails?.followers ?? 0, youtube + instagram);
  }, [connections, profile]);

  const heroStats = [
    {
      icon: Users,
      label: "Audience",
      value: formatMetric(totalFollowers),
      meta: "Across connected channels",
    },
    {
      icon: TrendingUp,
      label: "Engagement",
      value: profile?.influencerDetails?.engagement
        ? `${profile.influencerDetails.engagement.toFixed(1)}%`
        : "-",
      meta: "Profile engagement",
    },
    {
      icon: Star,
      label: "Reputation",
      value: profile?.rating ? profile.rating.toFixed(1) : "-",
      meta: `${profile?.totalReviews ?? 0} reviews`,
    },
    {
      icon: LayoutDashboard,
      label: "Channels",
      value: `${connectedCount}/${SOCIAL_PLATFORMS.length}`,
      meta: "Verified on Vooki",
    },
  ];

  const heroSummary =
    profile?.influencerDetails?.summary ??
    "Build a standout Vooki profile that helps the right brands understand your audience, content and collaboration value.";

  const heroAvatar = profile?.profilePicture || "/images/defaults/creator.svg";

  const connectEndpoints: Record<PlatformKey, string> = {
    youtube: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/social/connect/youtube`,
    instagram: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/social/connect/instagram`,
  };

  const handleConnect = async (platform: PlatformKey) => {
    setConnectError(null);
    setConnecting(platform);

    try {
      const response = await fetch(connectEndpoints[platform], {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data?.message || "Unable to build consent flow");
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      setConnectError(err instanceof Error ? err.message : "Failed to initiate connection");
    } finally {
      setConnecting(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="rounded-3xl border-[color:var(--vooki-app-border)] shadow-sm">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-[color:var(--vooki-app-text-soft)]">
            <Sparkles className="h-5 w-5 animate-pulse text-[color:var(--vooki-app-active-icon)]" />
            Preparing your Vooki creator profile...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="rounded-3xl border-red-500/20 shadow-sm bg-red-500/5">
          <CardContent className="p-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Vooki profile hero */}
      <section className="relative overflow-hidden rounded-[2rem] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] shadow-sm">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-[color:var(--vooki-app-active-bg)] via-[color:var(--vooki-app-surface-strong)] to-transparent" />

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-col gap-4">
              {/* Top Row: Avatar and Name side-by-side */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="relative shrink-0">
                  {/* Soft glow */}
                  <div className="absolute -inset-3 rounded-full bg-gradient-to-tr to-transparent blur-xl" />

                  {/* Used inline-flex to stop it from stretching full-width on mobile */}
                  <div className="relative inline-flex rounded-full bg-white p-[3px] shadow-2xl">
                    <Avatar className="h-20 w-20 sm:h-28 sm:w-28 rounded-full border-4 border-[color:var(--vooki-app-surface)]">
                      <AvatarImage
                        src={heroAvatar}
                        alt={profile.name}
                        className="object-cover object-center "
                      />

                      <AvatarFallback className="bg-white text-xl sm:text-3xl font-bold text-black">
                        {profile.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Name and Badges (Right side) */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate sm:text-3xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                      {profile.name}
                    </h3>
                    <Badge className=" shrink-0 rounded-full border-0 bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] hover:bg-[color:var(--vooki-app-active-border)] transition-colors">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Vooki Creator
                    </Badge>
                  </div>

                  <p className="mt-1 truncate text-sm text-[color:var(--vooki-app-text-soft)]">
                    @{profile.username || "creator"}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Niche & Setup progress */}
              <div className="flex flex-wrap items-center gap-2">
                {profile.influencerDetails?.niche && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-soft)]"
                  >
                    {profile.influencerDetails.niche}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="rounded-full border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-soft)]"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3 text-[color:var(--vooki-app-active-icon)]" />
                  {connectedCount > 0
                    ? `${connectedCount} verified channel${connectedCount > 1 ? "s" : ""}`
                    : "Profile setup in progress"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 xl:mt-0">
              <Button
                asChild
                className="rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-transparent text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)] shadow-sm"
              >
                <Link href="/influencer/profile/edit">Edit profile</Link>
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  className="rounded-xl border border-[color:var(--vooki-app-active-border)] bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] hover:bg-[color:var(--vooki-app-active-border)] shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    window.open(`/creator/${profile._id}`, "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview public profile
                </Button>

                <Button
                  className="rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-transparent text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)] shadow-sm transition-all cursor-pointer px-3"
                  onClick={handleCopyProfileLink}
                  title="Copy profile link"
                  aria-label="Copy profile link"
                >
                  {isCopied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
            {heroSummary}
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 backdrop-blur"
              >
                <div className="flex items-center gap-2 text-xs text-[color:var(--vooki-app-text-soft)]">
                  <stat.icon className="h-4 w-4 text-[color:var(--vooki-app-active-icon)]" />
                  {stat.label}
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-[color:var(--vooki-app-text-soft)]">{stat.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Profile readiness & Collaboration */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
        <Card className="rounded-3xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                  Vooki profile readiness
                </p>
                <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)]">
                  Complete more profile details to improve how brands discover and evaluate you.
                </p>
              </div>
              <div className="rounded-2xl bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)]  px-3 py-2 text-lg font-bold ">
                {profileCompleteness}%
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)]">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${profileCompleteness}%` }}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {!profile.influencerDetails?.summary && (
                <Badge
                  variant="outline"
                  className="border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-soft)]"
                >
                  Add creator summary
                </Badge>
              )}
              {!profile.influencerDetails?.niche && (
                <Badge
                  variant="outline"
                  className="border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-soft)]"
                >
                  Choose your niche
                </Badge>
              )}
              {connectedCount === 0 && (
                <Badge
                  variant="outline"
                  className="border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-soft)]"
                >
                  Connect social channels
                </Badge>
              )}
              {profileCompleteness >= 80 && (
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-colors hover:bg-blue-500/20">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Brand-ready profile
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] shadow-sm">
          <CardContent className="flex h-full flex-col justify-between p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--vooki-app-active-border)] bg-[color:var(--vooki-app-active-bg)]">
                <BriefcaseBusiness className="h-5 w-5 text-[color:var(--vooki-app-active-icon)]" />
              </div>
              <div>
                <p className="font-semibold text-[color:var(--vooki-app-text-strong)]">
                  Collaboration status
                </p>
                <p className="text-sm text-[color:var(--vooki-app-text-soft)]">
                  Ready for brand opportunities
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-[color:var(--vooki-app-text-soft)]">
                Preferred response
              </span>
              <span className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                Within 24 hours
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Social intelligence */}
      <section>
        <SectionHeading
          eyebrow="Social intelligence"
          title="Your connected channels"
          description="Vooki uses OAuth-connected accounts to show verified creator information and platform metrics."
        />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform) => (
            <SocialConnectionCard
              key={platform}
              platform={platform}
              connection={connections[platform]}
              isConnecting={connecting === platform}
              onConnect={handleConnect}
            />
          ))}
        </div>

        {connectError && (
          <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {connectError}
          </p>
        )}
      </section>

      {/* Main creator insights */}
      <div className="grid gap-6 lg:grid-cols-[1.65fr,1fr]">
        <div className="space-y-6">
          <Card className="rounded-3xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] shadow-sm">
            <CardHeader className="pb-3">
              <SectionHeading
                eyebrow="Creator story"
                title="What brands should know about you"
                description="The details that give brands context before they send a collaboration invite."
              />
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[color:var(--vooki-app-active-icon)]" />
                  <p className="font-semibold text-[color:var(--vooki-app-text-strong)]">
                    Your Vooki highlight
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                  {profile.influencerDetails?.highlight ??
                    "Add a strong creator highlight that tells brands what makes your content and audience valuable."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] p-5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[color:var(--vooki-app-active-icon)]" />
                    <p className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                      Core audience
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                    {profile.influencerDetails?.audience ??
                      "Add audience details such as interests, age range and the type of community you have built."}
                  </p>
                </div>

                <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] p-5">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-[color:var(--vooki-app-active-icon)]" />
                    <p className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                      Primary niche
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                    {profile.influencerDetails?.niche ??
                      "Choose a niche so Vooki can surface more relevant brand opportunities."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] shadow-sm">
            <CardHeader className="pb-3">
              <SectionHeading
                eyebrow="Collaborations"
                title="Active collaborations"
                description="High-level view of what you continue to deliver."
              />
            </CardHeader>

            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricPill
                  icon={MessageCircle}
                  label="Open invites"
                  value="2"
                  iconColor="text-blue-500 dark:text-blue-400"
                />
                <MetricPill
                  icon={CheckCircle2}
                  label="Milestones pending"
                  value="0"
                  iconColor="text-blue-500 dark:text-blue-400"
                />
                <MetricPill
                  icon={Clock3}
                  label="Payment window"
                  value="TBD"
                  iconColor="text-blue-500 dark:text-blue-400"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] shadow-sm">
            <CardHeader className="pb-3">
              <SectionHeading
                eyebrow="Portfolio"
                title="Content that represents your work"
                description="This can later be connected to your latest social posts or selected campaign deliverables."
                action={
                  <Button className="rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-transparent text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Manage portfolio
                  </Button>
                }
              />
            </CardHeader>

            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: Video,
                    title: "Video campaigns",
                    text: "Showcase your strongest short and long-form work.",
                  },
                  {
                    icon: Play,
                    title: "Sponsored content",
                    text: "Highlight content created for previous brand collaborations.",
                  },
                  {
                    icon: ImageIcon,
                    title: "Creative portfolio",
                    text: "Add visual examples that communicate your style.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="group rounded-2xl border border-dashed border-[color:var(--vooki-app-border-strong)] p-4 transition-colors hover:border-violet-500/30 hover:bg-violet-500/5 cursor-pointer"
                  >
                    <item.icon className="h-5 w-5 text-[color:var(--vooki-app-text-muted)] transition-colors group-hover:text-violet-500 dark:group-hover:text-violet-400" />
                    <p className="mt-4 text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[color:var(--vooki-app-text-soft)]">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[color:var(--vooki-app-text-strong)]">
                Creator activity
              </CardTitle>
              <CardDescription className="text-[color:var(--vooki-app-text-soft)]">
                Your recent Vooki profile signals.
              </CardDescription>
            </CardHeader>

            <CardContent className="divide-y divide-[color:var(--vooki-app-border)]">
              <MiniActivity
                icon={CheckCircle2}
                title={`${connectedCount} social channel${connectedCount === 1 ? "" : "s"} connected`}
                meta="Verified social data helps strengthen your profile."
              />
              <MiniActivity
                icon={TrendingUp}
                title="Analytics are ready"
                meta="Open your analytics dashboard to monitor channel performance."
              />
              <MiniActivity
                icon={BriefcaseBusiness}
                title="Ready for new opportunities"
                meta="Keep your profile updated to improve brand matching."
              />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[color:var(--vooki-app-text-strong)]">
                Public channels
              </CardTitle>
              <CardDescription className="text-[color:var(--vooki-app-text-soft)]">
                Links visible from your creator profile.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              {socialEntries.length > 0 ? (
                socialEntries.map(([platform, url]) => (
                  <Link
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    key={platform}
                    className="flex items-center justify-between rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] px-4 py-3 text-sm transition-colors hover:border-[color:var(--vooki-app-active-border)] hover:bg-[color:var(--vooki-app-active-bg)] group"
                  >
                    <span className="inline-flex items-center gap-2 font-medium text-[color:var(--vooki-app-text-strong)]">
                      <Globe className="h-4 w-4 text-[color:var(--vooki-app-text-muted)] group-hover:text-[color:var(--vooki-app-active-icon)] transition-colors" />
                      {platform}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[color:var(--vooki-app-text-soft)]" />
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl bg-[color:var(--vooki-app-surface-strong)] p-4 border border-[color:var(--vooki-app-border-strong)]">
                  <p className="text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                    No public links yet
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--vooki-app-text-soft)]">
                    Connected OAuth accounts can later populate your public creator profile
                    automatically.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[color:var(--vooki-app-text-strong)]">
                Trust & privacy
              </CardTitle>
              <CardDescription className="text-[color:var(--vooki-app-text-soft)]">
                Your information stays under your control.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex gap-3 rounded-2xl bg-[color:var(--vooki-app-surface-strong)] p-3 border border-[color:var(--vooki-app-border-strong)]">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--vooki-app-active-icon)]" />
                <p className="text-xs leading-5 text-[color:var(--vooki-app-text-soft)]">
                  Social connections are authorized through OAuth. Vooki does not ask for your
                  social passwords.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-[color:var(--vooki-app-border)] pt-3 text-sm">
                <span className="text-[color:var(--vooki-app-text-soft)]">Email visibility</span>
                <span className="font-medium text-[color:var(--vooki-app-text-strong)]">
                  Private
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[color:var(--vooki-app-text-soft)]">Profile handle</span>
                <span className="font-medium text-[color:var(--vooki-app-text-strong)]">
                  @{profile.username || "creator"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-3xl border border-[color:var(--vooki-app-active-border)] bg-[color:var(--vooki-app-active-bg)] shadow-sm mt-6">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[color:var(--vooki-app-active-icon)]" />
              <p className="font-semibold text-[color:var(--vooki-app-active-text)]">
                Grow your Vooki profile
              </p>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-[color:var(--vooki-app-active-text)] opacity-90">
              Connect your channels, complete your creator story and keep your analytics fresh so
              brands can make faster collaboration decisions.
            </p>
          </div>

          <Button
            asChild
            className="rounded-xl bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)] border border-[color:var(--vooki-app-border-strong)] shadow-sm"
          >
            <Link href="/influencer/profile/edit">
              Complete profile
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
