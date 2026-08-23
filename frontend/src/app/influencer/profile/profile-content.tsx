"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { CollaborationsCard } from "./collaboration/Collaboration";
import { ReviewsCard } from "./review/Review";
import {
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
  Grid,
  Info,
  LayoutDashboard,
  MapPin,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Youtube,
  Instagram,
  Facebook,
} from "lucide-react";

import { Portfolio } from "./portfolio/Portfolio";
import { AboutCard } from "./about/About";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  ConnectedAccounts,
  SOCIAL_PLATFORMS,
  PlatformKey,
  SocialConnectionEntry,
  isYoutubeConnection,
  isInstagramConnection,
  isFacebookConnection,
  formatMetric,
} from "./connectedAccounts/ConnectedAccounts";

type PortfolioItem = {
  id: string;
  category: "video" | "sponsored" | "image";
  url: string;
  brand?: string;
};

type CollabHistory = {
  id: string;
  brand: string;
  campaign: string;
  date: string;
};

type ReviewType = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
};

type ShowcaseItem = {
  _id: string;
  url: string;
};

type InfluencerProfile = {
  _id: string;
  role: "influencer";
  name: string;
  username?: string;
  email?: string;
  profilePicture?: string;
  rating?: number;
  totalReviews?: number;
  influencerProfile?: {
    niche?: string;
    location?: string;
    languages?: string[];
    followers?: number;
    engagement?: number;
    summary?: string;
    socialLinks?: Record<string, string>;
    highlight?: string;
    audience?: string;
    socialConnection?: Record<string, SocialConnectionEntry>;
    featuredContent?: ShowcaseItem[];
    pastCollaborations?: CollabHistory[];
    reviews?: ReviewType[];
  };
  avatar?: string;
};

type PromotionSummary = {
  id: string;
  brandId?: string;
  brandName?: string;
  campaignTitle?: string;
  product?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  postAt?: string;
  brandRating?: { score?: number; review?: string };
  deliverySubmission?: { reviewedAt?: string };
};

const formatHistoryDate = (value?: string) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export function ProfileContent() {
  const [disconnecting, setDisconnecting] = useState<PlatformKey | null>(null);
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [liveCollabs, setLiveCollabs] = useState<CollabHistory[]>([]);
  const [liveReviews, setLiveReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<PlatformKey | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [activeTab, setActiveTab] = useState<"about" | "connections">("about");
  const searchParams = useSearchParams();
  const connectedPlatform = searchParams?.get("connected");

  const [socialConnection, setsocialConnection] = useState<Record<string, SocialConnectionEntry>>(
    {}
  );

  const handleDisconnect = async (platform: PlatformKey) => {
    setConnectError(null);
    setDisconnecting(platform);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/social/connect/${platform}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to disconnect platform");

      setsocialConnection((prev) => {
        const updated = { ...prev };
        delete updated[platform];
        return updated;
      });

      if (profile?.influencerProfile?.socialConnection) {
        delete profile.influencerProfile.socialConnection[platform];
      }
    } catch (err: unknown) {
      setConnectError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setDisconnecting(null);
    }
  };

  const handleCopyProfileLink = async () => {
    if (!profile?._id) return;
    try {
      const profileUrl = `${window.location.origin}/creator/${profile._id}`;
      await navigator.clipboard.writeText(profileUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const loadConnections = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/social/connections`,
        { credentials: "include", cache: "no-store", signal }
      );
      if (!response.ok) return;
      const data = await response.json();
      setsocialConnection(data.connections || {});
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }, []);

  const loadPromotions = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions?status=all&limit=50`,
        { credentials: "include", cache: "no-store", signal }
      );
      if (!response.ok) return;
      const data = await response.json();
      const items: PromotionSummary[] = Array.isArray(data?.items) ? data.items : [];

      const collabs = items
        .filter((promotion) => promotion.campaignTitle || promotion.product)
        .map((promotion) => ({
          id: promotion.id,
          brand: promotion.brandName || "Brand",
          campaign: promotion.campaignTitle || promotion.product || "Campaign",
          date: formatHistoryDate(promotion.updatedAt || promotion.createdAt || promotion.postAt),
        }));

      const reviews = items
        .filter((promotion) => typeof promotion.brandRating?.score === "number")
        .map((promotion) => ({
          id: promotion.id,
          author: promotion.brandName || "Brand",
          rating: Number(promotion.brandRating?.score || 0),
          text: promotion.brandRating?.review || "",
          date: formatHistoryDate(
            promotion.deliverySubmission?.reviewedAt || promotion.updatedAt || promotion.createdAt
          ),
        }));

      setLiveCollabs(collabs);
      setLiveReviews(reviews);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }, []);

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
        if (data.role !== "influencer") throw new Error("Expected an influencer account");

        setProfile(data);
        await Promise.all([loadConnections(controller.signal), loadPromotions(controller.signal)]);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Profile unavailable");
      } finally {
        setLoading(false);
      }
    };

    load();

    if (connectedPlatform) {
      setActiveTab("connections");
      window.history.replaceState({}, "", window.location.pathname);
    }

    return () => controller.abort();
  }, [connectedPlatform, loadConnections, loadPromotions]);

  const connections: Record<string, SocialConnectionEntry> = useMemo(() => {
    return {
      ...(profile?.influencerProfile?.socialConnection ?? {}),
      ...socialConnection,
    };
  }, [profile?.influencerProfile?.socialConnection, socialConnection]);

  const connectedCount = SOCIAL_PLATFORMS.filter((platform) =>
    Boolean(connections[platform])
  ).length;

  const platformFollowers = useMemo(() => {
    const youtube = isYoutubeConnection(connections.youtube)
      ? (connections.youtube.metrics?.subscribers ?? 0)
      : null;
    const instagram = isInstagramConnection(connections.instagram)
      ? (connections.instagram.metrics?.followers ?? 0)
      : null;
    const facebook = isFacebookConnection(connections.facebook)
      ? (connections.facebook.metrics?.followers ?? 0)
      : null;

    return { youtube, instagram, facebook };
  }, [connections]);

  const totalFollowers = useMemo(() => {
    const { youtube, instagram, facebook } = platformFollowers;
    const total = (youtube ?? 0) + (instagram ?? 0) + (facebook ?? 0);
    if (total === 0 && connectedCount === 0) return undefined;
    return total;
  }, [platformFollowers, connectedCount]);

  const derivedReviewCount = liveReviews.length || profile?.totalReviews || 0;
  const derivedRating =
    liveReviews.length > 0
      ? liveReviews.reduce((sum, review) => sum + review.rating, 0) / liveReviews.length
      : (profile?.rating ?? 0);

  const heroStats = [
    {
      icon: Users,
      label: "Audience",
      value: formatMetric(totalFollowers),
      customBreakdown: (
        <div className="mt-2.5 flex items-center gap-3">
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              platformFollowers.youtube !== null
                ? "text-[color:var(--vooki-app-text-strong)]"
                : "text-[color:var(--vooki-app-text-soft)]/50"
            }`}
            title="YouTube Subscribers"
          >
            <Youtube className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span>
              {platformFollowers.youtube !== null ? formatMetric(platformFollowers.youtube) : "-"}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              platformFollowers.instagram !== null
                ? "text-[color:var(--vooki-app-text-strong)]"
                : "text-[color:var(--vooki-app-text-soft)]/50"
            }`}
            title="Instagram Followers"
          >
            <Instagram className="h-3.5 w-3.5 text-pink-500 shrink-0" />
            <span>
              {platformFollowers.instagram !== null
                ? formatMetric(platformFollowers.instagram)
                : "-"}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              platformFollowers.facebook !== null
                ? "text-[color:var(--vooki-app-text-strong)]"
                : "text-[color:var(--vooki-app-text-soft)]/50"
            }`}
            title="Facebook Followers"
          >
            <Facebook className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>
              {platformFollowers.facebook !== null ? formatMetric(platformFollowers.facebook) : "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      icon: TrendingUp,
      label: "Engagement",
      value: profile?.influencerProfile?.engagement
        ? `${profile.influencerProfile.engagement.toFixed(1)}%`
        : "-",
    },
    {
      icon: Star,
      label: "Rating",
      value: derivedRating ? derivedRating.toFixed(1) : "-",
    },
    {
      icon: LayoutDashboard,
      label: "Connected Accounts",
      value: `${connectedCount} / ${SOCIAL_PLATFORMS.length}`,
    },
  ];

  const previousCollaborations =
    liveCollabs.length > 0 ? liveCollabs : profile?.influencerProfile?.pastCollaborations || [];
  const reviews = liveReviews.length > 0 ? liveReviews : profile?.influencerProfile?.reviews || [];

  const heroAvatar = profile?.avatar || "/images/defaults/creator.svg";

  const connectEndpoints: Record<PlatformKey, string> = {
    youtube: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/social/connect/youtube`,
    instagram: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/social/connect/instagram`,
    facebook: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/social/connect/facebook`,
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
      if (!response.ok || !data.url) throw new Error(data?.message || "Unable to connect");
      window.location.href = data.url;
    } catch (err: unknown) {
      setConnectError(err instanceof Error ? err.message : "Failed to initiate connection");
      setConnecting(null);
    }
  };

  if (loading)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center text-sm">Loading profile...</CardContent>
        </Card>
      </div>
    );

  if (error)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Card className="bg-red-500/5">
          <CardContent className="p-6 text-sm text-red-500">{error}</CardContent>
        </Card>
      </div>
    );

  if (!profile) return null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2rem] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] shadow-xs">
        {/* Universal Creator Banner */}
        <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-gradient-to-br from-[color:var(--vooki-app-active-bg)]/70 via-[color:var(--vooki-app-surface-strong)] to-[color:var(--vooki-app-active-bg)]/40">
          <div
            className="absolute inset-0 opacity-[0.14] dark:opacity-[0.20]"
            style={{
              backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
            }}
          />

          <div className="absolute -top-8 left-1/4 h-28 w-28 rounded-full bg-[color:var(--vooki-app-active-bg)] blur-2xl opacity-60 pointer-events-none" />
          <div className="absolute top-2 right-10 h-24 w-36 rounded-full bg-[color:var(--vooki-app-active-border)] blur-2xl opacity-40 pointer-events-none" />

          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[color:var(--vooki-app-surface)] via-[color:var(--vooki-app-surface)]/60 to-transparent" />
        </div>

        {/* Hero Body Content */}
        <div className="relative z-10 px-5 sm:px-8 pb-6 sm:pb-8 -mt-14 sm:-mt-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-6">
            {/* Overlapping Avatar + Creator Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 text-center sm:text-left">
              <div className="relative shrink-0">
                <Avatar className="h-22 w-22 sm:h-24 sm:w-24 rounded-full border-4 border-[color:var(--vooki-app-surface)] shadow-xl bg-[color:var(--vooki-app-surface)] shrink-0 ring-1 ring-[color:var(--vooki-app-border-strong)]">
                  <AvatarImage src={heroAvatar} className="object-cover" />
                  <AvatarFallback className="font-bold text-xl sm:text-2xl bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)]">
                    {profile.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0.5 right-0.5 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] ring-2 ring-[color:var(--vooki-app-surface)] shadow-xs">
                  <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </div>
              </div>

              {/* Creator Name & Tags */}
              <div className="space-y-2 sm:pb-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                    {profile.name}
                  </h1>
                  <Badge className="bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] border border-[color:var(--vooki-app-active-border)]/50 hover:bg-[color:var(--vooki-app-active-bg)] text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-none backdrop-blur-xs">
                    Creator
                  </Badge>
                </div>

                {/* Metadata Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[color:var(--vooki-app-text-soft)]">
                  <span className="font-medium px-2.5 py-1 rounded-lg bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] backdrop-blur-sm">
                    @{profile.username || "creator"}
                  </span>

                  {profile.influencerProfile?.location && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] backdrop-blur-sm">
                      <MapPin className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
                      {profile.influencerProfile.location}
                    </span>
                  )}

                  {profile.influencerProfile?.niche && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[color:var(--vooki-app-active-bg)]/40 border border-[color:var(--vooki-app-active-border)] text-[color:var(--vooki-app-text-strong)] font-semibold backdrop-blur-sm">
                      <Award className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
                      {profile.influencerProfile.niche}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-end sm:pb-1">
              <Button
                asChild
                variant="outline"
                className="flex-1 sm:flex-none rounded-xl text-xs sm:text-sm font-semibold h-10 px-4 border-[color:var(--vooki-app-border-strong)] shadow-xs bg-[color:var(--vooki-app-surface)] hover:bg-[color:var(--vooki-app-surface-strong)]"
              >
                <Link href="/influencer/profile/edit">Edit Profile</Link>
              </Button>
              <Button
                className="flex-1 sm:flex-none rounded-xl border border-[color:var(--vooki-app-active-border)] bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] hover:bg-[color:var(--vooki-app-active-border)] text-xs sm:text-sm font-semibold h-10 px-5 shadow-xs transition-all cursor-pointer"
                onClick={() => window.open(`/creator/${profile.username}`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" /> Preview
              </Button>
              <Button
                variant="outline"
                className="rounded-xl px-3 h-10 shrink-0 border-[color:var(--vooki-app-border-strong)] shadow-xs bg-[color:var(--vooki-app-surface)] hover:bg-[color:var(--vooki-app-surface-strong)]"
                onClick={handleCopyProfileLink}
                title="Copy public link"
              >
                {isCopied ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4 text-[color:var(--vooki-app-text-soft)]" />
                )}
              </Button>
            </div>
          </div>

          {/* Metric Stat Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 sm:p-5 transition-all duration-200 hover:border-[color:var(--vooki-app-active-border)] hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">
                      {stat.label}
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-active-icon)] border border-[color:var(--vooki-app-border)]">
                      <stat.icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                    {stat.value}
                  </p>
                </div>
                {"customBreakdown" in stat && stat.customBreakdown}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="mt-2">
        <div className="flex items-center gap-4 sm:gap-6 border-b border-[color:var(--vooki-app-border-strong)] mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("about")}
            className={`pb-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "about"
                ? "border-b-2 border-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-text-strong)]"
                : "border-b-2 border-transparent text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)]"
            }`}
          >
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            About & Collabs
          </button>
          <button
            onClick={() => setActiveTab("connections")}
            className={`pb-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "connections"
                ? "border-b-2 border-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-text-strong)]"
                : "border-b-2 border-transparent text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)]"
            }`}
          >
            <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Connections & Portfolio
          </button>
        </div>

        {/* Tab Content: About & Collabs */}
        {activeTab === "about" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <AboutCard
              summary={profile.influencerProfile?.summary}
              highlight={profile.influencerProfile?.highlight}
              audience={profile.influencerProfile?.audience}
              languages={profile.influencerProfile?.languages}
            />

            <CollaborationsCard collaborations={previousCollaborations} />

            <ReviewsCard
              reviews={reviews}
              rating={derivedRating}
              totalReviews={derivedReviewCount}
            />
          </div>
        )}

        {/* Tab Content: Connections & Work */}
        {activeTab === "connections" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <ConnectedAccounts
              connections={connections}
              connecting={connecting}
              disconnecting={disconnecting}
              connectError={connectError}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />

            <Portfolio
              initialItems={profile.influencerProfile?.featuredContent || []}
              onUpdate={(items) => {
                setProfile((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    influencerProfile: {
                      ...prev.influencerProfile,
                      featuredContent: items,
                    },
                  };
                });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
