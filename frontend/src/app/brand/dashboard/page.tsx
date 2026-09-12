"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  FileCheck,
  Megaphone,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { ProtectedRoute } from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Campaign = {
  id: string;
  name: string;
  objective: string;
  niche: string;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  priority: "low" | "medium" | "high";
  budgetTotal: number;
  budgetSpent: number;
  roi: number;
  startDate: string;
  endDate: string;
  invitedCreators: number;
  acceptedCreators: number;
  updatedAt: string;
};

type PromotionStatus =
  | "requested"
  | "negotiating"
  | "accepted"
  | "content_in_progress"
  | "posted"
  | "metrics_submitted"
  | "payment_pending"
  | "completed";

type Promotion = {
  id: string;
  campaignId: string;
  brandId: string;
  influencerId: string;
  campaignTitle: string;
  product: string;
  campaignGoal: string;
  status: PromotionStatus;
  paymentAmount: number;
  paymentStatus: "pending" | "paid";
  postAt: string;
  performance: { reach: number; views: number; engagement: number };
  deliverySubmission?: {
    reviewStatus?: string;
    submittedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const money = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);

const compact = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/* Pipeline stage config */
const PIPELINE_STAGES: {
  key: PromotionStatus;
  label: string;
  color: string;
  bgColor: string;
}[] = [
  { key: "requested", label: "Requested", color: "#8da9d6", bgColor: "rgba(141,169,214,0.15)" },
  { key: "negotiating", label: "Negotiating", color: "#b8a8e8", bgColor: "rgba(184,168,232,0.15)" },
  { key: "accepted", label: "Accepted", color: "#c7e27a", bgColor: "rgba(199,226,122,0.18)" },
  { key: "content_in_progress", label: "In Progress", color: "#f0bb7a", bgColor: "rgba(240,187,122,0.18)" },
  { key: "posted", label: "Posted", color: "#8da9d6", bgColor: "rgba(141,169,214,0.15)" },
  { key: "metrics_submitted", label: "Metrics In", color: "#b8a8e8", bgColor: "rgba(184,168,232,0.15)" },
  { key: "payment_pending", label: "Payment", color: "#f0bb7a", bgColor: "rgba(240,187,122,0.18)" },
  { key: "completed", label: "Done", color: "#c7e27a", bgColor: "rgba(199,226,122,0.18)" },
];

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function Pulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[color:var(--vooki-app-border)] ${className}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <Pulse className="h-28 w-full rounded-[28px]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Pulse className="h-24 w-full rounded-[28px]" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Pulse className="h-72 rounded-[28px]" />
        <Pulse className="h-72 rounded-[28px]" />
      </div>
      <Pulse className="h-48 w-full rounded-[28px]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity Item                                                      */
/* ------------------------------------------------------------------ */

type ActivityEvent = {
  id: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
  time: string;
  href: string;
  accent: string;
};

function ActivityItem({ event }: { event: ActivityEvent }) {
  return (
    <Link
      href={event.href}
      className="group flex items-start gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-[color:var(--vooki-app-surface-hover)]"
    >
      <div
        className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: event.accent }}
      >
        {event.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
          {event.title}
        </p>
        <p className="mt-0.5 text-xs text-[color:var(--vooki-app-text-muted)] line-clamp-1">
          {event.detail}
        </p>
      </div>
      <span className="flex-shrink-0 text-xs text-[color:var(--vooki-app-text-muted)]">
        {event.time}
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Page root                                                          */
/* ------------------------------------------------------------------ */

export default function BrandDashboard() {
  return (
    <ProtectedRoute requiredRole="brand">
      <BrandDashboardContent />
    </ProtectedRoute>
  );
}

function BrandDashboardContent() {
  const { user } = useAuth();
  const displayName = user?.brandName || user?.name?.split(" ")[0] || "there";

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`${API}/api/campaigns?limit=50`, { credentials: "include", signal }),
        fetch(`${API}/api/promotions?limit=50`, { credentials: "include", signal }),
      ]);
      if (!cRes.ok || !pRes.ok) throw new Error("fetch failed");
      const cData = await cRes.json();
      const pData = await pRes.json();
      setCampaigns(Array.isArray(cData?.items) ? cData.items : []);
      setPromotions(Array.isArray(pData?.items) ? pData.items : []);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Couldn't load your data right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchData(ac.signal);
    return () => ac.abort();
  }, [fetchData]);

  /* ================================================================ */
  /*  Derived data                                                     */
  /* ================================================================ */

  /* Pipeline counts */
  const pipelineCounts = useMemo(() => {
    const map: Record<PromotionStatus, number> = {
      requested: 0, negotiating: 0, accepted: 0, content_in_progress: 0,
      posted: 0, metrics_submitted: 0, payment_pending: 0, completed: 0,
    };
    for (const p of promotions) map[p.status]++;
    return map;
  }, [promotions]);

  const pipelineTotal = promotions.length;

  /* Headline numbers */
  const stats = useMemo(() => {
    const active = campaigns.filter((c) => c.status === "active");
    const totalBudget = active.reduce((s, c) => s + c.budgetTotal, 0);
    const avgRoi = active.length
      ? active.reduce((s, c) => s + c.roi, 0) / active.length
      : 0;
    const liveCollabs = promotions.filter((p) => p.status !== "completed").length;
    const needsAction = promotions.filter(
      (p) =>
        p.status === "payment_pending" ||
        p.status === "metrics_submitted" ||
        p.deliverySubmission?.reviewStatus === "pending",
    ).length;

    return {
      activeCampaigns: active.length,
      totalBudget,
      avgRoi,
      liveCollabs,
      needsAction,
    };
  }, [campaigns, promotions]);

  /* Action cards — items needing attention */
  const actionCounts = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 86_400_000;

    const pendingResponses = promotions.filter(
      (p) => p.status === "requested" || p.status === "negotiating",
    ).length;

    const deliverablesToReview = promotions.filter(
      (p) =>
        p.status === "metrics_submitted" ||
        p.deliverySubmission?.reviewStatus === "pending",
    ).length;

    const paymentsDue = promotions.filter(
      (p) => p.status === "payment_pending",
    );
    const paymentsDueCount = paymentsDue.length;
    const paymentsDueAmount = paymentsDue.reduce(
      (s, p) => s + p.paymentAmount,
      0,
    );

    const upcomingDeadlines = promotions.filter((p) => {
      if (p.status !== "content_in_progress" && p.status !== "accepted")
        return false;
      const postTime = new Date(p.postAt).getTime();
      return postTime > now && postTime - now <= sevenDays;
    }).length;

    return {
      pendingResponses,
      deliverablesToReview,
      paymentsDueCount,
      paymentsDueAmount,
      upcomingDeadlines,
    };
  }, [promotions]);

  /* Activity feed — build from promotions sorted by updatedAt */
  const activityFeed = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];
    const sorted = [...promotions]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 8);

    for (const p of sorted) {
      const base = {
        id: p.id,
        time: timeAgo(p.updatedAt),
        href: `/brand/promotions/${p.id}`,
      };

      switch (p.status) {
        case "requested":
          events.push({ ...base, icon: <Send className="h-4 w-4" style={{ color: "#8da9d6" }} />, title: "New collaboration request sent", detail: `${p.campaignTitle} \u00b7 ${p.product}`, accent: "rgba(141,169,214,0.15)" });
          break;
        case "negotiating":
          events.push({ ...base, icon: <MessageSquare className="h-4 w-4" style={{ color: "#b8a8e8" }} />, title: "Negotiation in progress", detail: `${p.campaignTitle} \u00b7 ${money(p.paymentAmount)}`, accent: "rgba(184,168,232,0.15)" });
          break;
        case "accepted":
          events.push({ ...base, icon: <Sparkles className="h-4 w-4" style={{ color: "#c7e27a" }} />, title: "Collaboration accepted", detail: `${p.campaignTitle} \u2014 creator confirmed`, accent: "rgba(199,226,122,0.18)" });
          break;
        case "content_in_progress":
          events.push({ ...base, icon: <Clock className="h-4 w-4" style={{ color: "#f0bb7a" }} />, title: "Content being created", detail: `${p.campaignTitle} \u00b7 posting due ${new Date(p.postAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, accent: "rgba(240,187,122,0.18)" });
          break;
        case "posted":
          events.push({ ...base, icon: <Megaphone className="h-4 w-4" style={{ color: "#8da9d6" }} />, title: "Content published", detail: `${p.campaignTitle} \u00b7 live and tracking`, accent: "rgba(141,169,214,0.15)" });
          break;
        case "metrics_submitted":
          events.push({ ...base, icon: <TrendingUp className="h-4 w-4" style={{ color: "#b8a8e8" }} />, title: "Performance metrics submitted", detail: `${p.campaignTitle} \u00b7 ${compact(p.performance.reach)} reach`, accent: "rgba(184,168,232,0.15)" });
          break;
        case "payment_pending":
          events.push({ ...base, icon: <DollarSign className="h-4 w-4" style={{ color: "#f0bb7a" }} />, title: "Payment pending your action", detail: `${p.campaignTitle} \u00b7 ${money(p.paymentAmount)}`, accent: "rgba(240,187,122,0.18)" });
          break;
        case "completed":
          events.push({ ...base, icon: <FileCheck className="h-4 w-4" style={{ color: "#c7e27a" }} />, title: "Collaboration completed", detail: `${p.campaignTitle} \u00b7 ${money(p.paymentAmount)} paid`, accent: "rgba(199,226,122,0.18)" });
          break;
      }
    }
    return events;
  }, [promotions]);

  /* Upcoming deadlines — posts due within 7 days */
  const upcomingDeadlines = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 86_400_000;
    return promotions
      .filter((p) => {
        if (p.status !== "content_in_progress" && p.status !== "accepted")
          return false;
        const postTime = new Date(p.postAt).getTime();
        return postTime > now && postTime - now <= sevenDays;
      })
      .sort(
        (a, b) =>
          new Date(a.postAt).getTime() - new Date(b.postAt).getTime(),
      )
      .slice(0, 5);
  }, [promotions]);

  /* Performance snapshot — reach in last 30 days */
  const recentReach = useMemo(() => {
    const cutoff = Date.now() - 30 * 86_400_000;
    return promotions
      .filter((p) => new Date(p.updatedAt).getTime() >= cutoff)
      .reduce((s, p) => s + p.performance.reach, 0);
  }, [promotions]);

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  if (loading) return <DashboardSkeleton />;

  const hasData = campaigns.length > 0 || promotions.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-warm-soft)] px-5 py-4 text-sm text-[color:var(--vooki-warm)]">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button
            onClick={() => fetchData()}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-3 py-1.5 text-xs font-medium text-[color:var(--vooki-app-text-strong)] transition hover:bg-[color:var(--vooki-app-surface-hover)]"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/*  1 · Greeting hero                                            */}
      {/* ============================================================ */}

      <section
        className="relative overflow-hidden rounded-[28px] border border-[color:var(--vooki-app-border)] px-6 py-7 sm:px-8 sm:py-9"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--vooki-accent-soft) 100%, transparent), color-mix(in srgb, var(--vooki-violet-soft) 100%, transparent) 55%, color-mix(in srgb, var(--vooki-blue-soft) 100%, transparent))",
        }}
      >
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--vooki-app-text-muted)]">
              {greeting()}, {displayName}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)] sm:text-3xl">
              {stats.needsAction > 0
                ? `${stats.needsAction} item${stats.needsAction > 1 ? "s" : ""} waiting for you today.`
                : "Everything is on track. Nice work."}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] px-5 text-sm font-medium text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] hover:bg-[color:var(--vooki-accent-strong)]"
            >
              <Link href="/brand/campaigns/new">
                <Plus className="mr-2 h-4 w-4" /> New campaign
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-5 text-sm font-medium text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
            >
              <Link href="/brand/discover">
                <Search className="mr-2 h-4 w-4" /> Find creators
              </Link>
            </Button>
          </div>
        </div>

        {/* Headline stats */}
        <div className="relative z-10 mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Active campaigns", value: String(stats.activeCampaigns) },
            { label: "Live collaborations", value: String(stats.liveCollabs) },
            { label: "Total budget", value: money(stats.totalBudget) },
            { label: "Avg ROI", value: stats.avgRoi > 0 ? `${stats.avgRoi.toFixed(1)}x` : "\u2014" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-4 py-3"
              style={{ backdropFilter: "blur(12px)" }}
            >
              <p className="text-xs text-[color:var(--vooki-app-text-muted)]">{s.label}</p>
              <p className="mt-1 text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  2 · Action cards — what needs your attention                  */}
      {/* ============================================================ */}

      {hasData && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Pending responses",
              count: actionCounts.pendingResponses,
              sub: "Creator invites awaiting reply",
              icon: <Send className="h-5 w-5" />,
              accent: "#8da9d6",
              accentBg: "rgba(141,169,214,0.15)",
              href: "/brand/campaigns",
            },
            {
              label: "Deliverables to review",
              count: actionCounts.deliverablesToReview,
              sub: "Submissions need your approval",
              icon: <FileCheck className="h-5 w-5" />,
              accent: "#b8a8e8",
              accentBg: "rgba(184,168,232,0.15)",
              href: "/brand/campaigns",
            },
            {
              label: "Payments due",
              count: actionCounts.paymentsDueCount,
              sub: actionCounts.paymentsDueAmount > 0 ? `${money(actionCounts.paymentsDueAmount)} outstanding` : "No payments pending",
              icon: <DollarSign className="h-5 w-5" />,
              accent: "#f0bb7a",
              accentBg: "rgba(240,187,122,0.15)",
              href: "/brand/payments",
            },
            {
              label: "Upcoming deadlines",
              count: actionCounts.upcomingDeadlines,
              sub: "Posts due within 7 days",
              icon: <CalendarDays className="h-5 w-5" />,
              accent: "#c7e27a",
              accentBg: "rgba(199,226,122,0.15)",
              href: "/brand/campaigns",
            },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`group relative overflow-hidden rounded-2xl border bg-[color:var(--vooki-app-surface-card)] p-5 shadow-[var(--vooki-shadow-app-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                card.count > 0
                  ? "border-[color:var(--vooki-app-border-strong)]"
                  : "border-[color:var(--vooki-app-border)]"
              }`}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: card.accentBg, color: card.accent }}
              >
                {card.icon}
              </div>
              <p className="mt-3 text-2xl font-black text-[color:var(--vooki-app-text-strong)]">
                {card.count}
              </p>
              <p className="mt-0.5 text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                {card.label}
              </p>
              <p className="mt-0.5 text-xs text-[color:var(--vooki-app-text-muted)]">
                {card.sub}
              </p>
            </Link>
          ))}
        </section>
      )}

      {/* ============================================================ */}
      {/*  3 · Collaboration Pipeline                                   */}
      {/* ============================================================ */}

      {pipelineTotal > 0 && (
        <section className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
                Collaboration pipeline
              </p>
              <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
                {pipelineTotal} total across all stages
              </h2>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full border border-[color:var(--vooki-app-border)] text-xs text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
            >
              <Link href="/brand/campaigns">
                All campaigns <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="mt-5 flex h-3.5 overflow-hidden rounded-full bg-[color:var(--vooki-app-border)]">
            {PIPELINE_STAGES.map((stage) => {
              const count = pipelineCounts[stage.key];
              if (count === 0) return null;
              const pct = (count / pipelineTotal) * 100;
              return (
                <div
                  key={stage.key}
                  className="transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: stage.color,
                    minWidth: count > 0 ? "8px" : 0,
                  }}
                  title={`${stage.label}: ${count}`}
                />
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {PIPELINE_STAGES.map((stage) => {
              const count = pipelineCounts[stage.key];
              if (count === 0) return null;
              return (
                <div key={stage.key} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs text-[color:var(--vooki-app-text-muted)]">{stage.label}</span>
                  <span className="text-xs font-semibold text-[color:var(--vooki-app-text-strong)]">{count}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/*  4 · Activity feed + Campaign health                          */}
      {/* ============================================================ */}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Activity feed */}
        <div className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
            Recent activity
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
            What&apos;s been happening
          </h2>

          {activityFeed.length > 0 ? (
            <div className="mt-5 -mx-3 space-y-0.5">
              {activityFeed.map((event) => (
                <ActivityItem key={event.id + event.time} event={event} />
              ))}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center py-10 text-center">
              <Sparkles className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
              <p className="mt-3 text-sm text-[color:var(--vooki-app-text-soft)]">
                Activity will show up as collaborations progress.
              </p>
            </div>
          )}
        </div>

        {/* Campaign health */}
        <div className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
            Campaign health
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
            Deliverable progress across campaigns
          </h2>

          {campaigns.filter((c) => c.status === "active").length > 0 ? (
            <div className="mt-5 space-y-4">
              {campaigns
                .filter((c) => c.status === "active")
                .sort((a, b) => b.budgetTotal - a.budgetTotal)
                .slice(0, 4)
                .map((c) => {
                  const pct =
                    c.budgetTotal > 0
                      ? Math.min(100, Math.round((c.budgetSpent / c.budgetTotal) * 100))
                      : 0;
                  return (
                    <Link
                      key={c.id}
                      href={`/brand/campaigns/${c.id}`}
                      className="block rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 transition-colors hover:bg-[color:var(--vooki-app-surface-hover)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                            {c.name}
                          </p>
                          <p className="mt-0.5 text-xs text-[color:var(--vooki-app-text-muted)]">
                            {c.acceptedCreators} creator{c.acceptedCreators !== 1 ? "s" : ""} &middot; {c.niche}
                          </p>
                        </div>
                        <span className="flex-shrink-0 text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-[color:var(--vooki-app-border)]">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct >= 80 ? "#c7e27a" : pct >= 40 ? "#f0bb7a" : "#b8a8e8",
                          }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-[color:var(--vooki-app-text-muted)]">
                        {money(c.budgetSpent)} of {money(c.budgetTotal)} spent
                      </p>
                    </Link>
                  );
                })}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center py-10 text-center">
              <CalendarDays className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
              <p className="mt-3 text-sm text-[color:var(--vooki-app-text-soft)]">
                Campaign health tracks once you have active campaigns running.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  5 · Upcoming deadlines                                       */}
      {/* ============================================================ */}

      <section className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
          Upcoming deadlines
        </p>
        <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
          Posts due this week
        </h2>

        {upcomingDeadlines.length > 0 ? (
          <div className="mt-5 space-y-3">
            {upcomingDeadlines.map((p) => {
              const daysLeft = Math.ceil(
                (new Date(p.postAt).getTime() - Date.now()) / 86_400_000,
              );
              return (
                <Link
                  key={p.id}
                  href={`/brand/promotions/${p.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 transition-colors hover:bg-[color:var(--vooki-app-surface-hover)]"
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor:
                        daysLeft <= 2
                          ? "rgba(240,187,122,0.18)"
                          : "rgba(141,169,214,0.15)",
                      color: daysLeft <= 2 ? "#f0bb7a" : "#8da9d6",
                    }}
                  >
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                      {p.campaignTitle}
                    </p>
                    <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                      {p.product} &middot;{" "}
                      {new Date(p.postAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge
                    className={`border-0 text-xs font-bold ${
                      daysLeft <= 1
                        ? "bg-red-500/15 text-red-400"
                        : daysLeft <= 3
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-blue-500/15 text-blue-400"
                    }`}
                  >
                    {daysLeft <= 0
                      ? "Today"
                      : daysLeft === 1
                        ? "Tomorrow"
                        : `${daysLeft} days`}
                  </Badge>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center py-8 text-center">
            <CalendarDays className="h-7 w-7 text-[color:var(--vooki-app-text-muted)]" />
            <p className="mt-2.5 text-sm text-[color:var(--vooki-app-text-soft)]">
              No upcoming deadlines this week.
            </p>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/*  6 · Performance snapshot + View analytics link                */}
      {/* ============================================================ */}

      {hasData && (
        <section
          className="rounded-[28px] border border-[color:var(--vooki-app-border)] p-6 sm:p-7"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--vooki-blue-soft) 40%, transparent), color-mix(in srgb, var(--vooki-violet-soft) 30%, transparent))",
          }}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                  Total reach this month
                </p>
                <p className="mt-1 text-2xl font-semibold text-[color:var(--vooki-app-text-strong)]">
                  {compact(recentReach)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                  Avg campaign ROI
                </p>
                <p className="mt-1 text-2xl font-semibold text-[color:var(--vooki-app-text-strong)]">
                  {stats.avgRoi > 0 ? `${stats.avgRoi.toFixed(1)}x` : "\u2014"}
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="ghost"
              className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-5 text-sm font-medium text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
            >
              <Link href="/brand/analytics">
                View full analytics <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/*  7 · Empty state for brand-new accounts                       */}
      {/* ============================================================ */}

      {!hasData && !error && (
        <section
          className="flex flex-col items-center justify-center rounded-[28px] border border-[color:var(--vooki-app-border)] px-6 py-16 text-center"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--vooki-accent-soft) 60%, transparent), color-mix(in srgb, var(--vooki-violet-soft) 60%, transparent))",
          }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--vooki-accent-soft)]">
            <Sparkles className="h-7 w-7 text-[color:var(--vooki-accent-strong)]" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-[color:var(--vooki-app-text-strong)]">
            Welcome to Vooki
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
            Start by creating your first campaign, discovering creators, or inviting
            influencers you already have in mind. Your dashboard will come alive as
            collaborations progress.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] px-6 text-sm font-medium text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] hover:bg-[color:var(--vooki-accent-strong)]"
            >
              <Link href="/brand/campaigns/new">
                <Plus className="mr-2 h-4 w-4" /> Create a campaign
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-6 text-sm font-medium text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
            >
              <Link href="/brand/discover">
                <Search className="mr-2 h-4 w-4" /> Discover creators
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
