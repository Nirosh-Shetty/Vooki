"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  Clock3,
  Filter,
  MessageSquare,
  Search,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react";

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
  brandId?: string;
  campaignId?: string;
  campaignTitle: string;
  status: PromotionStatus;
  paymentStatus: "pending" | "paid";
  paymentAmount: number;
  paymentDueAt: string;
  performance: {
    reach: number;
    views: number;
    engagement: number;
  };
  createdAt: string;
  brandName?: string;
};

type PromotionResponse = {
  items?: Promotion[];
};

const seedPromotions: Promotion[] = [
  {
    id: "seed_p_1",
    campaignTitle: "Spring Launch Burst",
    status: "content_in_progress",
    paymentStatus: "pending",
    paymentAmount: 1200,
    paymentDueAt: "2026-03-01",
    performance: { reach: 0, views: 0, engagement: 0 },
    createdAt: "2026-02-01T00:00:00.000Z",
    brandName: "TechCorp",
  },
  {
    id: "seed_p_2",
    campaignTitle: "Creator Testimonial Series",
    status: "metrics_submitted",
    paymentStatus: "pending",
    paymentAmount: 1100,
    paymentDueAt: "2026-02-26",
    performance: { reach: 74000, views: 61500, engagement: 8.1 },
    createdAt: "2026-02-05T00:00:00.000Z",
    brandName: "HealthBrand",
  },
];

const tabs: {
  value: "all" | "active" | "review" | "completed" | "pending";
  label: string;
  matcher: (status: PromotionStatus) => boolean;
}[] = [
    { value: "all", label: "All", matcher: () => true },
    {
      value: "active",
      label: "Active",
      matcher: (status) =>
        ["accepted", "content_in_progress", "posted", "metrics_submitted"].includes(status),
    },
    {
      value: "review",
      label: "In review",
      matcher: (status) => ["requested", "negotiating"].includes(status),
    },
    {
      value: "completed",
      label: "Completed",
      matcher: (status) => status === "completed",
    },
    {
      value: "pending",
      label: "Payout",
      matcher: (status) => status === "payment_pending",
    },
  ];

const statusMeta: Record<PromotionStatus, { label: string; tone: string; shortNote: string }> = {
  requested: {
    label: "Invite requested",
    tone: "bg-[color:var(--vooki-app-surface-hover)] text-[color:var(--vooki-app-text-soft)]",
    shortNote: "Waiting for the collaboration to start moving.",
  },
  negotiating: {
    label: "Aligning terms",
    tone: "bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]",
    shortNote: "The conversation is active and still being shaped.",
  },
  accepted: {
    label: "Accepted",
    tone: "bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]",
    shortNote: "The collaboration is confirmed and ready to move.",
  },
  content_in_progress: {
    label: "In progress",
    tone: "bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue)]",
    shortNote: "You are actively working through the deliverables.",
  },
  posted: {
    label: "Posted",
    tone: "bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue)]",
    shortNote: "Content is live and waiting on final reporting or payout.",
  },
  metrics_submitted: {
    label: "Metrics shared",
    tone: "bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]",
    shortNote: "Performance has been sent and the brand can review it.",
  },
  payment_pending: {
    label: "Payout next",
    tone: "bg-[color:var(--vooki-warm-soft)] text-[color:var(--vooki-warm)]",
    shortNote: "The work is done and payment is the next step.",
  },
  completed: {
    label: "Completed",
    tone: "bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]",
    shortNote: "Everything is closed cleanly for this collaboration.",
  },
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const priorityRank: Record<PromotionStatus, number> = {
  requested: 1,
  negotiating: 2,
  accepted: 3,
  content_in_progress: 4,
  posted: 5,
  metrics_submitted: 6,
  payment_pending: 7,
  completed: 8,
};

export default function MyCollaborations() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["value"]>("all");
  const [promotions, setPromotions] = useState<Promotion[]>(seedPromotions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions?status=all&limit=50`,
          {
            credentials: "include",
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch collaborations");

        const data: PromotionResponse = await response.json();
        if (Array.isArray(data.items)) {
          setPromotions(data.items);
        } else {
          setPromotions([]);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPromotions(seedPromotions);
        setError("Showing preview data while we reconnect live collaboration updates.");
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return promotions.filter((promotion) => {
      const matchesText =
        !query ||
        promotion.campaignTitle.toLowerCase().includes(query) ||
        (promotion.brandName || "").toLowerCase().includes(query);
      const tabRow = tabs.find((tab) => tab.value === activeTab);
      const matchesTab = tabRow ? tabRow.matcher(promotion.status) : true;
      return matchesText && matchesTab;
    });
  }, [activeTab, promotions, search]);

  const counts = useMemo(
    () => ({
      all: promotions.length,
      active: promotions.filter((p) => tabs[1].matcher(p.status)).length,
      review: promotions.filter((p) => tabs[2].matcher(p.status)).length,
      completed: promotions.filter((p) => tabs[3].matcher(p.status)).length,
      pending: promotions.filter((p) => tabs[4].matcher(p.status)).length,
    }),
    [promotions]
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8">
      {error ? (
        <Card className="rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)]">
          <CardContent className="p-4 text-sm text-[color:var(--vooki-app-text-soft)]">
            {error}
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--vooki-app-text-muted)]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by campaign or brand"
                  className="h-11 rounded-full border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] pl-10 text-[color:var(--vooki-app-text-strong)] placeholder:text-[color:var(--vooki-app-text-muted)]"
                />
              </div>
              <Button
                variant="ghost"
                className="h-11 rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-4 text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as (typeof tabs)[number]["value"])}
            className="w-full"
          >
            <TabsList className="grid h-auto w-full grid-cols-5 rounded-[20px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-2xl text-xs text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-[color:var(--vooki-app-active-bg)] data-[state=active]:text-[color:var(--vooki-app-active-text)] sm:text-sm"
                >
                  {tab.label} ({counts[tab.value]})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {loading ? (
            <Card className="rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)]">
              <CardContent className="p-6 text-sm text-[color:var(--vooki-app-text-soft)]">
                Loading collaborations...
              </CardContent>
            </Card>
          ) : null}

          {filtered.length === 0 && !loading ? (
            <Card className="rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)]">
              <CardContent className="flex flex-col items-center px-4 py-14 text-center">
                <div className="rounded-full bg-[color:var(--vooki-app-surface-strong)] p-3 text-[color:var(--vooki-app-text-soft)]">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
                  No collaborations found
                </h3>
                <p className="mt-1 max-w-md text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                  Try a different search or let the next invite come through.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {filtered.map((promotion) => {
            const meta = statusMeta[promotion.status];
            return (
              <Card
                key={promotion.id}
                onClick={() => router.push(`/influencer/my-collabs/${promotion.id}`)}
                className="group relative overflow-hidden rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)] cursor-pointer hover:border-[color:var(--vooki-app-border-hover)] transition-colors"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                          {promotion.campaignTitle || "Collaboration"}
                        </h3>
                        <Badge className={`border-0 hover:opacity-100 ${meta.tone}`}>
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--vooki-app-text-soft)]">
                        {promotion.brandName || "Brand collaboration"}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                        {meta.shortNote}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">
                        {formatMoney(promotion.paymentAmount)}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)]">
                        Payment {promotion.paymentStatus}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <InfoChip
                      icon={<CalendarClock className="h-4 w-4" />}
                      label={`Due ${new Date(promotion.paymentDueAt).toLocaleDateString()}`}
                    />
                    <InfoChip
                      icon={<Wallet className="h-4 w-4" />}
                      label={`${formatNumber(promotion.performance.views || 0)} views tracked`}
                    />
                    <InfoChip
                      icon={<Clock3 className="h-4 w-4" />}
                      label={`${promotion.performance.engagement || 0}% engagement`}
                    />
                  </div>

                  <div className="mt-5 h-2 rounded-full bg-[color:var(--vooki-app-border)]">
                    <div
                      className="h-2 rounded-full bg-[color:var(--vooki-accent)]"
                      style={{
                        width: `${Math.max(10, promotion.performance.views > 0 ? 76 : 46)}%`,
                      }}
                    />
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {promotion.brandId ? (
                      <Button
                        asChild
                        variant="ghost"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
                      >
                        <Link href={`/influencer/messages?otherUserId=${promotion.brandId}`}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Open brand chat
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* <div className="space-y-6">
          <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
            <CardContent className="p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-app-text-muted)]">
                How to read this flow
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                Think in next steps, not statuses.
              </h2>

              <div className="mt-6 space-y-3">
                <FlowHint
                  title="In review"
                  body="A brand or creator conversation is still shaping the deal, so the best action is usually opening the thread first."
                  tone="violet"
                />
                <FlowHint
                  title="In progress"
                  body="The collaboration is active, which usually means the next move is draft work, delivery, or proof."
                  tone="blue"
                />
                <FlowHint
                  title="Payout next"
                  body="The work is effectively done, so this is the point where money visibility matters most."
                  tone="warm"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
            <CardContent className="p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-app-text-muted)]">
                Fast paths
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                Jump into the exact part of the workflow you need.
              </h2>

              <div className="mt-6 space-y-3">
                <QuickLink
                  href="/influencer/messages"
                  title="Open all brand conversations"
                  description="Best when you want to clear negotiation or feedback loops first."
                />
                <QuickLink
                  href="/influencer/invites"
                  title="Review new invites"
                  description="Useful when you want to decide what enters your pipeline next."
                />
                <QuickLink
                  href="/influencer/earnings"
                  title="Check payout visibility"
                  description="Helpful when you want to focus on the money side without leaving creator flow."
                />
              </div>
            </CardContent>
          </Card>
        </div> */}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: number;
  note: string;
  tone: "accent" | "violet" | "blue" | "warm";
}) {
  const toneMap = {
    accent: "bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]",
    violet: "bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]",
    blue: "bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue)]",
    warm: "bg-[color:var(--vooki-warm-soft)] text-[color:var(--vooki-warm)]",
  } as const;

  return (
    <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 shadow-[var(--vooki-shadow-app-soft)]">
      <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${toneMap[tone]}`}>
        {label}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
        {value}
      </p>
      <p className="mt-1 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">{note}</p>
    </div>
  );
}

function InfoChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] px-3 py-2 text-sm text-[color:var(--vooki-app-text-soft)]">
      <span className="text-[color:var(--vooki-app-text-muted)]">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function FlowHint({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "violet" | "blue" | "warm";
}) {
  const toneMap = {
    violet: "bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]",
    blue: "bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue)]",
    warm: "bg-[color:var(--vooki-warm-soft)] text-[color:var(--vooki-warm)]",
  } as const;

  return (
    <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
      <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${toneMap[tone]}`}>
        {title}
      </div>
      <p className="mt-3 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">{body}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 transition-colors hover:bg-[color:var(--vooki-app-surface-hover)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-medium text-[color:var(--vooki-app-text-strong)]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
            {description}
          </p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-[color:var(--vooki-app-text-muted)]" />
      </div>
    </Link>
  );
}
