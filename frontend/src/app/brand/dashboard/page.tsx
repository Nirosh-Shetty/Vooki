"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  ArrowUpRight,
  AlertCircle,
  CalendarDays,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  FileCheck,
  Loader2,
  MessageSquare,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import { ProtectedRoute } from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  deliverablesDone: number;
  deliverablesTotal: number;
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
  draftDueAt: string;
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
/*  Skeleton loader                                                    */
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
      <Pulse className="h-24 w-full rounded-[28px]" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Pulse className="h-72 rounded-[28px]" />
        <Pulse className="h-72 rounded-[28px]" />
      </div>
      <Pulse className="h-64 w-full rounded-[28px]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Tooltip for charts                                          */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-4 py-3 shadow-lg">
      <p className="text-xs font-medium text-[color:var(--vooki-app-text-muted)]">
        {label}
      </p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="mt-1 text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {money(entry.value)}
        </p>
      ))}
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
      requested: 0,
      negotiating: 0,
      accepted: 0,
      content_in_progress: 0,
      posted: 0,
      metrics_submitted: 0,
      payment_pending: 0,
      completed: 0,
    };
    for (const p of promotions) map[p.status]++;
    return map;
  }, [promotions]);

  const pipelineTotal = promotions.length;

  /* Budget chart data — per active campaign */
  const budgetChartData = useMemo(
    () =>
      campaigns
        .filter((c) => c.status === "active" || c.status === "paused")
        .sort((a, b) => b.budgetTotal - a.budgetTotal)
        .slice(0, 6)
        .map((c) => ({
          name: c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name,
          Budget: c.budgetTotal,
          Spent: c.budgetSpent,
        })),
    [campaigns]
  );

  /* Headline numbers */
  const stats = useMemo(() => {
    const active = campaigns.filter((c) => c.status === "active");
    const totalBudget = active.reduce((s, c) => s + c.budgetTotal, 0);
    const totalSpent = active.reduce((s, c) => s + c.budgetSpent, 0);
    const avgRoi = active.length
      ? active.reduce((s, c) => s + c.roi, 0) / active.length
      : 0;
    const liveCollabs = promotions.filter((p) => p.status !== "completed").length;
    const uniqueCreators = new Set(promotions.map((p) => p.influencerId)).size;
    const totalReach = promotions.reduce((s, p) => s + p.performance.reach, 0);
    const totalViews = promotions.reduce((s, p) => s + p.performance.views, 0);
    const needsAction =
      promotions.filter(
        (p) =>
          p.status === "payment_pending" ||
          p.status === "metrics_submitted" ||
          p.deliverySubmission?.reviewStatus === "pending"
      ).length;

    return {
      activeCampaigns: active.length,
      totalBudget,
      totalSpent,
      avgRoi,
      liveCollabs,
      uniqueCreators,
      totalReach,
      totalViews,
      needsAction,
    };
  }, [campaigns, promotions]);

  /* Activity feed — build from promotions sorted by updatedAt */
  const activityFeed = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];

    const sorted = [...promotions]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8);

    for (const p of sorted) {
      const base = {
        id: p.id,
        time: timeAgo(p.updatedAt),
        href: `/brand/promotions/${p.id}`,
      };

      switch (p.status) {
        case "requested":
          events.push({
            ...base,
            icon: <Send className="h-4 w-4" style={{ color: "#8da9d6" }} />,
            title: "New collaboration request sent",
            detail: `${p.campaignTitle} · ${p.product}`,
            accent: "rgba(141,169,214,0.15)",
          });
          break;
        case "negotiating":
          events.push({
            ...base,
            icon: <MessageSquare className="h-4 w-4" style={{ color: "#b8a8e8" }} />,
            title: "Negotiation in progress",
            detail: `${p.campaignTitle} · ${money(p.paymentAmount)}`,
            accent: "rgba(184,168,232,0.15)",
          });
          break;
        case "accepted":
          events.push({
            ...base,
            icon: <Sparkles className="h-4 w-4" style={{ color: "#c7e27a" }} />,
            title: "Collaboration accepted",
            detail: `${p.campaignTitle} — creator confirmed`,
            accent: "rgba(199,226,122,0.18)",
          });
          break;
        case "content_in_progress":
          events.push({
            ...base,
            icon: <Clock className="h-4 w-4" style={{ color: "#f0bb7a" }} />,
            title: "Content being created",
            detail: `${p.campaignTitle} · draft due ${new Date(p.draftDueAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            accent: "rgba(240,187,122,0.18)",
          });
          break;
        case "posted":
          events.push({
            ...base,
            icon: <Megaphone className="h-4 w-4" style={{ color: "#8da9d6" }} />,
            title: "Content published",
            detail: `${p.campaignTitle} · live and tracking`,
            accent: "rgba(141,169,214,0.15)",
          });
          break;
        case "metrics_submitted":
          events.push({
            ...base,
            icon: <TrendingUp className="h-4 w-4" style={{ color: "#b8a8e8" }} />,
            title: "Performance metrics submitted",
            detail: `${p.campaignTitle} · ${compact(p.performance.reach)} reach`,
            accent: "rgba(184,168,232,0.15)",
          });
          break;
        case "payment_pending":
          events.push({
            ...base,
            icon: <DollarSign className="h-4 w-4" style={{ color: "#f0bb7a" }} />,
            title: "Payment pending your action",
            detail: `${p.campaignTitle} · ${money(p.paymentAmount)}`,
            accent: "rgba(240,187,122,0.18)",
          });
          break;
        case "completed":
          events.push({
            ...base,
            icon: <FileCheck className="h-4 w-4" style={{ color: "#c7e27a" }} />,
            title: "Collaboration completed",
            detail: `${p.campaignTitle} · ${money(p.paymentAmount)} paid`,
            accent: "rgba(199,226,122,0.18)",
          });
          break;
      }
    }

    return events;
  }, [promotions]);

  /* Top performing — completed promotions with best reach */
  const topPerformers = useMemo(
    () =>
      promotions
        .filter((p) => p.status === "completed" && p.performance.reach > 0)
        .sort((a, b) => b.performance.reach - a.performance.reach)
        .slice(0, 3),
    [promotions]
  );

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

        {/* Floating headline stats */}
        <div className="relative z-10 mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Active campaigns", value: String(stats.activeCampaigns) },
            { label: "Live collaborations", value: String(stats.liveCollabs) },
            { label: "Total budget", value: money(stats.totalBudget) },
            { label: "Avg ROI", value: stats.avgRoi > 0 ? `${stats.avgRoi.toFixed(1)}x` : "—" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-4 py-3"
              style={{ backdropFilter: "blur(12px)" }}
            >
              <p className="text-xs text-[color:var(--vooki-app-text-muted)]">{s.label}</p>
              <p className="mt-1 text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  2 · Collaboration Pipeline                                   */}
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

          {/* Pipeline bar */}
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

          {/* Stage labels */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {PIPELINE_STAGES.map((stage) => {
              const count = pipelineCounts[stage.key];
              if (count === 0) return null;
              return (
                <div key={stage.key} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-xs text-[color:var(--vooki-app-text-muted)]">
                    {stage.label}
                  </span>
                  <span className="text-xs font-semibold text-[color:var(--vooki-app-text-strong)]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/*  3 · Budget chart + Activity feed                             */}
      {/* ============================================================ */}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Budget chart */}
        <div className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
            Campaign budgets
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
            {money(stats.totalSpent)} spent of {money(stats.totalBudget)}
          </h2>

          {budgetChartData.length > 0 ? (
            <div className="mt-6 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={budgetChartData}
                  margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
                  barGap={4}
                >
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--vooki-app-text-muted)" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--vooki-app-text-muted)" }}
                    tickFormatter={(v) => `$${compact(v)}`}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Bar dataKey="Budget" fill="#b8a8e8" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="Spent" fill="#c7e27a" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center py-10 text-center">
              <DollarSign className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
              <p className="mt-3 text-sm text-[color:var(--vooki-app-text-soft)]">
                Budget data will appear once campaigns are active.
              </p>
            </div>
          )}

          {/* Legend */}
          {budgetChartData.length > 0 && (
            <div className="mt-4 flex gap-5 text-xs text-[color:var(--vooki-app-text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#b8a8e8" }} />
                Budget
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#c7e27a" }} />
                Spent
              </span>
            </div>
          )}
        </div>

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
      </section>

      {/* ============================================================ */}
      {/*  4 · Top performing + Campaign health                         */}
      {/* ============================================================ */}

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Top performing collaborations */}
        <div className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
            Top performers
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
            {topPerformers.length > 0 ? "Best-performing collaborations" : "Performance insights"}
          </h2>

          {topPerformers.length > 0 ? (
            <div className="mt-5 space-y-3">
              {topPerformers.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/brand/promotions/${p.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 transition-colors hover:bg-[color:var(--vooki-app-surface-hover)]"
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                    style={{
                      backgroundColor: ["rgba(199,226,122,0.2)", "rgba(184,168,232,0.2)", "rgba(141,169,214,0.2)"][i],
                      color: ["#c7e27a", "#b8a8e8", "#8da9d6"][i],
                    }}
                  >
                    #{i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[color:var(--vooki-app-text-strong)] truncate">
                      {p.campaignTitle}
                    </p>
                    <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                      {p.product}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                      {compact(p.performance.reach)}
                    </p>
                    <p className="text-xs text-[color:var(--vooki-app-text-muted)]">reach</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center py-10 text-center">
              <TrendingUp className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
              <p className="mt-3 text-sm text-[color:var(--vooki-app-text-soft)]">
                Performance rankings appear after collaborations are completed.
              </p>
            </div>
          )}
        </div>

        {/* Campaign health overview */}
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
                    c.deliverablesTotal > 0
                      ? Math.round((c.deliverablesDone / c.deliverablesTotal) * 100)
                      : 0;
                  return (
                    <Link
                      key={c.id}
                      href={`/brand/campaigns/${c.id}`}
                      className="block rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 transition-colors hover:bg-[color:var(--vooki-app-surface-hover)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[color:var(--vooki-app-text-strong)] truncate">
                            {c.name}
                          </p>
                          <p className="mt-0.5 text-xs text-[color:var(--vooki-app-text-muted)]">
                            {c.acceptedCreators} creator{c.acceptedCreators !== 1 ? "s" : ""} ·{" "}
                            {c.niche}
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
                        {c.deliverablesDone} of {c.deliverablesTotal} deliverables done
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
      {/*  5 · Aggregate performance strip                              */}
      {/* ============================================================ */}

      {(stats.totalReach > 0 || stats.totalViews > 0) && (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total reach", value: compact(stats.totalReach), icon: <Eye className="h-4 w-4" /> },
            { label: "Total views", value: compact(stats.totalViews), icon: <TrendingUp className="h-4 w-4" /> },
            { label: "Creators worked with", value: String(stats.uniqueCreators), icon: <Users className="h-4 w-4" /> },
            { label: "Total invested", value: money(stats.totalSpent), icon: <Wallet className="h-4 w-4" /> },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] px-5 py-4 shadow-[var(--vooki-shadow-app-soft)]"
            >
              <div className="text-[color:var(--vooki-app-text-muted)]">{item.icon}</div>
              <p className="mt-3 text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">
                {item.value}
              </p>
              <p className="mt-0.5 text-xs text-[color:var(--vooki-app-text-muted)]">{item.label}</p>
            </div>
          ))}
        </section>
      )}

      {/* ============================================================ */}
      {/*  6 · Empty state for brand-new accounts                       */}
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