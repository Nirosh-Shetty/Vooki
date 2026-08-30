"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Check,
  CheckCircle2,
  Copy,
  Edit,
  ExternalLink,
  Facebook,
  HeartHandshake,
  Instagram,
  Mail,
  MapPin,
  MessageSquare,
  Moon,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  Users,
  Youtube,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { StarRating } from "./StarRating";
import { CampaignOption, CreatorViewMode, PublicProfileData, StatsPlatform } from "./types";
import { CreateInviteModal } from "@/components/collaboration/CreateInviteModal";

interface CreatorHeaderProps {
  data: PublicProfileData;
  viewMode?: CreatorViewMode;
  onOpenInquiry?: () => void;
  customActions?: React.ReactNode;
  campaigns?: CampaignOption[];
  onInviteSuccess?: () => void;
  onBack?: () => void;
  className?: string;
}

const formatMetric = (val?: number | null) => {
  if (val === undefined || val === null) return "-";
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return val.toLocaleString();
};

export function CreatorHeader({
  data,
  viewMode = "public",
  onOpenInquiry,
  customActions,
  campaigns = [],
  onInviteSuccess,
  className = "",
}: CreatorHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleTheme = () => {
    const nextState = !isDark;
    setIsDark(nextState);
    if (typeof document !== "undefined") {
      if (nextState) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const creatorIdentifier = data._id || data.id || data.username;
      const shareUrl = `${window.location.origin}/creator/${creatorIdentifier}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const { profile } = data;

  // Platform Follower Counts
  const platformFollowers = useMemo(() => {
    if (!profile?.stats) {
      return { youtube: null, instagram: null, facebook: null, twitter: null };
    }
    const stats = profile.stats;
    const youtube = stats.youtube
      ? (stats.youtube.metrics?.subscribers ?? stats.youtube.metrics?.followers ?? null)
      : null;
    const instagram = stats.instagram
      ? (stats.instagram.metrics?.followers ?? stats.instagram.metrics?.subscribers ?? null)
      : null;
    const facebook = stats.facebook
      ? (stats.facebook.metrics?.followers ?? stats.facebook.metrics?.subscribers ?? null)
      : null;
    const twitter = stats.twitter
      ? (stats.twitter.metrics?.followers ?? stats.twitter.metrics?.subscribers ?? null)
      : null;

    return { youtube, instagram, facebook, twitter };
  }, [profile?.stats]);

  // Platform Engagement Rates
  const platformEngagements = useMemo(() => {
    const stats = profile?.stats;
    const breakdown = profile?.engagementBreakdown;

    const youtube = stats?.youtube
      ? (stats.youtube.metrics?.engagementRate ?? stats.youtube.engagementRate ?? breakdown?.youtube ?? null)
      : (breakdown?.youtube ?? null);

    const instagram = stats?.instagram
      ? (stats.instagram.metrics?.engagementRate ?? stats.instagram.engagementRate ?? breakdown?.instagram ?? null)
      : (breakdown?.instagram ?? null);

    const facebook = stats?.facebook
      ? (stats.facebook.metrics?.engagementRate ?? stats.facebook.engagementRate ?? breakdown?.facebook ?? null)
      : (breakdown?.facebook ?? null);

    const twitter = stats?.twitter
      ? (stats.twitter.metrics?.engagementRate ?? stats.twitter.engagementRate ?? breakdown?.twitter ?? null)
      : (breakdown?.twitter ?? null);

    return { youtube, instagram, facebook, twitter };
  }, [profile?.stats, profile?.engagementBreakdown]);

  // Overall calculated average engagement
  const overallEngagementRate = useMemo(() => {
    const { youtube, instagram, facebook, twitter } = platformEngagements;
    const validRates = [youtube, instagram, facebook, twitter].filter(
      (r): r is number => typeof r === "number" && !isNaN(r) && r > 0
    );

    if (validRates.length > 0) {
      const sum = validRates.reduce((acc, curr) => acc + curr, 0);
      return Number((sum / validRates.length).toFixed(1));
    }

    return profile?.engagement && profile.engagement > 0
      ? Number(profile.engagement.toFixed(1))
      : null;
  }, [platformEngagements, profile?.engagement]);

  // Total Audience
  const totalAudienceCount = useMemo(() => {

    if (!data) return 0;
    const { youtube, instagram, facebook, twitter } = platformFollowers;
    const sumSynced = (youtube ?? 0) + (instagram ?? 0) + (facebook ?? 0) + (twitter ?? 0);
    return sumSynced > 0 ? sumSynced : profile?.followers || 0;
  }, [data, platformFollowers, profile?.followers]);

  // Aggregate reviews & rating
  const { averageRating, reviewCount } = useMemo(() => {
    if (!profile?.reviews || profile.reviews.length === 0) {
      const directRating = data.rating;
      return {
        averageRating: directRating !== undefined && directRating > 0 ? directRating : null,
        reviewCount: data.totalReviews || 0,
      };
    }

    const validReviews = profile.reviews.filter((r) => {
      const val = r.score ?? r.rating;
      return typeof val === "number" && !isNaN(val) && val > 0;
    });

    if (validReviews.length === 0) {
      return {
        averageRating: data.rating && data.rating > 0 ? data.rating : null,
        reviewCount: profile.reviews.length,
      };
    }

    const sum = validReviews.reduce((acc, curr) => acc + (curr.score ?? curr.rating ?? 0), 0);
    const avg = Number((sum / validReviews.length).toFixed(1));

    return { averageRating: avg, reviewCount: validReviews.length };
  }, [data, profile?.reviews]);

  const collabsCount = profile?.collaborations?.length || 0;
  const creatorId = data._id || data.id;

  return (
    <header
      className={`relative overflow-hidden rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] shadow-xs ${className}`}
    >
      {/* Cover Banner */}
      <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-gradient-to-r from-[color:var(--vooki-app-active-bg)]/60 via-[color:var(--vooki-app-surface-strong)] to-[color:var(--vooki-app-active-bg)]/30">
        <div
          className="absolute inset-0 opacity-15 dark:opacity-25"
          style={{
            backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
            backgroundSize: "18px 18px",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[color:var(--vooki-app-surface)] to-transparent" />
      </div>

      <div className="relative z-10 px-6 sm:px-8 pb-6 -mt-14 sm:-mt-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-[color:var(--vooki-app-border-strong)]">
          {/* Identity Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="relative shrink-0">
              <Avatar className="h-22 w-22 sm:h-24 sm:w-24 rounded-full border-4 border-[color:var(--vooki-app-surface)] shadow-xl bg-[color:var(--vooki-app-surface)] shrink-0 ring-1 ring-[color:var(--vooki-app-border-strong)]">
                <AvatarImage
                  src={data.avatar?.trim() || undefined}
                  alt={data.name}
                  className="object-cover"
                />
                <AvatarFallback className="font-bold text-xl sm:text-2xl bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)]">
                  {getInitials(data.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                  {data.name}
                </h1>
                {data.isVerified && (
                  <span className="inline-flex items-center gap-1 bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] border border-[color:var(--vooki-app-active-border)] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Creator
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[color:var(--vooki-app-text-soft)]">
                <span className="font-semibold text-[color:var(--vooki-app-text-strong)]">
                  @{data.username || "creator"}
                </span>

                {profile?.location && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)]">
                    <MapPin className="h-3 w-3 text-[color:var(--vooki-app-active-icon)]" />
                    {profile.location}
                  </span>
                )}

                {profile?.niche && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-strong)] font-medium">
                    <Award className="h-3 w-3 text-[color:var(--vooki-app-active-icon)]" />
                    {profile.niche}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
            {customActions ? (
              customActions
            ) : viewMode === "brand" ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-[color:var(--vooki-app-border-strong)] bg-transparent text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)] text-xs sm:text-sm font-bold h-10 px-4"
                >
                  <Link href={`/brand/messages?otherUserId=${creatorId || ""}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Link>
                </Button>

                {creatorId && (
                  <CreateInviteModal
                    campaigns={campaigns}
                    preselectedInfluencerId={creatorId}
                    onSuccess={onInviteSuccess}
                    trigger={
                      <Button className="h-10 px-5 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:opacity-90 font-bold text-xs sm:text-sm shadow-xs transition-all">
                        <HeartHandshake className="mr-2 h-4 w-4" />
                        Invite to Campaign
                      </Button>
                    }
                  />
                )}

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)] text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  <span>{copied ? "Copied" : "Share"}</span>
                </button>
              </>
            ) : viewMode === "influencer" ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] hover:bg-[color:var(--vooki-app-surface-strong)] text-xs sm:text-sm font-semibold h-10 px-4"
                >
                  <Link href="/influencer/profile/edit">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)] text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  <span>{copied ? "Link Copied" : "Share Media Kit"}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="p-2.5 h-10 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] hover:bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-soft)] transition-colors cursor-pointer"
                >
                  {isDark ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-zinc-700" />
                  )}
                </button>
              </>
            ) : (
              // Public View
              <>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)] text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  <span>{copied ? "Copied" : "Share"}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="p-2.5 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] hover:bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-soft)] transition-colors cursor-pointer"
                >
                  {isDark ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-zinc-700" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Top Level KPI Grid (3 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
          <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[color:var(--vooki-app-text-muted)] text-[11px] font-bold uppercase tracking-wider">
                <span>Audience</span>
                <Users className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
              </div>
              <p className="mt-2 text-xl font-extrabold text-[color:var(--vooki-app-text-strong)]">
                {totalAudienceCount > 0
                  ? formatMetric(totalAudienceCount)
                  : profile?.followers
                  ? formatMetric(profile.followers)
                  : "Verified"}
              </p>
            </div>

            {/* Platform Audience Row */}
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
                  {platformFollowers.youtube !== null
                    ? formatMetric(platformFollowers.youtube)
                    : "-"}
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
                  {platformFollowers.facebook !== null
                    ? formatMetric(platformFollowers.facebook)
                    : "-"}
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
                  {platformFollowers.twitter !== null
                    ? formatMetric(platformFollowers.twitter)
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[color:var(--vooki-app-text-muted)] text-[11px] font-bold uppercase tracking-wider">
                <span>Engagement</span>
                <TrendingUp className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
              </div>
              <p className="mt-2 text-xl font-extrabold text-[color:var(--vooki-app-text-strong)]">
                {overallEngagementRate !== null
                  ? `${overallEngagementRate.toFixed(1)}%`
                  : "-"}
              </p>
            </div>

            {/* Platform Engagement Breakdown Row */}
            <div className="mt-2.5 flex items-center gap-3">
              <div
                className={`flex items-center gap-1 text-xs font-semibold ${
                  platformEngagements.youtube !== null
                    ? "text-[color:var(--vooki-app-text-strong)]"
                    : "text-[color:var(--vooki-app-text-soft)]/50"
                }`}
                title="YouTube Engagement Rate"
              >
                <Youtube className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <span>
                  {platformEngagements.youtube !== null
                    ? `${platformEngagements.youtube.toFixed(1)}%`
                    : "-"}
                </span>
              </div>

              <div
                className={`flex items-center gap-1 text-xs font-semibold ${
                  platformEngagements.instagram !== null
                    ? "text-[color:var(--vooki-app-text-strong)]"
                    : "text-[color:var(--vooki-app-text-soft)]/50"
                }`}
                title="Instagram Engagement Rate"
              >
                <Instagram className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                <span>
                  {platformEngagements.instagram !== null
                    ? `${platformEngagements.instagram.toFixed(1)}%`
                    : "-"}
                </span>
              </div>

              <div
                className={`flex items-center gap-1 text-xs font-semibold ${
                  platformEngagements.facebook !== null
                    ? "text-[color:var(--vooki-app-text-strong)]"
                    : "text-[color:var(--vooki-app-text-soft)]/50"
                }`}
                title="Facebook Engagement Rate"
              >
                <Facebook className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span>
                  {platformEngagements.facebook !== null
                    ? `${platformEngagements.facebook.toFixed(1)}%`
                    : "-"}
                </span>
              </div>

              <div
                className={`flex items-center gap-1 text-xs font-semibold ${
                  platformEngagements.twitter !== null
                    ? "text-[color:var(--vooki-app-text-strong)]"
                    : "text-[color:var(--vooki-app-text-soft)]/50"
                }`}
                title="X (Twitter) Engagement Rate"
              >
                <svg className="h-3.5 w-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>
                  {platformEngagements.twitter !== null
                    ? `${platformEngagements.twitter.toFixed(1)}%`
                    : "-"}
                </span>
              </div>
            </div>
          </div>


          <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[color:var(--vooki-app-text-muted)] text-[11px] font-bold uppercase tracking-wider">
              <span>Brand Rating</span>
              <Award className="h-3.5 w-3.5 text-amber-500" />
            </div>

            <div className="mt-2 space-y-1">
              {averageRating !== null && averageRating > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xl font-extrabold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                    {Number(averageRating).toFixed(1)}
                  </span>

                  <StarRating
                    rating={Number(averageRating)}
                    size="w-3.5 h-3.5"
                  />

                  {reviewCount > 0 && (
                    <span className="text-xs text-[color:var(--vooki-app-text-muted)] font-normal">
                      ({reviewCount.toLocaleString()})
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                    -
                  </span>
                  <span className="text-xs text-[color:var(--vooki-app-text-muted)] font-normal">
                    No reviews yet
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

