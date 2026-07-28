"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  Search,
  TrendingUp,
  Wallet,
  ArrowRight,
  Eye,
  Clock3,
} from "lucide-react";

type EarningStatus = "pending" | "ready_for_payment" | "paid" | "failed";
type PaymentMethod = "direct" | "escrow";

type EarningRecord = {
  id: string;
  campaignTitle: string;
  brandName: string;
  brandHandle?: string;
  promotionId?: string;
  amount: number;
  status: EarningStatus;
  paymentMethod: PaymentMethod;
  currency: string;
  reach?: number;
  views?: number;
  engagement?: number;
  datePaid?: string;
  dueDate: string;
  createdAt: string;
  description?: string;
};

type EarningSummary = {
  totalEarned: number;
  pending: number;
  readyForPayment: number;
  paid: number;
};

const statusColors: Record<EarningStatus, string> = {
  pending: "border-0 bg-[color:var(--vooki-warm-soft)] text-[color:var(--vooki-warm)]",
  ready_for_payment: "border-0 bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue)]",
  paid: "border-0 bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]",
  failed: "border-0 bg-[color:var(--vooki-warm-soft)] text-[color:var(--vooki-warm)]",
};

const statusLabels: Record<EarningStatus, string> = {
  pending: "In progress",
  ready_for_payment: "Ready for payment",
  paid: "Paid",
  failed: "Payment issue",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  direct: "Direct payment",
  escrow: "Escrow",
};

const formatMoney = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function EarningsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<EarningStatus | "all">("all");
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [summary, setSummary] = useState<EarningSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "influencer") {
      setEarnings([]);
      setSummary(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadEarnings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [earningsResponse, summaryResponse] = await Promise.all([
          fetch(`${backendUrl}/api/earnings/me`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch(`${backendUrl}/api/earnings/me/summary`, {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const earningsData = await earningsResponse.json().catch(() => ({}));
        const summaryData = await summaryResponse.json().catch(() => ({}));

        if (!earningsResponse.ok) {
          throw new Error(earningsData?.error || "Failed to load earnings");
        }
        if (!summaryResponse.ok) {
          throw new Error(summaryData?.error || "Failed to load earnings summary");
        }

        if (cancelled) return;
        setEarnings(Array.isArray(earningsData?.data) ? earningsData.data : []);
        setSummary(summaryData?.data || null);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load earnings");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadEarnings();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const filteredEarnings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return earnings.filter((earning) => {
      const matchesText =
        !query ||
        earning.campaignTitle.toLowerCase().includes(query) ||
        earning.brandName.toLowerCase().includes(query) ||
        (earning.brandHandle || "").toLowerCase().includes(query);
      const matchesTab = activeTab === "all" || earning.status === activeTab;
      return matchesText && matchesTab;
    });
  }, [activeTab, earnings, search]);

  const counts = useMemo(
    () => ({
      all: earnings.length,
      pending: earnings.filter((earning) => earning.status === "pending").length,
      ready_for_payment: earnings.filter((earning) => earning.status === "ready_for_payment")
        .length,
      paid: earnings.filter((earning) => earning.status === "paid").length,
    }),
    [earnings]
  );

  const metrics = summary || {
    totalEarned: earnings
      .filter((earning) => earning.status === "paid")
      .reduce((sum, earning) => sum + earning.amount, 0),
    pending: earnings
      .filter((earning) => earning.status === "pending")
      .reduce((sum, earning) => sum + earning.amount, 0),
    readyForPayment: earnings
      .filter((earning) => earning.status === "ready_for_payment")
      .reduce((sum, earning) => sum + earning.amount, 0),
    paid: earnings
      .filter((earning) => earning.status === "paid")
      .reduce((sum, earning) => sum + earning.amount, 0),
  };

  const thisMonth = useMemo(() => {
    const now = new Date();
    return earnings
      .filter((earning) => {
        const relevantDate = new Date(earning.datePaid || earning.createdAt);
        return (
          relevantDate.getMonth() === now.getMonth() &&
          relevantDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, earning) => sum + (earning.status === "paid" ? earning.amount : 0), 0);
  }, [earnings]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-[color:var(--vooki-app-text-soft)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading earnings...
        </div>
      </div>
    );
  }

  if (!user || user.role !== "influencer") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card className="rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)]">
          <CardContent className="p-6 text-sm text-[color:var(--vooki-app-text-soft)]">
            Earnings are available on influencer accounts once collaborations move into payout.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total earned"
          value={formatMoney(metrics.totalEarned)}
          icon={<Wallet className="h-5 w-5 text-[color:var(--vooki-accent-strong)]" />}
          tone="emerald"
        />
        <MetricCard
          label="In progress"
          value={formatMoney(metrics.pending)}
          icon={<Clock3 className="h-5 w-5 text-[color:var(--vooki-warm)]" />}
          tone="amber"
        />
        <MetricCard
          label="Ready for payout"
          value={formatMoney(metrics.readyForPayment)}
          icon={<CheckCircle2 className="h-5 w-5 text-[color:var(--vooki-blue)]" />}
          tone="cyan"
        />
        <MetricCard
          label="This month"
          value={formatMoney(thisMonth)}
          icon={<TrendingUp className="h-5 w-5 text-[color:var(--vooki-violet)]" />}
          tone="sky"
        />
      </div>

      <Card className="rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)]">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--vooki-app-text-muted)]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by campaign or brand"
              className="h-11 rounded-full border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] pl-10 text-[color:var(--vooki-app-text-strong)] placeholder:text-[color:var(--vooki-app-text-muted)]"
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as EarningStatus | "all")}
            className="w-full"
          >
            <TabsList className="grid h-auto w-full grid-cols-4 rounded-[20px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-1">
              <TabsTrigger
                value="all"
                className="rounded-2xl text-xs text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-[color:var(--vooki-app-active-bg)] data-[state=active]:text-[color:var(--vooki-app-active-text)] sm:text-sm"
              >
                All ({counts.all})
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="rounded-2xl text-xs text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-[color:var(--vooki-app-active-bg)] data-[state=active]:text-[color:var(--vooki-app-active-text)] sm:text-sm"
              >
                In progress ({counts.pending})
              </TabsTrigger>
              <TabsTrigger
                value="ready_for_payment"
                className="rounded-2xl text-xs text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-[color:var(--vooki-app-active-bg)] data-[state=active]:text-[color:var(--vooki-app-active-text)] sm:text-sm"
              >
                Ready ({counts.ready_for_payment})
              </TabsTrigger>
              <TabsTrigger
                value="paid"
                className="rounded-2xl text-xs text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-[color:var(--vooki-app-active-bg)] data-[state=active]:text-[color:var(--vooki-app-active-text)] sm:text-sm"
              >
                Paid ({counts.paid})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {error ? (
        <Card className="rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)]">
          <CardContent className="p-4 text-sm text-[color:var(--vooki-warm)]">{error}</CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {filteredEarnings.length === 0 ? (
          <Card className="rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)]">
            <CardContent className="flex flex-col items-center px-4 py-14 text-center">
              <div className="rounded-full bg-[color:var(--vooki-app-surface-strong)] p-3">
                <Wallet className="h-6 w-6 text-[color:var(--vooki-app-text-soft)]" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
                No earnings found
              </h3>
              <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)]">
                Earnings will appear here after collaborations move toward payout.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {filteredEarnings.map((earning) => (
          <Card
            key={earning.id}
            className="rounded-[30px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)] transition-transform hover:-translate-y-0.5"
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg text-[color:var(--vooki-app-text-strong)]">
                      {earning.campaignTitle}
                    </CardTitle>
                    <Badge className={statusColors[earning.status]}>
                      {statusLabels[earning.status]}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-[color:var(--vooki-app-text-soft)]">
                    {earning.brandName}
                    {earning.brandHandle ? ` - ${earning.brandHandle}` : ""}
                  </CardDescription>
                </div>
                <p className="text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
                  {formatMoney(earning.amount, earning.currency)}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm text-[color:var(--vooki-app-text-soft)] sm:grid-cols-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] px-3 py-2">
                  <Calendar className="h-4 w-4 text-[color:var(--vooki-app-text-muted)]" />
                  <span>
                    {earning.status === "paid" && earning.datePaid
                      ? `Paid ${new Date(earning.datePaid).toLocaleDateString()}`
                      : `Due ${new Date(earning.dueDate).toLocaleDateString()}`}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] px-3 py-2">
                  <Eye className="h-4 w-4 text-[color:var(--vooki-blue)]" />
                  <span>Reach {earning.reach ? earning.reach.toLocaleString() : "-"}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] px-3 py-2">
                  <TrendingUp className="h-4 w-4 text-[color:var(--vooki-violet)]" />
                  <span>Engagement {earning.engagement ? `${earning.engagement}%` : "-"}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] px-3 py-2 text-xs text-[color:var(--vooki-app-text-soft)]">
                  {paymentMethodLabels[earning.paymentMethod]}
                  {earning.description ? ` - ${earning.description}` : ""}
                </div>
                {earning.promotionId ? (
                  <Button
                    size="sm"
                    className="rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] hover:bg-[color:var(--vooki-accent-strong)]"
                    asChild
                  >
                    <Link href={`/influencer/my-collabs/${earning.promotionId}`}>
                      Open collaboration
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "emerald" | "amber" | "cyan" | "sky";
}) {
  const toneClass = {
    emerald: "bg-[color:var(--vooki-accent-soft)]",
    amber: "bg-[color:var(--vooki-warm-soft)]",
    cyan: "bg-[color:var(--vooki-blue-soft)]",
    sky: "bg-[color:var(--vooki-violet-soft)]",
  }[tone];

  return (
    <Card className="rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[color:var(--vooki-app-text-soft)]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--vooki-app-text-strong)]">
              {value}
            </p>
          </div>
          <div className={`rounded-2xl p-2 ${toneClass}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
