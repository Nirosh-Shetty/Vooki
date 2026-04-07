"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  CheckCircle2,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
  ArrowRight,
  Eye,
  Clock3,
} from "lucide-react"

type EarningStatus = "pending" | "ready_for_payment" | "paid" | "failed"
type PaymentMethod = "direct" | "escrow"

type EarningRecord = {
  id: string
  campaignTitle: string
  brandName: string
  brandHandle?: string
  promotionId?: string
  amount: number
  status: EarningStatus
  paymentMethod: PaymentMethod
  currency: string
  reach?: number
  views?: number
  engagement?: number
  datePaid?: string
  dueDate: string
  createdAt: string
  description?: string
}

type EarningSummary = {
  totalEarned: number
  pending: number
  readyForPayment: number
  paid: number
}

const statusColors: Record<EarningStatus, string> = {
  pending: "border-0 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  ready_for_payment: "border-0 bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  paid: "border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  failed: "border-0 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
}

const statusLabels: Record<EarningStatus, string> = {
  pending: "In progress",
  ready_for_payment: "Ready for payment",
  paid: "Paid",
  failed: "Payment issue",
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

export default function EarningsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<EarningStatus | "all">("all")
  const [earnings, setEarnings] = useState<EarningRecord[]>([])
  const [summary, setSummary] = useState<EarningSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== "influencer") {
      setEarnings([])
      setSummary(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    const loadEarnings = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [earningsResponse, summaryResponse] = await Promise.all([
          fetch(`${backendUrl}/api/earnings/me`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch(`${backendUrl}/api/earnings/me/summary`, {
            credentials: "include",
            cache: "no-store",
          }),
        ])

        const earningsData = await earningsResponse.json().catch(() => ({}))
        const summaryData = await summaryResponse.json().catch(() => ({}))

        if (!earningsResponse.ok) {
          throw new Error(earningsData?.error || "Failed to load earnings")
        }
        if (!summaryResponse.ok) {
          throw new Error(summaryData?.error || "Failed to load earnings summary")
        }

        if (cancelled) return
        setEarnings(Array.isArray(earningsData?.data) ? earningsData.data : [])
        setSummary(summaryData?.data || null)
      } catch (loadError) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : "Failed to load earnings")
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadEarnings()

    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  const filteredEarnings = useMemo(() => {
    const query = search.trim().toLowerCase()
    return earnings.filter((earning) => {
      const matchesText =
        !query ||
        earning.campaignTitle.toLowerCase().includes(query) ||
        earning.brandName.toLowerCase().includes(query) ||
        (earning.brandHandle || "").toLowerCase().includes(query)
      const matchesTab = activeTab === "all" || earning.status === activeTab
      return matchesText && matchesTab
    })
  }, [activeTab, earnings, search])

  const counts = useMemo(
    () => ({
      all: earnings.length,
      pending: earnings.filter((earning) => earning.status === "pending").length,
      ready_for_payment: earnings.filter((earning) => earning.status === "ready_for_payment").length,
      paid: earnings.filter((earning) => earning.status === "paid").length,
    }),
    [earnings]
  )

  const metrics = summary || {
    totalEarned: earnings.filter((earning) => earning.status === "paid").reduce((sum, earning) => sum + earning.amount, 0),
    pending: earnings.filter((earning) => earning.status === "pending").reduce((sum, earning) => sum + earning.amount, 0),
    readyForPayment: earnings.filter((earning) => earning.status === "ready_for_payment").reduce((sum, earning) => sum + earning.amount, 0),
    paid: earnings.filter((earning) => earning.status === "paid").reduce((sum, earning) => sum + earning.amount, 0),
  }

  const thisMonth = useMemo(() => {
    const now = new Date()
    return earnings
      .filter((earning) => {
        const relevantDate = new Date(earning.datePaid || earning.createdAt)
        return relevantDate.getMonth() === now.getMonth() && relevantDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, earning) => sum + (earning.status === "paid" ? earning.amount : 0), 0)
  }, [earnings])

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading earnings...
        </div>
      </div>
    )
  }

  if (!user || user.role !== "influencer") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-6 text-sm text-slate-600 dark:text-slate-300">
            Earnings are available on influencer accounts once collaborations move into payout.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8">
      <Card className="border-white/60 bg-white/85 shadow-lg shadow-green-100/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <Badge className="border-0 bg-green-100 text-green-900 hover:bg-green-100 dark:bg-green-500/20 dark:text-green-300">
              <Sparkles className="mr-1 h-3.5 w-3.5" /> Revenue Hub
            </Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Earnings</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Track what is still in progress, what is ready for payout, and what has already been paid.
            </p>
          </div>
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-500/10 dark:text-green-200">
            Earnings are created from the collaboration flow, so this page becomes your payout timeline instead of a separate manual tool.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total earned" value={formatMoney(metrics.totalEarned)} icon={<Wallet className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />} tone="emerald" />
        <MetricCard label="In progress" value={formatMoney(metrics.pending)} icon={<Clock3 className="h-5 w-5 text-amber-700 dark:text-amber-300" />} tone="amber" />
        <MetricCard label="Ready for payout" value={formatMoney(metrics.readyForPayment)} icon={<CheckCircle2 className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />} tone="cyan" />
        <MetricCard label="This month" value={formatMoney(thisMonth)} icon={<TrendingUp className="h-5 w-5 text-sky-700 dark:text-sky-300" />} tone="sky" />
      </div>

      <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by campaign or brand"
              className="h-10 border-slate-300 bg-white pl-10 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EarningStatus | "all")} className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-4 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="pending">In progress ({counts.pending})</TabsTrigger>
              <TabsTrigger value="ready_for_payment">Ready ({counts.ready_for_payment})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({counts.paid})</TabsTrigger>
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
        {filteredEarnings.length === 0 ? (
          <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <CardContent className="flex flex-col items-center px-4 py-12 text-center">
              <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                <Wallet className="h-6 w-6 text-slate-500 dark:text-slate-300" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">No earnings found</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Earnings will appear here after collaborations move toward payout.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {filteredEarnings.map((earning) => (
          <Card key={earning.id} className="border-slate-200 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/85">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg text-slate-900 dark:text-slate-100">{earning.campaignTitle}</CardTitle>
                    <Badge className={statusColors[earning.status]}>{statusLabels[earning.status]}</Badge>
                  </div>
                  <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                    {earning.brandName}
                    {earning.brandHandle ? ` - ${earning.brandHandle}` : ""}
                  </CardDescription>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatMoney(earning.amount, earning.currency)}</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3 dark:text-slate-300">
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                  <Calendar className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  <span>{earning.status === "paid" && earning.datePaid ? `Paid ${new Date(earning.datePaid).toLocaleDateString()}` : `Due ${new Date(earning.dueDate).toLocaleDateString()}`}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                  <Eye className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
                  <span>Reach {earning.reach ? earning.reach.toLocaleString() : "-"}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                  <TrendingUp className="h-4 w-4 text-sky-700 dark:text-sky-300" />
                  <span>Engagement {earning.engagement ? `${earning.engagement}%` : "-"}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  {paymentMethodLabels[earning.paymentMethod]}
                  {earning.description ? ` - ${earning.description}` : ""}
                </div>
                {earning.promotionId ? (
                  <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700" asChild>
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
  icon: ReactNode
  tone: "emerald" | "amber" | "cyan" | "sky"
}) {
  const toneClass = {
    emerald: "bg-emerald-100 dark:bg-emerald-500/20",
    amber: "bg-amber-100 dark:bg-amber-500/20",
    cyan: "bg-cyan-100 dark:bg-cyan-500/20",
    sky: "bg-sky-100 dark:bg-sky-500/20",
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
