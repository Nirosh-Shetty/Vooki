"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ArrowRight,
  Clock3,
  Compass,
  Heart,
  MessageCircle,
  MessageSquare,
  Sparkles,
  Wallet,
  Send,
  AlertCircle
} from "lucide-react";

import { ProtectedRoute } from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const money = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);

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

type PromotionStatus =
  | "requested"
  | "negotiating"
  | "accepted"
  | "content_in_progress"
  | "posted"
  | "metrics_submitted"
  | "payment_pending"
  | "completed";

const PIPELINE_STAGES: Record<PromotionStatus, { label: string; tone: string }> = {
  requested: { label: "Requested", tone: "bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue-base)]" },
  negotiating: { label: "Negotiating", tone: "bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet-base)]" },
  accepted: { label: "Accepted", tone: "bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]" },
  content_in_progress: { label: "In Progress", tone: "bg-[color:var(--vooki-warm-soft)] text-[color:var(--vooki-warm)]" },
  posted: { label: "Posted", tone: "bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue-base)]" },
  metrics_submitted: { label: "Metrics In", tone: "bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet-base)]" },
  payment_pending: { label: "Payment Pending", tone: "bg-[color:var(--vooki-warm-soft)] text-[color:var(--vooki-warm)]" },
  completed: { label: "Done", tone: "bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]" },
};

function Pulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[color:var(--vooki-app-border)] ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <Pulse className="h-28 w-full rounded-[28px]" />
      <div className="grid gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Pulse key={i} className="h-24 w-full rounded-[28px]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Pulse className="h-72 rounded-[28px]" />
        <Pulse className="h-72 rounded-[28px]" />
      </div>
    </div>
  );
}

export default function InfluencerDashboard() {
  return (
    <ProtectedRoute requiredRole="influencer">
      <InfluencerDashboardContent />
    </ProtectedRoute>
  );
}

function InfluencerDashboardContent() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "Creator";

  const [promotions, setPromotions] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, iRes, eRes] = await Promise.all([
        fetch(`${API}/api/promotions?limit=50`, { credentials: "include", signal }),
        fetch(`${API}/api/collaborations/invites/received?limit=10`, { credentials: "include", signal }),
        fetch(`${API}/api/earnings/me/summary`, { credentials: "include", signal }),
      ]);
      
      if (!pRes.ok) throw new Error("fetch failed");
      
      const pData = await pRes.json();
      const iData = await iRes.json();
      const eData = await eRes.json();
      
      setPromotions(Array.isArray(pData?.items) ? pData.items : []);
      setInvites(Array.isArray(iData?.data) ? iData.data : []);
      setEarningsSummary(eData?.data || { totalEarned: 0, pending: 0, paid: 0 });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Couldn't load your dashboard data right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchData(ac.signal);
    return () => ac.abort();
  }, [fetchData]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-[color:var(--vooki-app-text-strong)]">{error}</p>
        <Button onClick={() => fetchData()} variant="outline" className="rounded-full">
          Try Again
        </Button>
      </div>
    );
  }

  const activeCollabs = promotions.filter(p => !['completed', 'posted'].includes(p.status));
  const needsAction = activeCollabs.filter(p => p.status === 'requested' || p.status === 'negotiating').length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8">
      {/* Header Section */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[color:var(--vooki-app-text-strong)]">
              {greeting()}, {firstName}.
            </h1>
            <p className="mt-2 text-[color:var(--vooki-app-text-soft)]">
              {needsAction > 0 
                ? `You have ${needsAction} deals needing your attention today.`
                : "You're all caught up for today."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              variant="ghost"
              className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-5 text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
            >
              <Link href="/influencer/invites">Review Invites</Link>
            </Button>
            <Button
              asChild
              className="rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] px-5 text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] hover:bg-[color:var(--vooki-accent-strong)]"
            >
              <Link href="/influencer/my-collabs">Open Collabs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 shadow-[var(--vooki-shadow-app-soft)]">
          <div className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]">
            Active Collabs
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
            {activeCollabs.length}
          </p>
        </div>
        
        <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 shadow-[var(--vooki-shadow-app-soft)]">
          <div className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue-base)]">
            Pending Invites
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
            {invites.length}
          </p>
        </div>

        <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 shadow-[var(--vooki-shadow-app-soft)]">
          <div className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-[color:var(--vooki-warm-soft)] text-[color:var(--vooki-warm)]">
            Pending Payment
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
            {money(earningsSummary?.pending || 0)}
          </p>
        </div>

        <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 shadow-[var(--vooki-shadow-app-soft)]">
          <div className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet-base)]">
            Total Earned
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
            {money(earningsSummary?.totalEarned || 0)}
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        
        {/* Active Collaborations */}
        <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
          <CardContent className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-app-text-muted)]">
                  Active Collaborations
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                  What you're working on
                </h2>
              </div>
              <Button
                asChild
                variant="ghost"
                className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
              >
                <Link href="/influencer/my-collabs">View all</Link>
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {activeCollabs.length === 0 ? (
                <div className="rounded-[26px] border border-dashed border-[color:var(--vooki-app-border-strong)] p-8 text-center">
                  <Heart className="mx-auto h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
                  <p className="mt-4 text-sm text-[color:var(--vooki-app-text-soft)]">
                    No active collaborations yet.<br />
                    Complete your Media Kit to attract more brands.
                  </p>
                  <Button asChild className="mt-4 rounded-full" variant="outline">
                    <Link href="/influencer/profile">Update Media Kit</Link>
                  </Button>
                </div>
              ) : (
                activeCollabs.slice(0, 4).map((collab) => (
                  <Link
                    key={collab.id}
                    href={`/influencer/my-collabs/${collab.id}`}
                    className="group block rounded-[26px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 sm:p-5 transition-colors hover:bg-[color:var(--vooki-app-surface-hover)]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-medium text-[color:var(--vooki-app-text-strong)]">
                          {collab.campaignTitle || collab.campaignName}
                        </p>
                        <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)]">
                          {collab.brandName}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <Badge className={`border-0 hover:opacity-100 ${PIPELINE_STAGES[collab.status as PromotionStatus]?.tone}`}>
                          {PIPELINE_STAGES[collab.status as PromotionStatus]?.label || collab.status}
                        </Badge>
                        <p className="mt-3 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
                          {money(collab.paymentAmount)}
                        </p>
                        <p className="text-sm text-[color:var(--vooki-app-text-soft)]">
                          {collab.draftDueAt ? `Due: ${new Date(collab.draftDueAt).toLocaleDateString()}` : "No due date"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {/* Pending Invites */}
          <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue-base)]">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                    New Opportunities
                  </p>
                  <p className="text-sm text-[color:var(--vooki-app-text-soft)]">
                    Invites waiting for response
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {invites.length === 0 ? (
                   <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 text-center">
                    <p className="text-sm text-[color:var(--vooki-app-text-soft)]">
                      No pending invites right now.
                    </p>
                   </div>
                ) : (
                  invites.slice(0, 3).map((invite) => (
                    <Link
                      key={invite._id}
                      href={`/influencer/invites`}
                      className="block rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 transition-colors hover:bg-[color:var(--vooki-app-surface-hover)]"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--vooki-app-text-muted)]">
                        {timeAgo(invite.createdAt)}
                      </p>
                      <p className="mt-2 text-base font-semibold text-[color:var(--vooki-app-text-strong)] truncate">
                        {invite.campaignTitle}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                        {invite.brandName} • {money(invite.compensation?.paymentAmount || 0)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Earnings Quick View */}
          <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet-base)]">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                    Earnings Snapshot
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
                  <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                    Paid Out
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--vooki-app-text-strong)]">
                    {money(earningsSummary?.paid || 0)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
                  <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                    Ready for Payment
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--vooki-app-text-strong)]">
                    {money(earningsSummary?.readyForPayment || 0)}
                  </p>
                </div>
              </div>
              
              <Button asChild variant="outline" className="mt-4 w-full rounded-full">
                <Link href="/influencer/earnings">View All Payouts</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
