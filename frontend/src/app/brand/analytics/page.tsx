"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
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
  AlertCircle,
  BarChart3,
  DollarSign,
  Download,
  Eye,
  MousePointerClick,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import { ProtectedRoute } from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TimeRange = "7d" | "30d" | "90d" | "all";

type AnalyticsData = {
  stats: {
    totalBudget: number;
    totalSpent: number;
    avgRoi: number;
    totalReach: number;
    totalViews: number;
    totalEngagement: number;
    liveCollabs: number;
    completedCollabs: number;
    uniqueCreators: number;
    activeCampaigns: number;
    cpv: number;
    cpe: number;
  };
  spendingTrend: { month: string; Spent: number; Budget: number }[];
  reachTrend?: {
    month: string;
    Reach: number;
    Views: number;
    Engagement: number;
  }[];
  budgetChartData: { name: string; Budget: number; Spent: number }[];
  topCreators: {
    id: string;
    name: string;
    handle: string;
    reach: number;
    views: number;
    collabs: number;
  }[];
  campaignPerf: {
    id: string;
    name: string;
    niche: string;
    status: string;
    roi: number;
    budgetTotal: number;
    budgetSpent: number;
    promoCount: number;
    reach: number;
  }[];
  hasData: boolean;
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

const pctOf = (a: number, b: number) =>
  b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0;

const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

const ACCENT_CYCLE = [
  { color: "#c7e27a", bg: "rgba(199,226,122,0.2)" },
  { color: "#b8a8e8", bg: "rgba(184,168,232,0.2)" },
  { color: "#8da9d6", bg: "rgba(141,169,214,0.2)" },
  { color: "#f0bb7a", bg: "rgba(240,187,122,0.2)" },
  { color: "#c7e27a", bg: "rgba(199,226,122,0.12)" },
  { color: "#b8a8e8", bg: "rgba(184,168,232,0.12)" },
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

function ReportsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <Pulse className="h-24 w-full rounded-[28px]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Pulse className="h-72 rounded-[28px]" />
        <Pulse className="h-72 rounded-[28px]" />
      </div>
      <Pulse className="h-72 w-full rounded-[28px]" />
      <Pulse className="h-80 w-full rounded-[28px]" />
      <Pulse className="h-48 w-full rounded-[28px]" />
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Pulse key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chart Tooltip                                                      */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-4 py-3 shadow-lg">
      <p className="text-xs font-medium text-[color:var(--vooki-app-text-muted)]">
        {label}
      </p>
      {payload.map((entry: any) => (
        <p
          key={entry.name}
          className="mt-1 text-sm font-semibold"
          style={{ color: entry.color }}
        >
          {entry.name}:{" "}
          {entry.name === "Reach" ||
          entry.name === "Views" ||
          entry.name === "Engagement"
            ? compact(entry.value)
            : money(entry.value)}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page root                                                          */
/* ------------------------------------------------------------------ */

export default function BrandReportsPage() {
  return (
    <ProtectedRoute requiredRole="brand">
      <BrandReportsContent />
    </ProtectedRoute>
  );
}

function BrandReportsContent() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<TimeRange>("all");
  const [isFetching, setIsFetching] = useState(false);

  /* ── Fetch ──────────────────────────────────────────────────────── */

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      if (!data) setLoading(true);
      setIsFetching(true);
      setError(null);
      try {
        const res = await fetch(
          `${API}/api/analytics/brand/me?range=${range}`,
          { credentials: "include", signal },
        );
        if (!res.ok) throw new Error("fetch failed");
        const result = await res.json();
        if (result.success) setData(result.data);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Couldn\u2019t load report data right now.");
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [range, data],
  );

  useEffect(() => {
    const ac = new AbortController();
    fetchData(ac.signal);
    return () => ac.abort();
  }, [fetchData]);

  /* ── Render ─────────────────────────────────────────────────────── */

  if (loading || !data) return <ReportsSkeleton />;

  const {
    stats,
    spendingTrend,
    reachTrend,
    budgetChartData,
    topCreators,
    campaignPerf,
    hasData,
  } = data;

  const maxReach = Math.max(...campaignPerf.map((c) => c.reach), 1);

  return (
    <div
      className={`mx-auto w-full max-w-[1380px] space-y-8 px-4 py-8 sm:px-6 lg:px-8 transition-opacity duration-300 ${isFetching ? "opacity-60" : "opacity-100"}`}
    >
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
      {/*  1 · Header                                                   */}
      {/* ============================================================ */}

      <section
        className="relative overflow-hidden rounded-[28px] border border-[color:var(--vooki-app-border)] px-6 py-7 sm:px-8 sm:py-9"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--vooki-blue-soft) 100%, transparent), color-mix(in srgb, var(--vooki-violet-soft) 100%, transparent) 55%, color-mix(in srgb, var(--vooki-accent-soft) 100%, transparent))",
        }}
      >
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--vooki-app-text-muted)]">
              Campaign Intelligence
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)] sm:text-3xl">
              Reports &amp; Analytics
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-1">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRange(opt.value)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    range === opt.value
                      ? "bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] shadow-sm"
                      : "text-[color:var(--vooki-app-text-muted)] hover:text-[color:var(--vooki-app-text-strong)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-xs font-medium text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
              disabled
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  2 · Hero metrics                                             */}
      {/* ============================================================ */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total spend",
            value: money(stats.totalSpent),
            sub: `of ${money(stats.totalBudget)} budget`,
            icon: <Wallet className="h-5 w-5" />,
            accent: "#c7e27a",
            accentBg: "rgba(199,226,122,0.15)",
          },
          {
            label: "Total reach",
            value: compact(stats.totalReach),
            sub: `${compact(stats.totalViews)} views`,
            icon: <Eye className="h-5 w-5" />,
            accent: "#8da9d6",
            accentBg: "rgba(141,169,214,0.15)",
          },
          {
            label: "Total engagement",
            value: compact(stats.totalEngagement),
            sub: `${stats.uniqueCreators} creator${stats.uniqueCreators !== 1 ? "s" : ""}`,
            icon: <Zap className="h-5 w-5" />,
            accent: "#f0bb7a",
            accentBg: "rgba(240,187,122,0.15)",
          },
          {
            label: "Avg ROI",
            value:
              stats.avgRoi > 0
                ? `${stats.avgRoi.toFixed(1)}x`
                : "\u2014",
            sub: `${stats.activeCampaigns} active campaign${stats.activeCampaigns !== 1 ? "s" : ""}`,
            icon: <TrendingUp className="h-5 w-5" />,
            accent: "#b8a8e8",
            accentBg: "rgba(184,168,232,0.15)",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-5 shadow-[var(--vooki-shadow-app-soft)] transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--vooki-app-border-strong)] hover:shadow-md"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[color:var(--vooki-app-surface-strong)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-subtle)]">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[color:var(--vooki-app-text-strong)]">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-[color:var(--vooki-app-text-muted)]">
                  {card.sub}
                </p>
              </div>
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--vooki-app-border)] shadow-xs transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: card.accentBg,
                  color: card.accent,
                }}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ============================================================ */}
      {/*  3 · Charts — Spending Trend + Reach & Engagement Trend       */}
      {/* ============================================================ */}

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Spending trend */}
        <div className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
            Spending trend
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
            Budget vs. spend over time
          </h2>

          {spendingTrend.length > 1 ? (
            <div className="mt-6 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={spendingTrend}
                  margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c7e27a" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#c7e27a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradBudget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b8a8e8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#b8a8e8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--vooki-app-text-muted)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--vooki-app-text-muted)" }} tickFormatter={(v) => `$${compact(v)}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="Budget" stroke="#b8a8e8" strokeWidth={2} fill="url(#gradBudget)" />
                  <Area type="monotone" dataKey="Spent" stroke="#c7e27a" strokeWidth={2} fill="url(#gradSpent)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center py-10 text-center">
              <BarChart3 className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
              <p className="mt-3 text-sm text-[color:var(--vooki-app-text-soft)]">
                Spending trends appear once there are transactions across multiple months.
              </p>
            </div>
          )}

          {spendingTrend.length > 1 && (
            <div className="mt-4 flex gap-5 text-xs text-[color:var(--vooki-app-text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#b8a8e8" }} /> Budget
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#c7e27a" }} /> Spent
              </span>
            </div>
          )}
        </div>

        {/* Reach & engagement trend */}
        <div className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
            Performance trend
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
            Reach &amp; engagement over time
          </h2>

          {reachTrend && reachTrend.length > 1 ? (
            <div className="mt-6 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={reachTrend}
                  margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="gradReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8da9d6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8da9d6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b8a8e8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#b8a8e8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradEng" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f0bb7a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f0bb7a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--vooki-app-text-muted)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--vooki-app-text-muted)" }} tickFormatter={(v) => compact(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="Reach" stroke="#8da9d6" strokeWidth={2} fill="url(#gradReach)" />
                  <Area type="monotone" dataKey="Views" stroke="#b8a8e8" strokeWidth={2} fill="url(#gradViews)" />
                  <Area type="monotone" dataKey="Engagement" stroke="#f0bb7a" strokeWidth={2} fill="url(#gradEng)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center py-10 text-center">
              <TrendingUp className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
              <p className="mt-3 text-sm text-[color:var(--vooki-app-text-soft)]">
                Reach and engagement trends will appear as campaigns generate performance data.
              </p>
            </div>
          )}

          {reachTrend && reachTrend.length > 1 && (
            <div className="mt-4 flex gap-5 text-xs text-[color:var(--vooki-app-text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#8da9d6" }} /> Reach
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#b8a8e8" }} /> Views
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#f0bb7a" }} /> Engagement
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  4 · Budget utilization                                       */}
      {/* ============================================================ */}

      <section className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
          Campaign budgets
        </p>
        <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
          Budget utilization by campaign
        </h2>

        {budgetChartData.length > 0 ? (
          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barGap={4}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--vooki-app-text-muted)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--vooki-app-text-muted)" }} tickFormatter={(v) => `$${compact(v)}`} />
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
              Budget data appears once campaigns are active.
            </p>
          </div>
        )}

        {budgetChartData.length > 0 && (
          <div className="mt-4 flex gap-5 text-xs text-[color:var(--vooki-app-text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#b8a8e8" }} /> Budget
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#c7e27a" }} /> Spent
            </span>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/*  5 · Performance Breakdown (tabbed)                           */}
      {/* ============================================================ */}

      <section className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
              Performance breakdown
            </p>
            <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
              Detailed performance analysis
            </h2>
          </div>
        </div>

        <Tabs defaultValue="campaign" className="mt-5">
          <TabsList className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-1">
            <TabsTrigger
              value="campaign"
              className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=active]:bg-[color:var(--vooki-app-text-strong)] data-[state=active]:text-[color:var(--vooki-app-bg)] data-[state=active]:shadow-sm"
            >
              By Campaign
            </TabsTrigger>
            <TabsTrigger
              value="creator"
              className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=active]:bg-[color:var(--vooki-app-text-strong)] data-[state=active]:text-[color:var(--vooki-app-bg)] data-[state=active]:shadow-sm"
            >
              By Creator
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=active]:bg-[color:var(--vooki-app-text-strong)] data-[state=active]:text-[color:var(--vooki-app-bg)] data-[state=active]:shadow-sm"
            >
              Overview
            </TabsTrigger>
          </TabsList>

          {/* ── By Campaign ────────────────────────────────────────── */}
          <TabsContent value="campaign" className="mt-5">
            {campaignPerf.length > 0 ? (
              <div className="space-y-3">
                {campaignPerf.map((c) => {
                  const utilization = pctOf(c.budgetSpent, c.budgetTotal);
                  return (
                    <Link
                      key={c.id}
                      href={`/brand/campaigns/${c.id}`}
                      className="block rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[color:var(--vooki-app-surface-hover)] hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                            {c.name}
                          </p>
                          <p className="mt-0.5 text-xs text-[color:var(--vooki-app-text-muted)]">
                            {c.promoCount} creator{c.promoCount !== 1 ? "s" : ""} &middot; {c.niche}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {c.roi > 0 && (
                            <Badge className="border-0 text-xs font-bold" style={{ backgroundColor: "rgba(199,226,122,0.18)", color: "#c7e27a" }}>
                              {c.roi.toFixed(1)}x ROI
                            </Badge>
                          )}
                          <Badge
                            className={`border-0 text-xs font-bold ${
                              c.status === "active"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : c.status === "completed"
                                  ? "bg-blue-500/15 text-blue-400"
                                  : c.status === "paused"
                                    ? "bg-amber-500/15 text-amber-400"
                                    : "bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-muted)]"
                            }`}
                          >
                            {c.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-[color:var(--vooki-app-border)]">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${utilization}%`,
                            backgroundColor: utilization >= 80 ? "#c7e27a" : utilization >= 40 ? "#f0bb7a" : "#b8a8e8",
                          }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-xs text-[color:var(--vooki-app-text-muted)]">
                        <span>{money(c.budgetSpent)} of {money(c.budgetTotal)}</span>
                        {c.reach > 0 && <span>{compact(c.reach)} reach</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <Target className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
                <p className="mt-3 text-sm text-[color:var(--vooki-app-text-soft)]">
                  Campaign performance data will appear once campaigns go active.
                </p>
              </div>
            )}
          </TabsContent>

          {/* ── By Creator ─────────────────────────────────────────── */}
          <TabsContent value="creator" className="mt-5">
            {topCreators.length > 0 ? (
              <div className="space-y-3">
                {topCreators.map((creator, i) => (
                  <div
                    key={creator.id}
                    className="flex items-center gap-4 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                      style={{
                        backgroundColor: ACCENT_CYCLE[i]?.bg,
                        color: ACCENT_CYCLE[i]?.color,
                      }}
                    >
                      #{i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                        {creator.name}
                      </p>
                      <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                        {creator.handle ? `${creator.handle} \u00b7 ` : ""}
                        {creator.collabs} collab{creator.collabs !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex-shrink-0 space-y-0.5 text-right">
                      <p className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">{compact(creator.reach)}</p>
                      <p className="text-xs text-[color:var(--vooki-app-text-muted)]">reach</p>
                    </div>
                    <div className="hidden flex-shrink-0 space-y-0.5 text-right sm:block">
                      <p className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">{compact(creator.views)}</p>
                      <p className="text-xs text-[color:var(--vooki-app-text-muted)]">views</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <Users className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
                <p className="mt-3 text-sm text-[color:var(--vooki-app-text-soft)]">
                  Creator rankings will appear once collaborations have performance data.
                </p>
              </div>
            )}
          </TabsContent>

          {/* ── Overview ───────────────────────────────────────────── */}
          <TabsContent value="overview" className="mt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Active campaigns", value: String(stats.activeCampaigns), icon: <Target className="h-4 w-4" />, accent: "#c7e27a", accentBg: "rgba(199,226,122,0.12)" },
                { label: "Creators engaged", value: String(stats.uniqueCreators), icon: <Users className="h-4 w-4" />, accent: "#8da9d6", accentBg: "rgba(141,169,214,0.12)" },
                { label: "Avg cost per view", value: stats.cpv > 0 ? `$${stats.cpv.toFixed(2)}` : "\u2014", icon: <Eye className="h-4 w-4" />, accent: "#b8a8e8", accentBg: "rgba(184,168,232,0.12)" },
                { label: "Avg cost per engagement", value: stats.cpe > 0 ? `$${stats.cpe.toFixed(2)}` : "\u2014", icon: <MousePointerClick className="h-4 w-4" />, accent: "#f0bb7a", accentBg: "rgba(240,187,122,0.12)" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: item.accentBg, color: item.accent }}>
                    {item.icon}
                  </div>
                  <p className="mt-3 text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">{item.value}</p>
                  <p className="mt-0.5 text-xs text-[color:var(--vooki-app-text-muted)]">{item.label}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* ============================================================ */}
      {/*  6 · Campaign comparison                                      */}
      {/* ============================================================ */}

      {campaignPerf.length > 0 && campaignPerf.some((c) => c.reach > 0) && (
        <section className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
            Campaign comparison
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
            Reach by campaign
          </h2>

          <div className="mt-5 space-y-3">
            {[...campaignPerf]
              .sort((a, b) => b.reach - a.reach)
              .filter((c) => c.reach > 0)
              .map((c, i) => {
                const pct = pctOf(c.reach, maxReach);
                const accent = ACCENT_CYCLE[i % ACCENT_CYCLE.length];
                return (
                  <div key={c.id} className="flex items-center gap-4">
                    <p className="w-28 shrink-0 truncate text-sm font-medium text-[color:var(--vooki-app-text-strong)] sm:w-40">
                      {c.name}
                    </p>
                    <div className="flex-1">
                      <div className="h-4 rounded-full bg-[color:var(--vooki-app-border)]">
                        <div
                          className="h-4 rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: accent.color,
                            minWidth: "8px",
                          }}
                        />
                      </div>
                    </div>
                    <p className="w-16 shrink-0 text-right text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                      {compact(c.reach)}
                    </p>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/*  7 · ROI efficiency strip                                     */}
      {/* ============================================================ */}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Cost per view", value: stats.cpv > 0 ? `$${stats.cpv.toFixed(2)}` : "\u2014", icon: <Eye className="h-4 w-4" />, accent: "#8da9d6", accentBg: "rgba(141,169,214,0.12)" },
          { label: "Cost per engagement", value: stats.cpe > 0 ? `$${stats.cpe.toFixed(2)}` : "\u2014", icon: <MousePointerClick className="h-4 w-4" />, accent: "#b8a8e8", accentBg: "rgba(184,168,232,0.12)" },
          { label: "Avg campaign ROI", value: stats.avgRoi > 0 ? `${stats.avgRoi.toFixed(1)}x` : "\u2014", icon: <TrendingUp className="h-4 w-4" />, accent: "#c7e27a", accentBg: "rgba(199,226,122,0.12)" },
          { label: "Total engagement", value: compact(stats.totalEngagement), icon: <Zap className="h-4 w-4" />, accent: "#f0bb7a", accentBg: "rgba(240,187,122,0.12)" },
          { label: "Completed collabs", value: String(stats.completedCollabs), icon: <Sparkles className="h-4 w-4" />, accent: "#c7e27a", accentBg: "rgba(199,226,122,0.12)" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] px-5 py-4 shadow-[var(--vooki-shadow-app-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: item.accentBg, color: item.accent }}>
              {item.icon}
            </div>
            <p className="mt-3 text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">{item.value}</p>
            <p className="mt-0.5 text-xs text-[color:var(--vooki-app-text-muted)]">{item.label}</p>
          </div>
        ))}
      </section>

      {/* ============================================================ */}
      {/*  8 · Empty state                                              */}
      {/* ============================================================ */}

      {!hasData && !error && (
        <section
          className="flex flex-col items-center justify-center rounded-[28px] border border-[color:var(--vooki-app-border)] px-6 py-16 text-center"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--vooki-blue-soft) 60%, transparent), color-mix(in srgb, var(--vooki-violet-soft) 60%, transparent))",
          }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--vooki-blue-soft)]">
            <BarChart3 className="h-7 w-7" style={{ color: "#8da9d6" }} />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-[color:var(--vooki-app-text-strong)]">
            No report data yet
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
            Reports and analytics will populate as your campaigns progress and
            collaborations move through the pipeline. Start by creating a
            campaign or inviting creators.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] px-6 text-sm font-medium text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] hover:bg-[color:var(--vooki-accent-strong)]"
            >
              <Link href="/brand/campaigns/new">
                <Target className="mr-2 h-4 w-4" /> Create a campaign
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-6 text-sm font-medium text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
            >
              <Link href="/brand/discover">
                <Users className="mr-2 h-4 w-4" /> Discover creators
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
