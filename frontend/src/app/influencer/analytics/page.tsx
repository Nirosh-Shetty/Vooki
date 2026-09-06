"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpRight,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingDown,
  TrendingUp,
  Youtube,
  Instagram,
  RefreshCw,
  Handshake,
  DollarSign,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react";
import Image from "next/image";

// Format numbers nicely (e.g., 1500 -> 1.5K)
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function InfluencerAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"}/api/analytics/creator/me`, {
          credentials: "include",
        });
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || "Failed to load analytics");
        }
      } catch (err) {
        setError("Error connecting to server");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[color:var(--vooki-app-text-muted)]">
          <RefreshCw className="h-8 w-8 animate-spin text-[color:var(--vooki-accent)]" />
          <p className="text-sm">Loading your analytics story...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[color:var(--vooki-app-text-muted)]">
          <p className="text-sm">{error || "No data available"}</p>
        </div>
      </div>
    );
  }

  const { summary, platforms, collaborations, topCollaborations, earnings } = data;

  const summaryCards = [
    {
      title: "Total Reach",
      value: formatNumber(summary.totalReach),
      icon: <Users className="h-4 w-4" />,
      tone: "bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)] border-[color:var(--vooki-violet-soft)]",
      glow: "var(--vooki-app-glow-violet)",
    },
    {
      title: "Avg. Engagement",
      value: `${summary.engagementRate}%`,
      icon: <Activity className="h-4 w-4" />,
      tone: "bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)] border-[color:var(--vooki-accent-border)]",
      glow: "var(--vooki-app-glow-green)",
    },
    {
      title: "Total Earned",
      value: formatCurrency(earnings.totalEarned),
      icon: <DollarSign className="h-4 w-4" />,
      tone: "bg-[color:var(--vooki-warm-soft)] text-[color:var(--vooki-warm)] border-[color:var(--vooki-warm-soft)]",
      glow: "var(--vooki-app-glow-violet)",
    },
    {
      title: "Completed Collabs",
      value: summary.completedCollabs,
      icon: <Handshake className="h-4 w-4" />,
      tone: "bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue)] border-[color:var(--vooki-blue-soft)]",
      glow: "var(--vooki-app-glow-blue)",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

      {/* Hero Summary Section */}
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
          Your Performance
        </h1>
        <p className="text-[color:var(--vooki-app-text-soft)]">
          A high-level view of your momentum across all connected platforms and collaborations.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 pt-4">
          {summaryCards.map((item) => (
            <Card
              key={item.title}
              className="relative overflow-hidden rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] shadow-[var(--vooki-shadow-app-soft)] transition-all hover:-translate-y-1 hover:shadow-md"
            >
              {/* Subtle background glow */}
              <div
                className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[40px] opacity-40 transition-opacity"
                style={{ backgroundColor: item.glow }}
              />

              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center justify-center rounded-xl border p-2.5 ${item.tone}`}>
                    {item.icon}
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-sm font-medium text-[color:var(--vooki-app-text-muted)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                    {item.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Platform Breakdown */}
        <div className="space-y-6 lg:col-span-1">
          <h2 className="text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">Audience</h2>

          {/* YouTube Card */}
          {platforms?.youtube?.connected ? (
            <PlatformCard
              platform="YouTube"
              icon={<Youtube className="h-5 w-5" />}
              color="text-red-500"
              bg="bg-red-500/10"
              border="border-red-500/20"
              data={[
                { label: "Subscribers", value: formatNumber(platforms.youtube.metrics.subscribers) },
                { label: "Total Views", value: formatNumber(platforms.youtube.metrics.totalViews) },
                { label: "Avg Engagement", value: `${platforms.youtube.metrics.engagementRate}%` }
              ]}
              profile={platforms.youtube.profile}
            />
          ) : (
            <EmptyPlatformCard platform="YouTube" icon={<Youtube className="h-5 w-5" />} />
          )}

          {/* Instagram Card */}
          {platforms?.instagram?.connected ? (
            <PlatformCard
              platform="Instagram"
              icon={<Instagram className="h-5 w-5" />}
              color="text-pink-500"
              bg="bg-pink-500/10"
              border="border-pink-500/20"
              data={[
                { label: "Followers", value: formatNumber(platforms.instagram.metrics.followers) },
                { label: "Following", value: formatNumber(platforms.instagram.metrics.following) },
                { label: "Posts", value: formatNumber(platforms.instagram.metrics.mediaCount) }
              ]}
              profile={platforms.instagram.profile}
            />
          ) : (
            <EmptyPlatformCard platform="Instagram" icon={<Instagram className="h-5 w-5" />} />
          )}
        </div>

        {/* Right Column: Collaborations & Earnings */}
        <div className="space-y-8 lg:col-span-2">

          {/* Earnings Strip */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">Earnings Overview</h2>
            <Card className="rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)] backdrop-blur-md">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-sm text-[color:var(--vooki-app-text-muted)]">Available to Pay</p>
                    <p className="text-xl font-semibold text-[color:var(--vooki-accent-strong)]">{formatCurrency(earnings.readyForPayment)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-[color:var(--vooki-app-text-muted)]">Pending (Escrow)</p>
                    <p className="text-xl font-semibold text-[color:var(--vooki-blue)]">{formatCurrency(earnings.byMethod.escrow)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-[color:var(--vooki-app-text-muted)]">Direct Payments</p>
                    <p className="text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">{formatCurrency(earnings.byMethod.direct)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-[color:var(--vooki-app-text-muted)]">Total Collabs Paid</p>
                    <p className="text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">{earnings.totalTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Collaborations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">Top Collaborations</h2>
              <Badge variant="outline" className="rounded-full border-[color:var(--vooki-app-border)] text-[color:var(--vooki-app-text-soft)]">
                By Reach
              </Badge>
            </div>

            <div className="space-y-3">
              {topCollaborations.length > 0 ? (
                topCollaborations.map((collab: any) => (
                  <div
                    key={collab.id}
                    className="group relative flex flex-col justify-between gap-4 rounded-[24px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-5 transition-all hover:border-[color:var(--vooki-app-border-strong)] hover:shadow-md sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-4">
                      {/* Brand Avatar */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color:var(--vooki-app-surface-hover)] border border-[color:var(--vooki-app-border)] overflow-hidden">
                        {collab.brandAvatar ? (
                          <Image src={collab.brandAvatar} alt={collab.brandName} width={48} height={48} className="object-cover" />
                        ) : (
                          <span className="text-sm font-semibold text-[color:var(--vooki-app-text-muted)]">
                            {collab.brandName.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[color:var(--vooki-app-text-strong)] group-hover:text-[color:var(--vooki-accent-strong)] transition-colors">
                          {collab.campaignTitle}
                        </h3>
                        <p className="text-sm text-[color:var(--vooki-app-text-soft)]">
                          with {collab.brandName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 sm:justify-end">
                      <div className="space-y-1 text-center sm:text-right">
                        <p className="text-xs uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Reach</p>
                        <p className="font-medium text-[color:var(--vooki-app-text-strong)]">{formatNumber(collab.performance.reach)}</p>
                      </div>
                      <div className="space-y-1 text-center sm:text-right">
                        <p className="text-xs uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Engagement</p>
                        <p className="font-medium text-[color:var(--vooki-app-text-strong)]">{formatNumber(collab.performance.engagement)}</p>
                      </div>
                      <div className="space-y-1 text-center sm:text-right">
                        <p className="text-xs uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Paid</p>
                        <p className="font-medium text-[color:var(--vooki-accent-strong)]">{formatCurrency(collab.paymentAmount)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Card className="rounded-[24px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                    <Handshake className="mb-4 h-10 w-10 text-[color:var(--vooki-app-text-muted)] opacity-50" />
                    <p className="text-[color:var(--vooki-app-text-strong)] font-medium">No completed collaborations yet</p>
                    <p className="text-sm text-[color:var(--vooki-app-text-soft)] mt-1">Your top performing campaigns will appear here.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function PlatformCard({
  platform,
  icon,
  color,
  bg,
  border,
  data,
  profile
}: {
  platform: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  data: { label: string, value: string }[];
  profile: any;
}) {
  return (
    <Card className="relative overflow-hidden rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)] backdrop-blur-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between border-b border-[color:var(--vooki-app-border)] pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${bg} ${border} ${color}`}>
              {icon}
            </div>
            <div>
              <p className="font-medium text-[color:var(--vooki-app-text-strong)]">{platform}</p>
              <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                {profile.username || profile.customUrl || "Connected"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`border-transparent ${bg} ${color} rounded-full px-2 py-0.5 text-xs font-medium`}>
            Active
          </Badge>
        </div>

        <div className="mt-5 space-y-4">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-[color:var(--vooki-app-text-soft)]">{item.label}</span>
              <span className="font-semibold text-[color:var(--vooki-app-text-strong)]">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyPlatformCard({ platform, icon }: { platform: string; icon: React.ReactNode }) {
  return (
    <Card className="relative overflow-hidden rounded-[28px] border-[color:var(--vooki-app-border)] border-dashed bg-transparent shadow-none">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--vooki-app-surface-hover)] text-[color:var(--vooki-app-text-muted)]">
          {icon}
        </div>
        <p className="font-medium text-[color:var(--vooki-app-text-strong)]">{platform} Not Connected</p>
        <p className="mt-1 text-xs text-[color:var(--vooki-app-text-soft)]">Connect in your profile settings to track audience growth.</p>
      </CardContent>
    </Card>
  );
}
