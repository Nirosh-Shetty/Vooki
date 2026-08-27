"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, notFound } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Calendar,
  Star,
  Globe,
  MapPin,
  Youtube,
  Instagram,
  Facebook,
  Users,
  TrendingUp,
  Share2,
  Sparkles,
  Check,
  Moon,
  Sun,
  Megaphone,
  Mail,
  Send,
  X,
  ArrowUpRight,
  ShieldCheck,
  Play,
  Clock,
  LayoutGrid,
  BarChart3,
  Layers,
  Handshake,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";


// ================= Interfaces ================= //

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
    followers?: number;
    totalViews?: number;
    videoCount?: number;
    likes?: number;
    comments?: number;
    hiddenSubscriberCount?: boolean;
    [key: string]: any;
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

type SectionTab = "overview" | "analytics" | "portfolio" | "partnerships";

// ================= Helpers ================= //

function StarRating({
  rating = 0,
  max = 5,
  size = "w-4 h-4",
}: {
  rating: number;
  max?: number;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, index) => {
        const fillPercentage = Math.max(0, Math.min(100, (rating - index) * 100));

        return (
          <div key={index} className={`relative ${size} shrink-0`}>
            <Star
              className={`${size} fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700 absolute top-0 left-0`}
            />

            {fillPercentage > 0 && (
              <div
                className="absolute top-0 left-0 overflow-hidden h-full"
                style={{ width: `${fillPercentage}%` }}
              >
                <Star className={`${size} fill-amber-400 text-amber-400 max-w-none`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatSyncDate(dateString?: string): string {
  if (!dateString) return "Recently";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

function getInstagramEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (match) {
      const type = match[1];
      const id = match[2];
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

function SocialEmbedPlayer({ url }: { url: string }) {
  const ytEmbedUrl = getYouTubeEmbedUrl(url);
  const igEmbedUrl = getInstagramEmbedUrl(url);

  if (ytEmbedUrl) {
    return (
      <iframe
        src={ytEmbedUrl}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full border-0 object-cover"
      />
    );
  }

  if (igEmbedUrl) {
    return (
      <iframe
        src={igEmbedUrl}
        title="Instagram post"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        className="w-full h-[calc(100%+56px)] border-0 -mt-[56px]"
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950">
      <Play className="w-10 h-10 text-zinc-500 mb-2" />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 underline underline-offset-2"
      >
        <span>View Content</span>
        <ArrowUpRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

const formatMetric = (val?: number | null) => {
  if (val === undefined || val === null) return "-";
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return val.toLocaleString();
};

// ================= Main Component ================= //

export default function CreatorPublicProfile() {
  const params = useParams();
  const username = params?.username as string;

  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionTab>("overview");
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Inquiry form states
  const [inquiryBrand, setInquiryBrand] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryBudget, setInquiryBudget] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySent, setInquirySent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));

      const handleScroll = () => {
        setScrolled(window.scrollY > 20);
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
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
          { cache: "no-store" }
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

  // Aggregate ratings
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

  // Unified Brand Collabs & Testimonials
  const unifiedProof = useMemo(() => {
    const collabs = data?.profile?.collaborations || [];
    const reviews = data?.profile?.reviews || [];

    return collabs.map((collab, index) => {
      const matchedReview =
        reviews[index] ||
        reviews.find((r) => r.brandName === collab.brandName && r.date === collab.date);

      const scoreValue = Number(matchedReview?.score ?? matchedReview?.rating ?? 0);

      return {
        brandName: collab.brandName,
        isVerified: collab.isVerified,
        campaignTitle: collab.campaignTitle,
        date: collab.date,
        rating: scoreValue > 0 ? Math.round(scoreValue) : undefined,
        reviewText: matchedReview?.review?.trim() || "",
      };
    });
  }, [data]);

  // Active verified platforms list
  const activePlatforms = useMemo(() => {
    if (!data?.profile?.stats) return [];
    const stats = data.profile.stats;
    const list: {
      key: string;
      name: string;
      data: StatsPlatform;
      icon: any;
      colorClass: string;
    }[] = [];

    if (stats.youtube) {
      list.push({
        key: "youtube",
        name: "YouTube",
        data: stats.youtube,
        icon: Youtube,
        colorClass: "text-red-500 bg-red-500/10",
      });
    }
    if (stats.instagram) {
      list.push({
        key: "instagram",
        name: "Instagram",
        data: stats.instagram,
        icon: Instagram,
        colorClass: "text-pink-500 bg-pink-500/10",
      });
    }
    if (stats.facebook) {
      list.push({
        key: "facebook",
        name: "Facebook",
        data: stats.facebook,
        icon: Facebook,
        colorClass: "text-blue-500 bg-blue-500/10",
      });
    }
    if (stats.twitter) {
      list.push({
        key: "twitter",
        name: "X (Twitter)",
        data: stats.twitter,
        icon: ({ className }: { className?: string }) => (
          <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ),
        colorClass: "text-zinc-800 dark:text-zinc-200 bg-zinc-500/10",
      });
    }

    return list;
  }, [data]);

  const platformFollowers = useMemo(() => {
    if (!data?.profile?.stats) {
      return { youtube: null, instagram: null, facebook: null, twitter: null };
    }
    const stats = data.profile.stats;
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
  }, [data]);

  // Total calculated audience
  const totalAudienceCount = useMemo(() => {
    if (!data) return 0;
    const { youtube, instagram, facebook, twitter } = platformFollowers;
    const sumSynced = (youtube ?? 0) + (instagram ?? 0) + (facebook ?? 0) + (twitter ?? 0);
    return sumSynced > 0 ? sumSynced : data.profile.followers || 0;
  }, [data, platformFollowers]);

  // Reprocess embeds when tab or content changes
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
    }
  }, [data, activeSection]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySent(true);
    setTimeout(() => {
      setInquirySent(false);
      setIsInquiryOpen(false);
      setInquiryBrand("");
      setInquiryEmail("");
      setInquiryBudget("");
      setInquiryMessage("");
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--vooki-app-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[color:var(--vooki-app-active-border)] border-t-[color:var(--vooki-app-active-text)] animate-spin" />
          <span className="text-xs text-[color:var(--vooki-app-text-muted)] tracking-wider uppercase font-semibold">
            Loading Media Kit...
          </span>
        </div>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const { profile } = data;
  const hasInstagram = profile.featuredContent?.some((i) => i.url.includes("instagram.com"));

  return (
    <div className="min-h-screen bg-[color:var(--vooki-app-bg)] text-[color:var(--vooki-app-text)] font-sans selection:bg-[color:var(--vooki-app-active-bg)]">
      {hasInstagram && <Script src="https://www.instagram.com/embed.js" strategy="lazyOnload" />}

      {/* ================= FIXED TOP NAVBAR ================= */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled ? "var(--vooki-home-nav)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled
            ? "1px solid var(--vooki-home-border-soft)"
            : "1px solid transparent",
          transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          <img
            src="/images/company_logo/Vooki_logo_bgRemovedSvg.svg"
            alt="Vooki Logo"
            style={{ height: 32, width: "auto" }}
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--vooki-home-text)",
            }}
          >
            vooki
          </span>
        </Link>

        {/* Nav actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            href="/signin"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--vooki-home-text-muted)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--vooki-home-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--vooki-home-text-muted)")}
          >
            Log in
          </Link>
          <Link
            href="/signin"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--vooki-accent-text)",
              background: "var(--vooki-accent)",
              padding: "8px 20px",
              borderRadius: 8,
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ================= MAIN PROFILE CONTENT ================= */}
      <main className="px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          {/* ================= HERO HEADER ================= */}
          <header className="relative overflow-hidden rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] shadow-xs">
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
                      <AvatarImage src={data.avatar?.trim() || undefined} alt={data.name} className="object-cover" />
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
                      <span className="inline-flex items-center gap-1 bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] border border-[color:var(--vooki-app-active-border)] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        Creator
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[color:var(--vooki-app-text-soft)]">
                      <span className="font-semibold text-[color:var(--vooki-app-text-strong)]">
                        @{data.username || "creator"}
                      </span>

                      {profile.location && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)]">
                          <MapPin className="h-3 w-3 text-[color:var(--vooki-app-active-icon)]" />
                          {profile.location}
                        </span>
                      )}

                      {profile.niche && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-strong)] font-medium">
                          <Award className="h-3 w-3 text-[color:var(--vooki-app-active-icon)]" />
                          {profile.niche}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Conversion Buttons */}
                <div className="flex items-center gap-2 justify-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsInquiryOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:opacity-90 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Work With {data.name.split(" ")[0]}</span>
                  </button>

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
                </div>
              </div>

              {/* Top Level KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5">
                <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[color:var(--vooki-app-text-muted)] text-[11px] font-bold uppercase tracking-wider">
                      <span>Audience</span>
                      <Users className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
                    </div>
                    <p className="mt-2 text-xl font-extrabold text-[color:var(--vooki-app-text-strong)]">
                      {totalAudienceCount > 0
                        ? formatMetric(totalAudienceCount)
                        : data.profile.followers
                        ? formatMetric(data.profile.followers)
                        : "Verified"}
                    </p>
                  </div>

                  {/* Below audience each platform audience as added in influencer/profile */}
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
                  <div className="flex items-center justify-between text-[color:var(--vooki-app-text-muted)] text-[11px] font-bold uppercase tracking-wider">
                    <span>Engagement</span>
                    <TrendingUp className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
                  </div>
                  <p className="mt-2 text-xl font-extrabold text-[color:var(--vooki-app-text-strong)]">
                    {profile.engagement > 0 ? `${profile.engagement.toFixed(1)}%` : "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[color:var(--vooki-app-text-muted)] text-[11px] font-bold uppercase tracking-wider">
                    <span>Collaborations</span>
                    <Megaphone className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
                  </div>
                  <p className="mt-2 text-xl font-extrabold text-[color:var(--vooki-app-text-strong)]">
                    {unifiedProof.length > 0 ? unifiedProof.length : "Available"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[color:var(--vooki-app-text-muted)] text-[11px] font-bold uppercase tracking-wider">
                    <span>Brand Rating</span>
                    <Award className="h-3.5 w-3.5 text-amber-500" />
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xl font-extrabold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                        {averageRating !== null ? Number(averageRating).toFixed(1) : "5.0"}
                      </span>

                      <StarRating
                        rating={averageRating !== null ? Number(averageRating) : 5.0}
                        size="w-3.5 h-3.5"
                      />

                      {reviewCount > 0 && (
                        <span className="text-xs text-[color:var(--vooki-app-text-muted)] font-normal">
                          ({reviewCount.toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* ================= SECTION TOGGLE CONTROLLER ================= */}
          <nav
            aria-label="Media Kit Sections"
            className="flex items-center gap-1.5 p-1 rounded-2xl bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)] shadow-xs overflow-x-auto no-scrollbar"
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
              {activePlatforms.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)]">
                  {activePlatforms.length}
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
              {profile.featuredContent?.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)]">
                  {profile.featuredContent.length}
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

          {/* ================= SECTION 1: OVERVIEW & BIO ================= */}
          {activeSection === "overview" && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-6 shadow-xs">
              {/* Highlight Banner */}
              {profile.highlight && (
                <div className="rounded-2xl border border-[color:var(--vooki-app-active-border)] bg-[color:var(--vooki-app-active-bg)]/25 p-5 flex items-start gap-4">
                  <div className="h-8 w-8 rounded-xl bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-subtle)]">
                      Highlight
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-[color:var(--vooki-app-text-strong)] leading-relaxed">
                      {profile.highlight}
                    </p>
                  </div>
                </div>
              )}

              {/* Side-by-Side: Audience (with Gender Ratio) & Languages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {/* Dynamic Audience Breakdown Card */}
                {(() => {
                  const hasAudienceData = Boolean(profile.audience);

                  return (
                    <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-5 sm:p-6 flex flex-col justify-between min-h-[260px] shadow-xs">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-[color:var(--vooki-app-text-strong)]">
                          Audience
                        </span>
                        {hasAudienceData ? (
                          <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-[#E8F8F0] text-[#10B981] border border-[#10B981]/20 dark:bg-emerald-950/40 dark:text-emerald-400">
                            Verified Data
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-muted)] border border-[color:var(--vooki-app-border-strong)]">
                            Not Available
                          </span>
                        )}
                      </div>

                      {hasAudienceData ? (
                        <div className="space-y-5 pt-3">
                          {/* Gender Ratio Bar */}
                          <div className="space-y-2">
                            <span className="text-sm font-bold text-[color:var(--vooki-app-text-strong)]">
                              Gender Split
                            </span>

                            <div className="h-3 w-full rounded-full overflow-hidden flex bg-zinc-200 dark:bg-zinc-800">
                              <div
                                style={{ width: "85%" }}
                                className="bg-[#FF2E93] h-full rounded-l-full"
                              />
                              <div
                                style={{ width: "15%" }}
                                className="bg-[#2E7CF6] h-full rounded-r-full"
                              />
                            </div>

                            <div className="flex justify-between items-center text-xs font-black pt-0.5">
                              <span className="text-[#FF2E93]">85% F</span>
                              <span className="text-[#2E7CF6]">15% M</span>
                            </div>
                          </div>

                          {/* Age & Location Breakdown */}
                          <div className="space-y-3 pt-3 border-t border-[color:var(--vooki-app-border-strong)]/60">
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                                Top Age Bracket
                              </span>
                              <span className="text-xs sm:text-sm font-extrabold text-[color:var(--vooki-app-text-strong)]">
                                18–24
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                                Top Location
                              </span>
                              <span className="text-xs sm:text-sm font-extrabold text-[color:var(--vooki-app-text-strong)] flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[color:var(--vooki-app-text-muted)]" />
                                <span>{profile.location || "Not specified"}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-2">
                          <div className="w-10 h-10 rounded-2xl bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)] flex items-center justify-center text-[color:var(--vooki-app-text-muted)]">
                            <Users className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-bold text-[color:var(--vooki-app-text-strong)]">
                            Demographics Not Available
                          </p>
                          <p className="text-xs text-[color:var(--vooki-app-text-muted)] max-w-xs leading-relaxed">
                            Audience age, gender split, and geography insights have not been synced
                            for this profile.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Languages Card */}
                <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-[color:var(--vooki-app-text-strong)]">
                      <Globe className="h-4 w-4 text-[color:var(--vooki-app-active-icon)]" />
                      <span>Languages</span>
                    </div>
                    <p className="text-xs text-[color:var(--vooki-app-text-muted)] mt-1">
                      Primary languages spoken for content creation and brand deliverables.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {profile.languages && profile.languages.filter((lang) => lang && lang.trim()).length > 0 ? (
                      profile.languages
                        .filter((lang) => lang && lang.trim())
                        .map((lang, idx) => (
                          <span
                            key={idx}
                            className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-strong)] shadow-xs"
                          >
                            {lang.trim()}
                          </span>
                        ))
                    ) : (
                      <span className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-muted)] shadow-xs">
                        No languages available
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[color:var(--vooki-app-border-strong)]/60 text-[11px] text-[color:var(--vooki-app-text-muted)]" />
                </div>
              </div>
            </section>
          )}

          {/* ================= SECTION 2: CHANNEL STATS ================= */}
          {activeSection === "analytics" && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    key: "youtube",
                    name: "YouTube",
                    icon: Youtube,
                    iconBg: "bg-[#FEF0F0] text-[#FF0000] dark:bg-red-950/40 dark:text-red-400",
                    data: profile.stats?.youtube,
                    metricLabel: "SUBSCRIBERS",
                  },
                  {
                    key: "instagram",
                    name: "Instagram",
                    icon: Instagram,
                    iconBg: "bg-[#FDF0F5] text-[#E1306C] dark:bg-pink-950/40 dark:text-pink-400",
                    data: profile.stats?.instagram,
                    metricLabel: "FOLLOWERS",
                  },
                  {
                    key: "facebook",
                    name: "Facebook",
                    icon: Facebook,
                    iconBg: "bg-[#EFF4FE] text-[#1877F2] dark:bg-blue-950/40 dark:text-blue-400",
                    data: profile.stats?.facebook,
                    metricLabel: "FOLLOWERS",
                  },
                  {
                    key: "twitter",
                    name: "X (Twitter)",
                    customIcon: () => (
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    ),
                    iconBg: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
                    data: (profile.stats as any)?.twitter,
                    metricLabel: "FOLLOWERS",
                  },
                ].map((platform) => {
                  const isConnected = !!platform.data;
                  const metrics = platform.data?.metrics;
                  const Icon = platform.icon;
                  const CustomIcon = platform.customIcon;

                  return (
                    <div
                      key={platform.key}
                      className="rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 flex flex-col justify-between shadow-xs transition-all hover:border-[color:var(--vooki-app-active-border)] min-h-[270px]"
                    >
                      {/* Top Row: Icon + Status Badge */}
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${platform.iconBg}`}
                        >
                          {CustomIcon ? <CustomIcon /> : Icon && <Icon className="w-5 h-5" />}
                        </div>

                        {isConnected ? (
                          <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#E8F8F0] text-[#10B981] border border-[#10B981]/20 dark:bg-emerald-950/40 dark:text-emerald-400">
                            Connected
                          </span>
                        ) : (
                          <span className="text-xs text-[color:var(--vooki-app-text-muted)] font-normal">
                            Not Connected
                          </span>
                        )}
                      </div>

                      {/* Middle Section: Name + Primary Metric */}
                      <div className="mt-6 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-base text-[color:var(--vooki-app-text-strong)]">
                            {platform.name}
                          </span>
                          {isConnected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                        </div>

                        <p className="text-3xl font-extrabold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                          {isConnected && metrics?.subscribers !== undefined
                            ? metrics.subscribers.toLocaleString()
                            : "-"}
                        </p>

                        <p className="text-[10px] font-bold tracking-wider uppercase text-[color:var(--vooki-app-text-muted)]">
                          {platform.metricLabel}
                        </p>
                      </div>

                      {/* Bottom Row: Detailed Metrics OR Unconnected State */}
                      <div className="mt-6 pt-4 border-t border-[color:var(--vooki-app-border-strong)]">
                        {isConnected ? (
                          <div className="grid grid-cols-3 gap-1 text-center">
                            <div>
                              <p className="text-xs font-bold text-[color:var(--vooki-app-text-strong)]">
                                {metrics?.totalViews !== undefined
                                  ? metrics.totalViews.toLocaleString()
                                  : 0}
                              </p>
                              <span className="text-[10px] text-[color:var(--vooki-app-text-muted)]">
                                Views
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[color:var(--vooki-app-text-strong)]">
                                {metrics?.videoCount !== undefined
                                  ? metrics.videoCount.toLocaleString()
                                  : 0}
                              </p>
                              <span className="text-[10px] text-[color:var(--vooki-app-text-muted)]">
                                Posts
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[color:var(--vooki-app-text-strong)]">
                                {metrics?.likes !== undefined ? metrics.likes.toLocaleString() : 0}
                              </p>
                              <span className="text-[10px] text-[color:var(--vooki-app-text-muted)]">
                                Likes
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-center text-xs text-[color:var(--vooki-app-text-muted)] py-1">
                            Not connected yet
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ================= SECTION 3: FEATURED MEDIA ================= */}
          {activeSection === "portfolio" && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-6 shadow-xs">
              {profile.featuredContent && profile.featuredContent.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                  {profile.featuredContent.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className="group relative rounded-2xl overflow-hidden border border-[color:var(--vooki-app-border-strong)] bg-black h-[540px] flex flex-col shadow-xs transition-all hover:border-[color:var(--vooki-app-active-border)]"
                    >
                      <SocialEmbedPlayer url={item.url} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-10 text-center space-y-2">
                  <Play className="w-8 h-8 mx-auto text-[color:var(--vooki-app-text-muted)]" />
                  <p className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                    Portfolio Being Curated
                  </p>
                  <p className="text-xs text-[color:var(--vooki-app-text-muted)] max-w-sm mx-auto">
                    The creator hasn't linked specific media reels yet. Check back soon for updated
                    sample deliverables.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ================= SECTION 4: COLLABS & REVIEWS ================= */}
          {activeSection === "partnerships" && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[color:var(--vooki-app-text-strong)]">
                    Campaign History & Feedback
                  </h2>
                  <p className="text-xs text-[color:var(--vooki-app-text-muted)] mt-0.5">
                    Verified brand collaborations and client reviews.
                  </p>
                </div>

                {averageRating !== null && (
                  <div className="flex items-center gap-2 text-[color:var(--vooki-app-text-strong)] shrink-0">
                    <span className="text-lg sm:text-xl font-bold tracking-tight">
                      {Number(averageRating).toFixed(1)}
                    </span>

                    <StarRating rating={Number(averageRating)} size="w-4 h-4" />

                    {reviewCount > 0 && (
                      <span className="text-sm font-normal text-[color:var(--vooki-app-text-muted)]">
                        ({reviewCount.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {unifiedProof.length === 0 ? (
                <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-10 text-center space-y-2">
                  <Megaphone className="w-8 h-8 mx-auto text-[color:var(--vooki-app-text-muted)]" />
                  <p className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                    Open for Collaborations
                  </p>
                  <p className="text-xs text-[color:var(--vooki-app-text-muted)] max-w-sm mx-auto">
                    {data.name} is available for brand integrations, product placements, and
                    long-term ambassador campaigns.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unifiedProof.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-5 flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border)] flex items-center justify-center font-bold text-xs text-[color:var(--vooki-app-text-strong)] shrink-0">
                            {getInitials(item.brandName, "BR")}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-[color:var(--vooki-app-text-strong)]">
                                {item.brandName}
                              </span>
                              {item.isVerified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                            </div>
                            <p className="text-xs text-[color:var(--vooki-app-text-muted)] font-medium">
                              {item.campaignTitle}
                            </p>
                          </div>
                        </div>

                        {item.rating !== undefined && (
                          <StarRating rating={Number(item.rating)} size="w-3.5 h-3.5" />
                        )}
                      </div>

                      {item.reviewText ? (
                        <blockquote className="text-xs text-[color:var(--vooki-app-text-soft)] italic pl-3 border-l-2 border-[color:var(--vooki-app-active-border)]">
                          "{item.reviewText}"
                        </blockquote>
                      ) : (
                        <div className="text-[11px] text-[color:var(--vooki-app-text-muted)] italic pl-3 border-l-2 border-[color:var(--vooki-app-border-strong)]">
                          Campaign verified and completed successfully.
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-[color:var(--vooki-app-text-muted)] pt-2 border-t border-[color:var(--vooki-app-border-strong)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.date).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Verified Deal
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* ================= INQUIRY MODAL ================= */}
        {isInquiryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[color:var(--vooki-app-text-strong)]">
                    Work with {data.name}
                  </h3>
                  <p className="text-xs text-[color:var(--vooki-app-text-muted)] mt-0.5">
                    Submit your brief directly to the creator.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInquiryOpen(false)}
                  className="p-1.5 rounded-lg text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-strong)] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {inquirySent ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-base text-[color:var(--vooki-app-text-strong)]">
                    Inquiry Sent Successfully!
                  </h4>
                  <p className="text-xs text-[color:var(--vooki-app-text-muted)] max-w-xs mx-auto">
                    {data.name} has received your proposal and will respond via email shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[color:var(--vooki-app-text-strong)] mb-1">
                      Brand or Agency Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corp"
                      value={inquiryBrand}
                      onChange={(e) => setInquiryBrand(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] focus:outline-hidden focus:border-[color:var(--vooki-app-active-border)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[color:var(--vooki-app-text-strong)] mb-1">
                        Business Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="collabs@brand.com"
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] focus:outline-hidden focus:border-[color:var(--vooki-app-active-border)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[color:var(--vooki-app-text-strong)] mb-1">
                        Estimated Budget (USD)
                      </label>
                      <input
                        type="text"
                        placeholder="$500 - $2,500"
                        value={inquiryBudget}
                        onChange={(e) => setInquiryBudget(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] focus:outline-hidden focus:border-[color:var(--vooki-app-active-border)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[color:var(--vooki-app-text-strong)] mb-1">
                      Campaign Scope & Deliverables
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe deliverables (e.g. 1x YouTube Short + Dedicated Reel)..."
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] focus:outline-hidden focus:border-[color:var(--vooki-app-active-border)] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsInquiryOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-[color:var(--vooki-app-border-strong)] text-xs font-semibold text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-strong)] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Proposal</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}