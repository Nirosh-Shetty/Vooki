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
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading payments...
        </div>
      </div>
    )
  }

  if (!user || user.role !== "brand") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-6 text-sm text-slate-600 dark:text-slate-300">
            Payments are available on brand accounts once collaborations reach the payout stage.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8">
      <Card className="border-white/60 bg-white/85 shadow-lg shadow-blue-100/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <Badge className="border-0 bg-blue-100 text-blue-900 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300">
              <Sparkles className="mr-1 h-3.5 w-3.5" /> Payment Hub
            </Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Payments</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Payment records appear automatically when a collaboration moves into payout.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-500/10 dark:text-blue-200">
            Manage payment timing from the collaboration itself, then use this page to track what is due and what is already paid.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total tracked" value={formatMoney(metrics.totalSpent)} icon={<Wallet className="h-5 w-5 text-blue-700 dark:text-blue-300" />} tone="blue" />
        <MetricCard label="Pending" value={formatMoney(metrics.pending)} icon={<Clock3 className="h-5 w-5 text-amber-700 dark:text-amber-300" />} tone="amber" />
        <MetricCard label="Processing" value={formatMoney(metrics.processing)} icon={<TrendingUp className="h-5 w-5 text-sky-700 dark:text-sky-300" />} tone="sky" />
        <MetricCard label="Completed" value={formatMoney(metrics.completed)} icon={<CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />} tone="emerald" />
      </div>

      <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by influencer or campaign"
                className="h-10 border-slate-300 bg-white pl-10 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PaymentStatus | "all")} className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-5 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
              <TabsTrigger value="processing">Processing ({counts.processing})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({counts.failed})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-rose-200 bg-rose-50 shadow-sm dark:border-rose-900 dark:bg-rose-500/10">
          <CardContent className="p-4 text-sm text-rose-700 dark:text-rose-300">{error}</CardContent>
        </Card>
      ) : null}

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
          <Card key={payment.id} className="border-slate-200 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/85">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg text-slate-900 dark:text-slate-100">{payment.influencerName}</CardTitle>
                    <Badge className={statusColors[payment.status]}>{statusLabels[payment.status]}</Badge>
                  </div>
                  <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                    {payment.campaignTitle}
                    {payment.influencerHandle ? ` - ${payment.influencerHandle}` : ""}
                  </CardDescription>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatMoney(payment.amount, payment.currency)}</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3 dark:text-slate-300">
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                  <Calendar className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  <span>Due {new Date(payment.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                  <CreditCard className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  <span>{paymentMethodLabels[payment.paymentMethod]}</span>
                </div>
                {payment.status === "failed" ? (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-900 dark:bg-rose-500/10">
                    <AlertCircle className="h-4 w-4 text-rose-700 dark:text-rose-300" />
                    <span className="text-rose-700 dark:text-rose-300">{payment.failureReason || "Retry needed"}</span>
                  </div>
                ) : payment.processedDate ? (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                    <span className="text-emerald-700 dark:text-emerald-300">Paid {new Date(payment.processedDate).toLocaleDateString()}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {payment.promotionId ? (
                  <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700" asChild>
                    <Link href={`/brand/promotions/${payment.promotionId}`}>
                      Open collaboration
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
                {payment.notes ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {payment.notes}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
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
      </Card>
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
  const toneClass = {
    blue: "bg-blue-100 dark:bg-blue-500/20",
    amber: "bg-amber-100 dark:bg-amber-500/20",
    sky: "bg-sky-100 dark:bg-sky-500/20",
    emerald: "bg-emerald-100 dark:bg-emerald-500/20",
  }[tone]

  return (
    <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
          </div>
          <div className={`rounded-lg p-2 ${toneClass}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
