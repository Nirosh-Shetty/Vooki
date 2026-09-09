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
  Activity,
  AlertCircle,
  BarChart3,
  DollarSign,
  Download,
  Eye,
  Handshake,
  Heart,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Youtube,
  Instagram,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

import { ProtectedRoute } from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type CreatorAnalyticsData = {
  summary: {
    totalReach: number;
    totalViews: number;
    totalEngagement: number;
    engagementRate: number;
    totalEarned: number;
    completedCollabs: number;
    activeCollabs: number;
    totalCollabs: number;
  };
  platforms: {
    youtube: any;
    instagram: any;
  };
  collaborations: any[];
  topCollaborations: any[];
  earnings: {
    totalEarned: number;
    pending: number;
    readyForPayment: number;
    byMethod: { direct: number; escrow: number };
  };
  trends: { month: string; Earned: number; Reach: number; Engagement: number }[];
  performanceByBrand: { brandId: string; brandName: string; brandAvatar: string; reach: number; earned: number; collabs: number }[];
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
  }).format(v || 0);

const compact = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v || 0);
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
          <Pulse key={i} className="h-28 rounded-[28px]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Pulse className="h-72 rounded-[28px]" />
        <Pulse className="h-72 rounded-[28px]" />
      </div>
      <Pulse className="h-80 w-full rounded-[28px]" />
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
          {entry.name === "Earned"
            ? money(entry.value)
            : compact(entry.value)}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page root                                                          */
/* ------------------------------------------------------------------ */

export default function InfluencerAnalytics() {
  return (
    <ProtectedRoute requiredRole="influencer">
      <InfluencerAnalyticsContent />
    </ProtectedRoute>
  );
}

function InfluencerAnalyticsContent() {
  const { user } = useAuth();
  const [data, setData] = useState<CreatorAnalyticsData | null>(null);
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
          `${API}/api/analytics/creator/me?range=${range}`,
          { credentials: "include", signal },
        );
        if (!res.ok) throw new Error("fetch failed");
        const result = await res.json();
        if (result.success) setData(result.data);
        else throw new Error(result.error || "Failed to load analytics");
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
    summary,
    platforms,
    collaborations,
    topCollaborations,
    earnings,
    trends,
    performanceByBrand,
  } = data;

  const hasData = summary.totalCollabs > 0 || summary.totalEarned > 0;
  const maxReach = Math.max(...collaborations.map((c: any) => c.performance.reach), 1);
  const maxBrandReach = Math.max(...performanceByBrand.map(b => b.reach), 1);

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
            "linear-gradient(135deg, color-mix(in srgb, var(--vooki-violet-soft) 100%, transparent), color-mix(in srgb, var(--vooki-accent-soft) 100%, transparent) 55%, color-mix(in srgb, var(--vooki-blue-soft) 100%, transparent))",
        }}
      >
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--vooki-app-text-muted)]">
              Creator Intelligence
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Reach",
            value: compact(summary.totalReach),
            sub: `${compact(summary.totalViews)} views`,
            icon: <Users className="h-5 w-5" />,
            accent: "#b8a8e8",
            accentBg: "rgba(184,168,232,0.15)",
          },
          {
            label: "Avg Engagement",
            value: `${summary.engagementRate}%`,
            sub: "across all platforms",
            icon: <Activity className="h-5 w-5" />,
            accent: "#c7e27a",
            accentBg: "rgba(199,226,122,0.15)",
          },
          {
            label: "Total Earned",
            value: money(summary.totalEarned),
            sub: `${money(earnings.pending)} pending`,
            icon: <DollarSign className="h-5 w-5" />,
            accent: "#f0bb7a",
            accentBg: "rgba(240,187,122,0.15)",
          },
          {
            label: "Completed Collabs",
            value: String(summary.completedCollabs),
            sub: `${summary.activeCollabs} active`,
            icon: <Handshake className="h-5 w-5" />,
            accent: "#8da9d6",
            accentBg: "rgba(141,169,214,0.15)",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--vooki-app-border-strong)] hover:shadow-md"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[color:var(--vooki-app-surface-strong)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-subtle)]">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-[color:var(--vooki-app-text-strong)]">
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
      {/*  3 · Charts — Earnings Trend + Reach Growth                   */}
      {/* ============================================================ */}

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Earnings trend */}
        <div className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
            Earnings trend
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
            Income over time
          </h2>

          {trends.length > 1 ? (
            <div className="mt-6 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trends}
                  margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="gradEarned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f0bb7a" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f0bb7a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--vooki-app-text-muted)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--vooki-app-text-muted)" }} tickFormatter={(v) => `$${compact(v)}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="Earned" stroke="#f0bb7a" strokeWidth={2} fill="url(#gradEarned)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center py-10 text-center">
              <BarChart3 className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
              <p className="mt-3 text-sm text-[color:var(--vooki-app-text-soft)]">
                Earnings trends appear once you have transactions across multiple months.
              </p>
            </div>
          )}
        </div>

        {/* Reach growth */}
        <div className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
            Performance trend
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
            Reach &amp; engagement growth
          </h2>

          {trends.length > 1 ? (
            <div className="mt-6 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trends}
                  margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="gradReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b8a8e8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#b8a8e8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradEng" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c7e27a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#c7e27a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--vooki-app-text-muted)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--vooki-app-text-muted)" }} tickFormatter={(v) => compact(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="Reach" stroke="#b8a8e8" strokeWidth={2} fill="url(#gradReach)" />
                  <Area type="monotone" dataKey="Engagement" stroke="#c7e27a" strokeWidth={2} fill="url(#gradEng)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center py-10 text-center">
              <TrendingUp className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
              <p className="mt-3 text-sm text-[color:var(--vooki-app-text-soft)]">
                Reach trends will appear as you complete more collaborations over time.
              </p>
            </div>
          )}

          {trends.length > 1 && (
            <div className="mt-4 flex gap-5 text-xs text-[color:var(--vooki-app-text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#b8a8e8" }} /> Reach
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#c7e27a" }} /> Engagement
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  4 · Performance Breakdown (tabbed)                           */}
      {/* ============================================================ */}

      <section className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
              Performance breakdown
            </p>
            <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
              Your detailed track record
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
              value="brand"
              className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=active]:bg-[color:var(--vooki-app-text-strong)] data-[state=active]:text-[color:var(--vooki-app-bg)] data-[state=active]:shadow-sm"
            >
              By Brand
            </TabsTrigger>
          </TabsList>

          {/* ── By Campaign ────────────────────────────────────────── */}
          <TabsContent value="campaign" className="mt-5">
            {collaborations.length > 0 ? (
              <div className="space-y-3">
                {collaborations.map((c) => {
                  return (
                    <Link
                      key={c.id}
                      href={`/influencer/my-collabs/${c.id}`}
                      className="block rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[color:var(--vooki-app-surface-hover)] hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                            {c.campaignTitle}
                          </p>
                          <p className="mt-0.5 text-xs text-[color:var(--vooki-app-text-muted)]">
                            with {c.brandName}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <Badge
                            className={`border-0 text-xs font-bold ${
                              c.status === "completed"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : c.status === "posted"
                                  ? "bg-blue-500/15 text-blue-400"
                                  : "bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-muted)]"
                            }`}
                          >
                            {c.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-[color:var(--vooki-app-text-muted)]">Reach</p>
                          <p className="font-semibold text-[color:var(--vooki-app-text-strong)]">{compact(c.performance.reach)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[color:var(--vooki-app-text-muted)]">Engagement</p>
                          <p className="font-semibold text-[color:var(--vooki-app-text-strong)]">{compact(c.performance.engagement)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[color:var(--vooki-app-text-muted)]">Earned</p>
                          <p className="font-semibold text-[color:var(--vooki-app-text-strong)]">{money(c.paymentAmount)}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs text-[color:var(--vooki-app-text-muted)]">Date</p>
                          <p className="font-semibold text-[color:var(--vooki-app-text-strong)]">{new Date(c.updatedAt || c.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <Target className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
                <p className="mt-3 text-sm text-[color:var(--vooki-app-text-soft)]">
                  Campaign performance data will appear once you have active collabs.
                </p>
              </div>
            )}
          </TabsContent>

          {/* ── By Brand ─────────────────────────────────────────── */}
          <TabsContent value="brand" className="mt-5">
            {performanceByBrand.length > 0 ? (
              <div className="space-y-3">
                {performanceByBrand.map((b, i) => (
                  <div
                    key={b.brandId}
                    className="flex items-center gap-4 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--vooki-app-surface-hover)] border border-[color:var(--vooki-app-border)] overflow-hidden">
                      {b.brandAvatar ? (
                        <Image src={b.brandAvatar} alt={b.brandName} width={40} height={40} className="object-cover" />
                      ) : (
                        <span className="text-xs font-semibold text-[color:var(--vooki-app-text-muted)]">
                          {b.brandName.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                        {b.brandName}
                      </p>
                      <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                        {b.collabs} collab{b.collabs !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex-shrink-0 space-y-0.5 text-right">
                      <p className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">{compact(b.reach)}</p>
                      <p className="text-xs text-[color:var(--vooki-app-text-muted)]">reach</p>
                    </div>
                    <div className="hidden flex-shrink-0 space-y-0.5 text-right sm:block">
                      <p className="text-sm font-semibold text-[color:var(--vooki-accent-strong)]">{money(b.earned)}</p>
                      <p className="text-xs text-[color:var(--vooki-app-text-muted)]">earned</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <Users className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
                <p className="mt-3 text-sm text-[color:var(--vooki-app-text-soft)]">
                  Brand performance data will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* ============================================================ */}
      {/*  5 · Comparison bars                                          */}
      {/* ============================================================ */}

      {performanceByBrand.length > 0 && maxBrandReach > 0 && (
        <section className="rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app-soft)] sm:p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--vooki-app-text-muted)]">
            Partner comparison
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
            Total reach by brand
          </h2>

          <div className="mt-5 space-y-3">
            {performanceByBrand
              .filter((b) => b.reach > 0)
              .map((b, i) => {
                const pct = pctOf(b.reach, maxBrandReach);
                const accent = ACCENT_CYCLE[i % ACCENT_CYCLE.length];
                return (
                  <div key={b.brandId} className="flex items-center gap-4">
                    <p className="w-28 shrink-0 truncate text-sm font-medium text-[color:var(--vooki-app-text-strong)] sm:w-40">
                      {b.brandName}
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
                      {compact(b.reach)}
                    </p>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/*  6 · Empty state                                              */}
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
            <Sparkles className="h-7 w-7" style={{ color: "#8da9d6" }} />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-[color:var(--vooki-app-text-strong)]">
            No report data yet
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
            Your analytics will populate automatically as you connect your social accounts,
            accept campaigns, and start posting content.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] px-6 text-sm font-medium text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] hover:bg-[color:var(--vooki-accent-strong)]"
            >
              <Link href="/influencer/invites">
                <Target className="mr-2 h-4 w-4" /> Check invites
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-6 text-sm font-medium text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
            >
              <Link href="/influencer/settings">
                <Activity className="mr-2 h-4 w-4" /> Connect accounts
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
