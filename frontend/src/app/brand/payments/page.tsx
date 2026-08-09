"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
  ArrowRight,
  AlertCircle,
} from "lucide-react"

type PaymentStatus = "pending" | "processing" | "completed" | "failed"
type PaymentMethod = "direct" | "escrow"

type PaymentRecord = {
  id: string
  influencerName: string
  influencerHandle?: string
  campaignTitle: string
  promotionId?: string
  amount: number
  status: PaymentStatus
  paymentMethod: PaymentMethod
  currency: string
  issuedDate: string
  dueDate: string
  processedDate?: string
  failureReason?: string
  notes?: string
}

type PaymentSummary = {
  totalSpent: number
  pending: number
  processing: number
  completed: number
  failed: number
}

const statusColors: Record<PaymentStatus, string> = {
  pending: "border-0 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  processing: "border-0 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  completed: "border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  failed: "border-0 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
}

const statusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  direct: "Direct payment",
  escrow: "Escrow",
}

const formatMoney = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export default function PaymentsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<PaymentStatus | "all">("all")
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== "brand") {
      setPayments([])
      setSummary(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    const loadPayments = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [paymentsResponse, summaryResponse] = await Promise.all([
          fetch(`${backendUrl}/api/payments/me`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch(`${backendUrl}/api/payments/me/summary`, {
            credentials: "include",
            cache: "no-store",
          }),
        ])

        const paymentsData = await paymentsResponse.json().catch(() => ({}))
        const summaryData = await summaryResponse.json().catch(() => ({}))

        if (!paymentsResponse.ok) {
          throw new Error(paymentsData?.error || "Failed to load payments")
        }
        if (!summaryResponse.ok) {
          throw new Error(summaryData?.error || "Failed to load payment summary")
        }

        if (cancelled) return
        setPayments(Array.isArray(paymentsData?.data) ? paymentsData.data : [])
        setSummary(summaryData?.data || null)
      } catch (loadError) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : "Failed to load payments")
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadPayments()

    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase()
    return payments.filter((payment) => {
      const matchesText =
        !query ||
        payment.influencerName.toLowerCase().includes(query) ||
        payment.campaignTitle.toLowerCase().includes(query) ||
        (payment.influencerHandle || "").toLowerCase().includes(query)
      const matchesTab = activeTab === "all" || payment.status === activeTab
      return matchesText && matchesTab
    })
  }, [activeTab, payments, search])

  const counts = useMemo(
    () => ({
      all: payments.length,
      pending: payments.filter((payment) => payment.status === "pending").length,
      processing: payments.filter((payment) => payment.status === "processing").length,
      completed: payments.filter((payment) => payment.status === "completed").length,
      failed: payments.filter((payment) => payment.status === "failed").length,
    }),
    [payments]
  )

  const metrics = summary || {
    totalSpent: payments.reduce((sum, payment) => sum + payment.amount, 0),
    pending: payments.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + payment.amount, 0),
    processing: payments.filter((payment) => payment.status === "processing").reduce((sum, payment) => sum + payment.amount, 0),
    completed: payments.filter((payment) => payment.status === "completed").reduce((sum, payment) => sum + payment.amount, 0),
    failed: payments.filter((payment) => payment.status === "failed").reduce((sum, payment) => sum + payment.amount, 0),
  }

  const upcomingPayments = useMemo(
    () => payments.filter((payment) => payment.status === "pending").slice(0, 3),
    [payments]
  )

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 font-semibold text-[color:var(--vooki-app-text-soft)]">
          <Loader2 className="h-6 w-6 animate-spin text-[color:var(--vooki-accent)]" />
          Loading finance hub...
        </div>
      </div>
    )
  }

  if (!user || user.role !== "brand") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-4 sm:p-5 text-center shadow-[var(--vooki-shadow-app-soft)]">
          <Wallet className="mx-auto h-12 w-12 text-[color:var(--vooki-app-text-muted)] mb-4" />
          <h2 className="text-xl font-bold text-[color:var(--vooki-app-text-strong)]">Finance Hub Access</h2>
          <p className="mt-2 text-sm text-[color:var(--vooki-app-text-soft)]">
            Finance metrics and payout records are available for brand accounts managing creator collaborations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      {/* <div className="relative overflow-hidden rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-gradient-to-r from-[color:var(--vooki-app-surface-card)] via-[color:var(--vooki-app-surface-strong)]/60 to-[color:var(--vooki-app-surface-card)] p-5 sm:p-4 sm:p-5 shadow-md">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[color:var(--vooki-app-glow-green)] opacity-30 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-16 h-48 w-48 rounded-full bg-[color:var(--vooki-app-glow-blue)] opacity-20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-3 sm:p-5 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)]/80 px-3 py-1 text-xs font-bold text-[color:var(--vooki-app-text-strong)] shadow-[var(--vooki-shadow-app-soft)] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Financial Dashboard
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[color:var(--vooki-app-text-strong)] sm:text-4xl">
              Payouts & Expenses
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-[color:var(--vooki-app-text-soft)] leading-relaxed">
              Track creator payouts, escrow releases, and campaign budget allocation in real-time.
            </p>
          </div>
        </div>
      </div> */}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total tracked" value={formatMoney(metrics.totalSpent)} icon={<Wallet className="h-5 w-5 text-blue-700 dark:text-blue-300" />} tone="blue" />
        <MetricCard label="Pending" value={formatMoney(metrics.pending)} icon={<Clock3 className="h-5 w-5 text-amber-700 dark:text-amber-300" />} tone="amber" />
        <MetricCard label="Processing" value={formatMoney(metrics.processing)} icon={<TrendingUp className="h-5 w-5 text-sky-700 dark:text-sky-300" />} tone="sky" />
        <MetricCard label="Completed" value={formatMoney(metrics.completed)} icon={<CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />} tone="emerald" />
      </div>

      {/* Toolbar & Search */}
      <div className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-4 shadow-[var(--vooki-shadow-app-soft)] space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--vooki-app-text-subtle)]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transactions by creator name or campaign title..."
              className="h-11 border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-bg)] pl-11 rounded-2xl text-sm font-medium text-[color:var(--vooki-app-text-strong)] placeholder:text-[color:var(--vooki-app-text-subtle)] focus-visible:ring-1 focus-visible:ring-[color:var(--vooki-accent)]"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PaymentStatus | "all")} className="w-full">
          <TabsList className="flex flex-wrap gap-1.5 h-auto w-full rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)]/40 p-1.5">
            {[
              { id: "all", label: `All (${counts.all})` },
              { id: "pending", label: `Pending (${counts.pending})` },
              { id: "processing", label: `Processing (${counts.processing})` },
              { id: "completed", label: `Completed (${counts.completed})` },
              { id: "failed", label: `Failed (${counts.failed})` },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 rounded-xl py-2 text-xs font-bold transition-all data-[state=active]:bg-[color:var(--vooki-app-surface-card)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] data-[state=active]:shadow-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <CardContent className="flex flex-col items-center px-4 py-12 text-center">
              <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                <Wallet className="h-6 w-6 text-slate-500 dark:text-slate-300" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">No payments found</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Payments will show up here when collaborations reach the payout step.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {filteredPayments.map((payment) => (
          <div
            key={payment.id}
            className="group relative flex flex-col justify-between gap-4 rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--vooki-app-border-strong)] hover:shadow-md"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-[color:var(--vooki-app-text-strong)]">
                    {payment.influencerName}
                  </h3>
                  <Badge className={`rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${statusColors[payment.status]}`}>
                    {statusLabels[payment.status]}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-[color:var(--vooki-app-text-soft)]">
                  {payment.campaignTitle} {payment.influencerHandle ? `• ${payment.influencerHandle}` : ""}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-2xl font-black tracking-tight text-[color:var(--vooki-app-text-strong)]">
                  {formatMoney(payment.amount, payment.currency)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between border-t border-[color:var(--vooki-app-border)]/60">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[color:var(--vooki-app-text-soft)]">
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--vooki-app-surface-strong)]/50 px-3 py-1.5 border border-[color:var(--vooki-app-border)]">
                  <Calendar className="h-3.5 w-3.5 text-[color:var(--vooki-app-text-subtle)]" />
                  <span>Due {new Date(payment.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--vooki-app-surface-strong)]/50 px-3 py-1.5 border border-[color:var(--vooki-app-border)]">
                  <CreditCard className="h-3.5 w-3.5 text-[color:var(--vooki-app-text-subtle)]" />
                  <span>{paymentMethodLabels[payment.paymentMethod]}</span>
                </div>

                {payment.status === "failed" ? (
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-1.5 border border-rose-500/20 text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{payment.failureReason || "Action required"}</span>
                  </div>
                ) : payment.processedDate ? (
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Released {new Date(payment.processedDate).toLocaleDateString()}</span>
                  </div>
                ) : null}
              </div>

              {payment.promotionId && (
                <Button
                  size="sm"
                  className="rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] font-bold hover:bg-[color:var(--vooki-app-text)] transition-all shadow-xs"
                  asChild
                >
                  <Link href={`/brand/promotions/${payment.promotionId}`}>
                    Manage Collaboration
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Upcoming due payments</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            The next collaborations waiting for payout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingPayments.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No pending payments right now.</p>
          ) : (
            upcomingPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{payment.influencerName}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{payment.campaignTitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatMoney(payment.amount, payment.currency)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Due {new Date(payment.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card> */}
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: "blue" | "amber" | "sky" | "emerald"
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--vooki-app-border-strong)] hover:shadow-[var(--vooki-shadow-app-soft)]">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[color:var(--vooki-app-surface-strong)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-subtle)]">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-[color:var(--vooki-app-text-strong)]">{value}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border)] shadow-xs transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
      </div>
    </div>
  )
}
