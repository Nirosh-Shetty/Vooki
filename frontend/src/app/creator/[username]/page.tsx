"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, notFound } from "next/navigation";
import Script from "next/script";
import {
  Award,
  CheckCircle2,
  Calendar,
  Star,
  MessageSquare,
  Globe,
  MapPin,
  Youtube,
  Instagram,
  Facebook,
  Users,
  TrendingUp,
  Share2,
  Sparkles,
  Layers,
  Info,
  Check,
  Moon,
  Sun,
  Megaphone,
} from "lucide-react";

interface StatsPlatform {
  platform: string;
  lastSynced: string;
  profile: {
    channelId?: string;
    title?: string;
    customUrl?: string;
    avatarUrl?: string;
  };
  metrics: {
    subscribers?: number;
    totalViews?: number;
    videoCount?: number;
    likes?: number;
    comments?: number;
    hiddenSubscriberCount?: boolean;
  };
}

interface FeaturedItem {
  _id?: string;
  url: string;
  createdAt: string;
}

interface PublicCollaboration {
  brandName: string;
  isVerified: boolean;
  campaignTitle: string;
  date: string;
}

interface PublicReview {
  brandName: string;
  rating?: number;
  score?: number;
  review: string;
  date: string;
}

interface PublicProfileData {
  name: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  profile: {
    followers: number;
    niche: string;
    location: string;
    summary: string;
    highlight: string;
    audience: string;
    engagement: number;
    languages: string[];
    socialLinks: Record<string, string>;
    featuredContent: FeaturedItem[];
    stats: {
      youtube?: StatsPlatform;
      instagram?: StatsPlatform;
      facebook?: StatsPlatform;
      [key: string]: StatsPlatform | undefined;
    };
    collaborations: PublicCollaboration[];
    reviews: PublicReview[];
  };
}

// ---------------- Embed Renderer ---------------- //

function getInstagramEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Matches /p/:id, /reel/:id, /tv/:id
    const match = parsed.pathname.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (match) {
      const type = match[1];
      const id = match[2];
      // &theme=dark removes the white card background in dark mode
      return `https://www.instagram.com/${type}/${id}/embed/?cr=1&v=14&wp=540&rd=${encodeURIComponent(
        typeof window !== "undefined" ? window.location.origin : ""
      )}`;
    }
  } catch {
    return null;
  }
  return null;
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.slice(1).split("?")[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (parsed.pathname.includes("/shorts/")) {
      const id = parsed.pathname.split("/shorts/")[1]?.split("?")[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (parsed.searchParams.has("v")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function renderSocialEmbed(url: string) {
  const ytEmbedUrl = getYouTubeEmbedUrl(url);
  const igEmbedUrl = getInstagramEmbedUrl(url);

  if (ytEmbedUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <iframe
          src={ytEmbedUrl}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 object-cover"
        />
      </div>
    );
  }

  if (igEmbedUrl) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-white">
        {/* -mt-[56px] trims the top profile avatar/name header, pulling the like bar into view */}
        <iframe
          src={igEmbedUrl}
          title="Instagram post"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          className="w-full h-[calc(100%+56px)] border-0 -mt-[56px]"
        />
      </div>
    );
  }

  return (
    <div className="p-6 text-center space-y-3">
      <Globe className="w-8 h-8 mx-auto text-[color:var(--vooki-app-text-muted)]" />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium text-[color:var(--vooki-app-text-strong)] hover:underline break-all"
      >
        {url}
      </a>
    </div>
  );
}

// ---------------- Main Component ---------------- //

export default function CreatorPublicProfile() {
  const params = useParams();
  const username = params?.username as string;

  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "portfolio">("about");
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Initialize theme state from root class list
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleTheme = () => {
    const nextState = !isDark;
    setIsDark(nextState);
    if (nextState) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    if (!username) return;

    const fetchProfile = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(
          `${backendUrl}/api/public/profile/${encodeURIComponent(username)}`,
          {
            cache: "no-store",
          }
        );
        if (!res.ok) {
          setData(null);
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  // Average Rating derived from completed reviews
  const { averageRating, reviewCount } = useMemo(() => {
    if (!data?.profile?.reviews || data.profile.reviews.length === 0) {
      return { averageRating: null, reviewCount: 0 };
    }

    const validReviews = data.profile.reviews.filter((r) => {
      const val = r.score ?? r.rating;
      return typeof val === "number" && !isNaN(val) && val > 0;
    });

    if (validReviews.length === 0) {
      return { averageRating: null, reviewCount: data.profile.reviews.length };
    }

    const sum = validReviews.reduce((acc, curr) => acc + (curr.score ?? curr.rating ?? 0), 0);
    const avg = Number((sum / validReviews.length).toFixed(1));

    return { averageRating: avg, reviewCount: validReviews.length };
  }, [data]);

  // Reprocess Instagram embeds on tab switch or data load
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
    }
  }, [data, activeTab]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--vooki-app-bg)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[color:var(--vooki-accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const { profile } = data;
  const ytStats = profile.stats?.youtube;
  const igStats = profile.stats?.instagram;
  const fbStats = profile.stats?.facebook;

  const uniqueBrandsCount = new Set(profile.collaborations.map((c) => c.brandName)).size;
  const hasInstagram = profile.featuredContent?.some((i) => i.url.includes("instagram.com"));

  return (
    <div className="min-h-screen bg-[color:var(--vooki-app-bg)] text-[color:var(--vooki-app-text)] px-3 sm:px-6 lg:px-8 py-4 sm:py-8 font-sans selection:bg-[color:var(--vooki-accent-soft)]">
      {hasInstagram && <Script src="https://www.instagram.com/embed.js" strategy="lazyOnload" />}

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* ================= Profile Hero Card ================= */}
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
              {/* Avatar + Identity */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 text-center sm:text-left">
                <div className="relative shrink-0">
                  <img
                    src={data.avatar || "/placeholder-avatar.png"}
                    alt={data.name}
                    className="h-22 w-22 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-[color:var(--vooki-app-surface)] shadow-xl bg-[color:var(--vooki-app-surface)] ring-1 ring-[color:var(--vooki-app-border-strong)]"
                  />
                  {data.isVerified && (
                    <div className="absolute bottom-0.5 right-0.5 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] ring-2 ring-[color:var(--vooki-app-surface)] shadow-xs">
                      <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </div>
                  )}
                </div>

                {/* Name & Metadata Badges */}
                <div className="space-y-2 sm:pb-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                      {data.name}
                    </h1>
                    <span className="bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] border border-[color:var(--vooki-app-active-border)]/50 text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-none backdrop-blur-xs">
                      Creator
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[color:var(--vooki-app-text-soft)]">
                    <span className="font-medium px-2.5 py-1 rounded-lg bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] backdrop-blur-sm">
                      @{data.username || "creator"}
                    </span>

                    {profile.location && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] backdrop-blur-sm">
                        <MapPin className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
                        {profile.location}
                      </span>
                    )}

                    {profile.niche && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[color:var(--vooki-app-active-bg)]/40 border border-[color:var(--vooki-app-active-border)] text-[color:var(--vooki-app-text-strong)] font-semibold backdrop-blur-sm">
                        <Award className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
                        {profile.niche}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Share & Theme Switcher */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-end sm:pb-1">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[color:var(--vooki-app-active-border)] bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] hover:bg-[color:var(--vooki-app-active-border)] text-xs sm:text-sm font-semibold h-10 shadow-xs transition-all cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  <span>{copied ? "Link Copied" : "Share Profile"}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="rounded-xl px-3 h-10 shrink-0 border border-[color:var(--vooki-app-border-strong)] shadow-xs bg-[color:var(--vooki-app-surface)] hover:bg-[color:var(--vooki-app-surface-strong)] flex items-center justify-center text-[color:var(--vooki-app-text-soft)] transition-colors cursor-pointer"
                >
                  {isDark ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-zinc-700" />
                  )}
                </button>
              </div>
            </div>

            {/* Metric Stat Cards Grid (3 Columns) */}
            {/* Metric Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-1">
              {/* 1. Audience (Full Width on Mobile, 1 Column on Desktop) */}
              <div className="col-span-2 lg:col-span-1 group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 sm:p-5 transition-all duration-200 hover:border-[color:var(--vooki-app-active-border)] hover:shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[color:var(--vooki-app-text-soft)]">
                      Audience
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-active-icon)] border border-[color:var(--vooki-app-border)]">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                    {ytStats?.metrics?.subscribers?.toLocaleString() ?? profile.followers ?? 0}
                  </p>
                </div>

                <div className="mt-2.5 flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs font-semibold text-[color:var(--vooki-app-text-strong)]">
                    <Youtube className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <span>{ytStats?.metrics?.subscribers ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[color:var(--vooki-app-text-soft)]/50">
                    <Instagram className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                    <span>-</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[color:var(--vooki-app-text-soft)]/50">
                    <Facebook className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>-</span>
                  </div>
                </div>
              </div>

              {/* 2. Engagement (Half Width on Mobile, 1 Column on Desktop) */}
              <div className="col-span-1 group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 sm:p-5 transition-all duration-200 hover:border-[color:var(--vooki-app-active-border)] hover:shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[color:var(--vooki-app-text-soft)]">
                      Engagement
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-active-icon)] border border-[color:var(--vooki-app-border)]">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                    {profile.engagement > 0 ? `${profile.engagement.toFixed(1)}%` : "-"}
                  </p>
                </div>
                <span className="text-[11px] text-[color:var(--vooki-app-text-muted)] pt-1">
                  Avg interaction
                </span>
              </div>

              {/* 3. Rating (Half Width on Mobile, 1 Column on Desktop) */}
              <div className="col-span-1 group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 sm:p-5 transition-all duration-200 hover:border-[color:var(--vooki-app-active-border)] hover:shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[color:var(--vooki-app-text-soft)]">
                      Rating
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--vooki-app-surface)] text-amber-500 border border-[color:var(--vooki-app-border)]">
                      <Star className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                      {averageRating !== null ? averageRating : "-"}
                    </span>
                    {reviewCount > 0 && (
                      <span className="text-xs text-[color:var(--vooki-app-text-muted)]">
                        ({reviewCount})
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-[color:var(--vooki-app-text-muted)] pt-1">
                  Brand reviews
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= Navigation Tabs ================= */}
        <div className="mt-2">
          <div className="flex items-center gap-4 sm:gap-6 border-b border-[color:var(--vooki-app-border-strong)] mb-6 overflow-x-auto no-scrollbar">
            <button
              type="button"
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
              type="button"
              onClick={() => setActiveTab("portfolio")}
              className={`pb-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "portfolio"
                  ? "border-b-2 border-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-text-strong)]"
                  : "border-b-2 border-transparent text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)]"
              }`}
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Connections & Portfolio
            </button>
          </div>

          {/* ================= Tab Content: About & Collabs ================= */}
          {activeTab === "about" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              {/* About You Card */}
              <section className="rounded-2xl sm:rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] shadow-xs">
                {/* Card Header */}
                <div className="p-4 sm:p-6 pb-2 sm:pb-3">
                  <h2 className="text-base sm:text-lg font-bold text-[color:var(--vooki-app-text-strong)] flex items-center gap-2">
                    <Users className="h-4 w-4 text-[color:var(--vooki-app-active-icon)]" />
                    <span>About You</span>
                  </h2>
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-6 pt-2 sm:pt-3 space-y-4">
                  {/* Creator Highlight Banner */}
                  {profile.highlight && (
                    <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--vooki-app-active-border)] bg-[color:var(--vooki-app-active-bg)]/20 p-4">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] shrink-0 mt-0.5 shadow-xs">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-subtle)]">
                          Key Highlight
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-[color:var(--vooki-app-text-strong)] leading-relaxed">
                          {profile.highlight}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Audience & Languages Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* Audience */}
                    <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--vooki-app-text-soft)] mb-2">
                        <Users className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
                        <span>Audience Demographics</span>
                      </div>
                      {profile.audience ? (
                        <p className="text-xs sm:text-sm text-[color:var(--vooki-app-text-strong)] leading-relaxed">
                          {profile.audience}
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm text-[color:var(--vooki-app-text-soft)] italic">
                          No audience details provided.
                        </p>
                      )}
                    </div>

                    {/* Languages */}
                    <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--vooki-app-text-soft)] mb-2">
                        <Globe className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
                        <span>Languages</span>
                      </div>
                      {profile.languages && profile.languages.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {profile.languages.map((lang, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-md bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-strong)]"
                            >
                              {lang.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-[color:var(--vooki-app-text-soft)] italic">
                          No languages specified.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Previous Collaborations */}
              <section className="rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[color:var(--vooki-app-text-strong)] flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-[color:var(--vooki-app-active-icon)]" />{" "}
                    Previous Collaborations
                  </h2>
                  <span className="text-xs bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-soft)] font-medium px-3 py-1 rounded-full">
                    {uniqueBrandsCount} Brands
                  </span>
                </div>

                <div className="space-y-3">
                  {profile.collaborations.length === 0 ? (
                    <p className="text-xs text-[color:var(--vooki-app-text-muted)] py-6 text-center">
                      No collaborations recorded yet.
                    </p>
                  ) : (
                    profile.collaborations.map((collab, idx) => (
                      <div
                        key={idx}
                        className="bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] rounded-2xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border)] flex items-center justify-center text-[color:var(--vooki-app-text-soft)]">
                            <Megaphone className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-[color:var(--vooki-app-text-strong)]">
                                {collab.brandName}
                              </span>
                              {collab.isVerified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                            </div>
                            <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                              {collab.campaignTitle}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[color:var(--vooki-app-text-muted)]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(collab.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Reviews & Feedback */}
              <section className="rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[color:var(--vooki-app-text-strong)] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-500" /> Reviews & Feedback
                  </h2>
                  {averageRating !== null && (
                    <div className="flex items-center gap-1 text-xs bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-strong)] font-bold px-2.5 py-1 rounded-full">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{averageRating}</span>
                      <span className="text-[color:var(--vooki-app-text-muted)] font-normal">
                        ({reviewCount})
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {profile.reviews.length === 0 ? (
                    <p className="text-xs text-[color:var(--vooki-app-text-muted)] py-6 text-center">
                      No reviews submitted yet.
                    </p>
                  ) : (
                    profile.reviews.map((rev, idx) => {
                      const starCount = rev.score || rev.rating || 0;
                      return (
                        <div
                          key={idx}
                          className="bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] rounded-2xl p-4 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border)] flex items-center justify-center text-[10px] font-bold text-[color:var(--vooki-app-text-strong)]">
                                BR
                              </div>
                              <span className="font-bold text-sm text-[color:var(--vooki-app-text-strong)]">
                                {rev.brandName}
                              </span>
                            </div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= starCount
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-[color:var(--vooki-app-border-strong)]"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {rev.review ? (
                            <p className="text-xs text-[color:var(--vooki-app-text-soft)] italic pl-2.5 border-l-2 border-[color:var(--vooki-app-active-border)]">
                              "{rev.review}"
                            </p>
                          ) : (
                            <p className="text-xs text-[color:var(--vooki-app-text-muted)] italic pl-2.5 border-l-2 border-[color:var(--vooki-app-border)]">
                              Completed campaign without written review.
                            </p>
                          )}

                          <div className="text-right text-[11px] text-[color:var(--vooki-app-text-muted)]">
                            {new Date(rev.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ================= Tab Content: Connections & Work ================= */}
          {activeTab === "portfolio" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              {/* Connected Accounts */}
              <section className="rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-4 shadow-xs">
                <div>
                  <h2 className="text-base font-bold text-[color:var(--vooki-app-text-strong)] flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Connected Accounts
                  </h2>
                  <p className="text-xs text-[color:var(--vooki-app-text-muted)] pt-0.5">
                    Live verified social channels synced via OAuth.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* YouTube Card */}
                  <div className="bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                        <Youtube className="w-5 h-5" />
                      </div>
                      {ytStats ? (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          Connected
                        </span>
                      ) : (
                        <span className="text-[10px] bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-muted)] px-2.5 py-0.5 rounded-full">
                          Not Connected
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[color:var(--vooki-app-text-strong)]">
                          YouTube
                        </span>
                        {ytStats && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                      <p className="text-2xl font-bold mt-1 text-[color:var(--vooki-app-text-strong)]">
                        {ytStats?.metrics?.subscribers?.toLocaleString() ?? "-"}
                      </p>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--vooki-app-text-muted)]">
                        Subscribers
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[color:var(--vooki-app-border-strong)] text-center">
                      <div>
                        <p className="text-xs font-bold text-[color:var(--vooki-app-text-strong)]">
                          {ytStats?.metrics?.totalViews ?? 0}
                        </p>
                        <span className="text-[10px] text-[color:var(--vooki-app-text-muted)]">
                          Views
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[color:var(--vooki-app-text-strong)]">
                          {ytStats?.metrics?.videoCount ?? 0}
                        </p>
                        <span className="text-[10px] text-[color:var(--vooki-app-text-muted)]">
                          Videos
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[color:var(--vooki-app-text-strong)]">
                          {ytStats?.metrics?.likes ?? 0}
                        </p>
                        <span className="text-[10px] text-[color:var(--vooki-app-text-muted)]">
                          Likes
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[color:var(--vooki-app-text-strong)]">
                          {ytStats?.metrics?.comments ?? 0}
                        </p>
                        <span className="text-[10px] text-[color:var(--vooki-app-text-muted)]">
                          Comments
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Instagram Card */}
                  <div className="bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] rounded-2xl p-5 space-y-4 flex flex-col justify-between opacity-80">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                        <Instagram className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-muted)] px-2.5 py-0.5 rounded-full">
                        Not Connected
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-sm text-[color:var(--vooki-app-text-strong)]">
                        Instagram
                      </span>
                      <p className="text-2xl font-bold mt-1 text-[color:var(--vooki-app-text-strong)]">
                        -
                      </p>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--vooki-app-text-muted)]">
                        Followers
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[color:var(--vooki-app-border-strong)] text-center text-xs text-[color:var(--vooki-app-text-muted)]">
                      Not connected yet
                    </div>
                  </div>

                  {/* Facebook Card */}
                  <div className="bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] rounded-2xl p-5 space-y-4 flex flex-col justify-between opacity-80">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Facebook className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-muted)] px-2.5 py-0.5 rounded-full">
                        Not Connected
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-sm text-[color:var(--vooki-app-text-strong)]">
                        Facebook
                      </span>
                      <p className="text-2xl font-bold mt-1 text-[color:var(--vooki-app-text-strong)]">
                        -
                      </p>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--vooki-app-text-muted)]">
                        Followers
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[color:var(--vooki-app-border-strong)] text-center text-xs text-[color:var(--vooki-app-text-muted)]">
                      Not connected yet
                    </div>
                  </div>
                </div>
              </section>

              {/* Portfolio & Featured Content Grid */}
              <section className="rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[color:var(--vooki-app-text-strong)] flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Portfolio & Featured Content
                    </h2>
                    <p className="text-xs text-[color:var(--vooki-app-text-muted)] pt-0.5">
                      Showcase of verified top-performing posts and videos.
                    </p>
                  </div>
                  <span className="text-xs bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] font-medium px-3 py-1 rounded-full text-[color:var(--vooki-app-text-soft)]">
                    {profile.featuredContent?.length || 0} / 5
                  </span>
                </div>

                {profile.featuredContent && profile.featuredContent.length > 0 ? (
                  <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pt-2 justify-items-center">
                    {profile.featuredContent.map((item, index) => (
                      <div
                        key={item._id || index}
                        className="relative group rounded-2xl overflow-hidden border border-[color:var(--vooki-app-border-strong)] h-[600px] w-full max-w-[400px] flex flex-col bg-black shadow-sm"
                      >
                        {/* Embed Frame */}
                        <div className="w-full h-full flex items-center justify-center overflow-hidden bg-black">
                          {renderSocialEmbed(item.url)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-8 text-center text-xs text-[color:var(--vooki-app-text-muted)]">
                    No featured content added yet.
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
