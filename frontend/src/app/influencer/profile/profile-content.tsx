"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { CollaborationsCard } from "./collaboration/Collaboration";
import {
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
  LayoutDashboard,
  MapPin,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Youtube,
  Instagram,
  Facebook,
  LayoutGrid,
  BarChart3,
  Layers,
  Handshake,
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
  isTwitterConnection,
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
  rating?: number;
  reviewText?: string;
  isVerified?: boolean;
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

type SectionTab = "overview" | "analytics" | "portfolio" | "partnerships";

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
  const [publicData, setPublicData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<PlatformKey | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [activeSection, setActiveSection] = useState<SectionTab>("overview");
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

        const tasks: Promise<any>[] = [loadConnections(controller.signal)];
        if (data.username) {
          tasks.push(
            fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/profile/${encodeURIComponent(data.username)}`,
              { cache: "no-store", signal: controller.signal }
            )
              .then((res) => (res.ok ? res.json() : null))
              .then((json) => {
                if (json?.success && json?.data) {
                  setPublicData(json.data);
                }
              })
              .catch(() => {})
          );
        }
        await Promise.all(tasks);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Profile unavailable");
      } finally {
        setLoading(false);
      }
    };

    load();

    if (connectedPlatform) {
      setActiveSection("analytics");
      window.history.replaceState({}, "", window.location.pathname);
    }

    return () => controller.abort();
  }, [connectedPlatform, loadConnections]);

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
    const twitter = isTwitterConnection(connections.twitter)
      ? (connections.twitter.metrics?.followers ?? 0)
      : null;

    return { youtube, instagram, facebook, twitter };
  }, [connections]);

  const totalFollowers = useMemo(() => {
    const { youtube, instagram, facebook, twitter } = platformFollowers;
    const total = (youtube ?? 0) + (instagram ?? 0) + (facebook ?? 0) + (twitter ?? 0);
    if (total === 0 && connectedCount === 0) return undefined;
    return total;
  }, [platformFollowers, connectedCount]);

  const previousCollaborations = useMemo(() => {
    if (publicData?.profile?.collaborations && Array.isArray(publicData.profile.collaborations)) {
      return publicData.profile.collaborations;
    }
    return (
      profile?.influencerProfile?.pastCollaborations?.map((collab: any) => ({
        brandName: collab.brand || collab.brandName,
        campaignTitle: collab.campaign || collab.campaignTitle,
        date: collab.date,
        isVerified: collab.isVerified,
      })) || []
    );
  }, [publicData, profile]);

  const reviews = useMemo(() => {
    if (publicData?.profile?.reviews && Array.isArray(publicData.profile.reviews)) {
      return publicData.profile.reviews;
    }
    return (
      profile?.influencerProfile?.reviews?.map((r: any) => ({
        brandName: r.brandName || r.author,
        rating: r.rating ?? r.score,
        score: r.score ?? r.rating,
        review: r.review || r.text,
        text: r.text || r.review,
        date: r.date,
      })) || []
    );
  }, [publicData, profile]);

  // Aggregate ratings exactly as in creator/[username]/page.tsx
  const { averageRating, reviewCount } = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { averageRating: null, reviewCount: 0 };
    }

    const validReviews = reviews.filter((r: any) => {
      const val = r.score ?? r.rating;
      return typeof val === "number" && !isNaN(val) && val > 0;
    });

    if (validReviews.length === 0) {
      return { averageRating: null, reviewCount: reviews.length };
    }

    const sum = validReviews.reduce((acc: number, curr: any) => acc + (curr.score ?? curr.rating ?? 0), 0);
    const avg = Number((sum / validReviews.length).toFixed(1));

    return { averageRating: avg, reviewCount: validReviews.length };
  }, [reviews]);

  // Unified Brand Collabs & Testimonials exactly as in creator/[username]/page.tsx
  const unifiedProof = useMemo(() => {
    const collabs = previousCollaborations || [];
    const revs = reviews || [];

    return collabs.map((collab: any, index: number) => {
      const matchedReview =
        revs[index] ||
        revs.find(
          (r: any) =>
            (r.brandName === collab.brandName || r.author === collab.brandName) &&
            r.date === collab.date
        );

      const scoreValue = Number(matchedReview?.score ?? matchedReview?.rating ?? 0);

      return {
        brandName: collab.brandName,
        isVerified: collab.isVerified,
        campaignTitle: collab.campaignTitle,
        date: collab.date,
        rating: scoreValue > 0 ? Math.round(scoreValue) : undefined,
        reviewText: (matchedReview?.review || matchedReview?.text || "").trim(),
      };
    });
  }, [previousCollaborations, reviews]);

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

          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              platformFollowers.twitter !== null
                ? "text-[color:var(--vooki-app-text-strong)]"
                : "text-[color:var(--vooki-app-text-soft)]/50"
            }`}
            title="X (Twitter) Followers"
          >
            <svg className="h-3.5 w-3.5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>
              {platformFollowers.twitter !== null ? formatMetric(platformFollowers.twitter) : "-"}
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
      value:
        averageRating !== null
          ? averageRating.toFixed(1)
          : profile?.rating
          ? profile.rating.toFixed(1)
          : "-",
    },
    {
      icon: LayoutDashboard,
      label: "Connected Accounts",
      value: `${connectedCount} / ${SOCIAL_PLATFORMS.length}`,
    },
  ];

  const heroAvatar = profile?.avatar || "/images/defaults/creator.svg";

  const connectEndpoints: Record<PlatformKey, string> = {
    youtube: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/social/connect/youtube`,
    instagram: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/social/connect/instagram`,
    facebook: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/social/connect/facebook`,
    twitter: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/social/connect/twitter`,
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

      {/* ================= SECTION TOGGLE CONTROLLER ================= */}
      <nav
        aria-label="Media Kit Sections"
        className="flex items-center gap-1.5 p-1 rounded-2xl bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)] shadow-xs overflow-x-auto no-scrollbar mb-6"
      >
        <button
          type="button"
          onClick={() => setActiveSection("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeSection === "overview"
              ? "bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] shadow-xs"
              : "text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)]"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>About</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("analytics")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeSection === "analytics"
              ? "bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] shadow-xs"
              : "text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)]"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Connected Social Media</span>
          {connectedCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)]">
              {connectedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("portfolio")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeSection === "portfolio"
              ? "bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] shadow-xs"
              : "text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)]"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Featured Media</span>
          {(profile.influencerProfile?.featuredContent?.length ?? 0) > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)]">
              {profile.influencerProfile?.featuredContent?.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("partnerships")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeSection === "partnerships"
              ? "bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] shadow-xs"
              : "text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)]"
          }`}
        >
          <Handshake className="w-4 h-4" />
          <span>Collabs & Reviews</span>
          {unifiedProof.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)]">
              {unifiedProof.length}
            </span>
          )}
        </button>
      </nav>

      {/* Tab Content: About */}
      {activeSection === "overview" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          <AboutCard
            summary={profile.influencerProfile?.summary}
            highlight={profile.influencerProfile?.highlight}
            audience={profile.influencerProfile?.audience}
            languages={profile.influencerProfile?.languages}
            location={profile.influencerProfile?.location}
          />
        </div>
      )}

      {/* Tab Content: Connected Social Media */}
      {activeSection === "analytics" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          <ConnectedAccounts
            connections={connections}
            connecting={connecting}
            disconnecting={disconnecting}
            connectError={connectError}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </div>
      )}

      {/* Tab Content: Featured Media */}
      {activeSection === "portfolio" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
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

      {/* Tab Content: Collabs & Reviews */}
      {activeSection === "partnerships" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          <CollaborationsCard
            collaborations={previousCollaborations}
            reviews={reviews}
            creatorName={profile?.name || "You"}
          />
        </div>
      )}
    </div>
  );
}
