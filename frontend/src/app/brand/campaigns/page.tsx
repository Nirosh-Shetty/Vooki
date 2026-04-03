"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  CalendarDays,
  CheckCircle2,
  CirclePause,
  Clock3,
  Filter,
  Flag,
  Layers3,
  Plus,
  Search,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"

type CampaignStatus = "draft" | "active" | "paused" | "completed" | "archived"
type CampaignPriority = "low" | "medium" | "high"
type PaymentMethod = "direct" | "escrow"

type Campaign = {
  id: string
  name: string
  objective: string
  niche: string
  status: CampaignStatus
  priority: CampaignPriority
  paymentMethod: PaymentMethod
  budgetTotal: number
  budgetSpent: number
  roi: number
  startDate: string
  endDate: string
  invitedCreators: number
  acceptedCreators: number
  deliverablesDone: number
  deliverablesTotal: number
}

const seedCampaigns: Campaign[] = [
  {
    id: "cmp_01",
    name: "Spring Launch Burst",
    objective: "Drive product awareness across short-form channels",
    niche: "Lifestyle",
    status: "active",
    priority: "high",
    paymentMethod: "direct",
    budgetTotal: 14500,
    budgetSpent: 8200,
    roi: 4.1,
    startDate: "2026-02-05",
    endDate: "2026-03-02",
    invitedCreators: 21,
    acceptedCreators: 11,
    deliverablesDone: 18,
    deliverablesTotal: 32,
  },
  {
    id: "cmp_02",
    name: "Creator Testimonial Series",
    objective: "Build social proof for paid ads and website",
    niche: "Tech",
    status: "active",
    priority: "medium",
    paymentMethod: "direct",
    budgetTotal: 9200,
    budgetSpent: 4100,
    roi: 3.6,
    startDate: "2026-02-11",
    endDate: "2026-03-06",
    invitedCreators: 14,
    acceptedCreators: 7,
    deliverablesDone: 9,
    deliverablesTotal: 20,
  },
  {
    id: "cmp_03",
    name: "Feature Deep-Dive Reels",
    objective: "Explain key features with trusted creators",
    niche: "Consumer Tech",
    status: "draft",
    priority: "medium",
    paymentMethod: "direct",
    budgetTotal: 7100,
    budgetSpent: 0,
    roi: 0,
    startDate: "2026-03-08",
    endDate: "2026-03-28",
    invitedCreators: 0,
    acceptedCreators: 0,
    deliverablesDone: 0,
    deliverablesTotal: 16,
  },
  {
    id: "cmp_04",
    name: "Valentine Weekend Push",
    objective: "Boost weekend sales with urgency-focused content",
    niche: "Fashion",
    status: "completed",
    priority: "high",
    paymentMethod: "direct",
    budgetTotal: 5800,
    budgetSpent: 5760,
    roi: 5.2,
    startDate: "2026-01-30",
    endDate: "2026-02-14",
    invitedCreators: 10,
    acceptedCreators: 8,
    deliverablesDone: 24,
    deliverablesTotal: 24,
  },
  {
    id: "cmp_05",
    name: "Ambassador Retainer Q1",
    objective: "Always-on awareness through recurring creators",
    niche: "Wellness",
    status: "paused",
    priority: "low",
    paymentMethod: "direct",
    budgetTotal: 12000,
    budgetSpent: 6900,
    roi: 2.7,
    startDate: "2026-01-15",
    endDate: "2026-03-31",
    invitedCreators: 18,
    acceptedCreators: 9,
    deliverablesDone: 13,
    deliverablesTotal: 36,
  },
  {
    id: "cmp_06",
    name: "Holiday UGC Archive",
    objective: "Retire and archive Q4 performance assets",
    niche: "General",
    status: "archived",
    priority: "low",
    paymentMethod: "direct",
    budgetTotal: 4000,
    budgetSpent: 4000,
    roi: 3.2,
    startDate: "2025-11-18",
    endDate: "2025-12-28",
    invitedCreators: 12,
    acceptedCreators: 9,
    deliverablesDone: 27,
    deliverablesTotal: 27,
  },
]

type CampaignListResponse = {
  items?: Campaign[]
}

type PromotionStatus =
  | "requested"
  | "negotiating"
  | "accepted"
  | "content_in_progress"
  | "posted"
  | "metrics_submitted"
  | "payment_pending"
  | "completed"

type PromotionItem = {
  id: string
  campaignTitle: string
  status: PromotionStatus
  paymentStatus: "pending" | "paid"
}

type PromotionListResponse = {
  items?: PromotionItem[]
}

const statusOrder: CampaignStatus[] = ["draft", "active", "paused", "completed", "archived"]

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })

const statusPillClass: Record<CampaignStatus, string> = {
  draft: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  active: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  archived: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
}

const priorityPillClass: Record<CampaignPriority, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  high: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
}

const promotionPillClass: Record<PromotionStatus, string> = {
  requested: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  negotiating: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  accepted: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  content_in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  posted: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  metrics_submitted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  payment_pending: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
}

export default function CampaignsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<CampaignPriority | "all">("all")
  const [campaigns, setCampaigns] = useState<Campaign[]>(seedCampaigns)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promotions, setPromotions] = useState<PromotionItem[]>([])

  useEffect(() => {
    const controller = new AbortController()

    const loadCampaigns = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/campaigns?limit=50`, {
          credentials: "include",
          signal: controller.signal,
        })
        if (!response.ok) throw new Error("Failed to fetch campaigns")

        const data: CampaignListResponse = await response.json()
        if (Array.isArray(data?.items) && data.items.length > 0) {
          setCampaigns(data.items)
        } else {
          setCampaigns([])
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setCampaigns(seedCampaigns)
        setError("Showing preview campaign data. Live campaign API unavailable.")
      } finally {
        setLoading(false)
      }
    }

    loadCampaigns()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const loadPromotions = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions?status=all&limit=6`, {
          credentials: "include",
          signal: controller.signal,
        })
        if (!response.ok) return

        const data: PromotionListResponse = await response.json()
        if (Array.isArray(data?.items)) {
          setPromotions(data.items)
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return
      }
    }

    loadPromotions()
    return () => controller.abort()
  }, [])

  const statusCount = useMemo(() => {
    const countMap: Record<CampaignStatus, number> = {
      draft: 0,
      active: 0,
      paused: 0,
      completed: 0,
      archived: 0,
    }
    for (const campaign of campaigns) {
      countMap[campaign.status] += 1
    }
    return countMap
  }, [campaigns])

  const filteredCampaigns = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return campaigns.filter((campaign) => {
      const matchesSearch =
        !normalizedSearch ||
        campaign.name.toLowerCase().includes(normalizedSearch) ||
        campaign.objective.toLowerCase().includes(normalizedSearch) ||
        campaign.niche.toLowerCase().includes(normalizedSearch)

      const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
      const matchesPriority = priorityFilter === "all" || campaign.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [campaigns, search, statusFilter, priorityFilter])

  const kpi = useMemo(() => {
    const active = campaigns.filter((campaign) => campaign.status === "active")
    const activeSpend = active.reduce((sum, campaign) => sum + campaign.budgetSpent, 0)
    const activeBudget = active.reduce((sum, campaign) => sum + campaign.budgetTotal, 0)
    const deliverablesDone = active.reduce((sum, campaign) => sum + campaign.deliverablesDone, 0)
    const deliverablesTotal = active.reduce((sum, campaign) => sum + campaign.deliverablesTotal, 0)
    const avgRoi = active.length ? active.reduce((sum, campaign) => sum + campaign.roi, 0) / active.length : 0

    return {
      activeCampaigns: active.length,
      activeSpend,
      activeBudget,
      avgRoi,
      deliveryRate: deliverablesTotal ? Math.round((deliverablesDone / deliverablesTotal) * 100) : 0,
    }
  }, [campaigns])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8">
      <Card className="border-white/60 bg-white/85 shadow-xl shadow-cyan-100/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-cyan-900/10">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <Badge className="border-0 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300">
              Campaign Control
            </Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Campaign Operations
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Manage lifecycle, creator execution, and budget pacing in one workflow.
            </p>
          </div>
          <Button asChild className="w-full bg-slate-900 text-white hover:bg-slate-800 sm:w-auto dark:bg-cyan-600 dark:hover:bg-cyan-700">
            <Link href="/brand/campaigns/new">
              <Plus className="mr-2 h-4 w-4" /> New campaign
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Active Campaigns</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{kpi.activeCampaigns}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Active Spend</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatMoney(kpi.activeSpend)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Budget Committed</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatMoney(kpi.activeBudget)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Avg ROI (Active)</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{kpi.avgRoi.toFixed(1)}x</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Delivery Progress</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{kpi.deliveryRate}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 border-slate-300 bg-white pl-10 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Search campaign name, niche, or objective"
              />
            </div>

            <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
              <button
                onClick={() => setPriorityFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  priorityFilter === "all"
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                All Priority
              </button>
              <button
                onClick={() => setPriorityFilter("high")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  priorityFilter === "high"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                High
              </button>
              <button
                onClick={() => setPriorityFilter("medium")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  priorityFilter === "medium"
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setPriorityFilter("low")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  priorityFilter === "low"
                    ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Low
              </button>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSearch("")
                setStatusFilter("all")
                setPriorityFilter("all")
              }}
              className="h-10 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Filter className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === "all"
                  ? "border-cyan-300 bg-cyan-100 text-cyan-900 dark:border-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              All ({campaigns.length})
            </button>
            {statusOrder.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  statusFilter === status
                    ? "border-cyan-300 bg-cyan-100 text-cyan-900 dark:border-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {status} ({statusCount[status]})
              </button>
            ))}
          </div>
          {loading ? <p className="text-xs text-slate-500 dark:text-slate-400">Loading campaigns...</p> : null}
          {error ? <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {filteredCampaigns.length === 0 ? (
            <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
              <CardContent className="p-5 text-sm text-slate-600 dark:text-slate-300">
                No campaigns found for these filters.
              </CardContent>
            </Card>
          ) : null}

          {filteredCampaigns.map((campaign) => {
            const budgetUsedPercent = campaign.budgetTotal
              ? Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100)
              : 0
            const deliveryPercent = campaign.deliverablesTotal
              ? Math.round((campaign.deliverablesDone / campaign.deliverablesTotal) * 100)
              : 0

            return (
              <Card key={campaign.id} className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
                <CardHeader className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-slate-900 dark:text-slate-100">{campaign.name}</CardTitle>
                      <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                        {campaign.objective}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`border-0 capitalize ${statusPillClass[campaign.status]}`}>
                        {campaign.status}
                      </Badge>
                      <Badge className={`border-0 capitalize ${priorityPillClass[campaign.priority]}`}>
                        {campaign.priority}
                      </Badge>
                      <Badge className={`border-0 ${campaign.paymentMethod === "direct" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300"}`}>
                        {campaign.paymentMethod === "direct" ? "Direct" : "Escrow"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm md:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Niche</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{campaign.niche}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Budget</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatMoney(campaign.budgetSpent)} / {formatMoney(campaign.budgetTotal)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Timeline</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">ROI</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {campaign.roi > 0 ? `${campaign.roi.toFixed(1)}x` : "Not started"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Target className="h-3.5 w-3.5" /> Budget pacing
                        </p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{budgetUsedPercent}% used</p>
                      </div>
                      <Progress value={budgetUsedPercent} className="h-2 bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Deliverables
                        </p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {campaign.deliverablesDone}/{campaign.deliverablesTotal}
                        </p>
                      </div>
                      <Progress value={deliveryPercent} className="h-2 bg-slate-200 dark:bg-slate-800" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-cyan-600" />
                        Invited {campaign.invitedCreators}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Accepted {campaign.acceptedCreators}
                      </span>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="h-8 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Link href={`/brand/campaigns/${campaign.id}`}>Open Campaign</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="space-y-4">
          <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-slate-100">Lifecycle</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Suggested workflow for team consistency.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="inline-flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Layers3 className="h-4 w-4 text-slate-500" /> Draft
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Planning</span>
              </div>
              <div className="inline-flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <TrendingUp className="h-4 w-4 text-cyan-600" /> Active
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Execution</span>
              </div>
              <div className="inline-flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CirclePause className="h-4 w-4 text-amber-600" /> Paused
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Blocked</span>
              </div>
              <div className="inline-flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Completed
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Closed</span>
              </div>
              <div className="inline-flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Clock3 className="h-4 w-4 text-purple-600" /> Archived
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">History</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-slate-100">Upcoming Deadlines</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Prioritize creator follow-up and approvals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {campaigns
                .filter((campaign) => campaign.status === "active" || campaign.status === "paused")
                .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
                .slice(0, 4)
                .map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{campaign.name}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Ends {formatDate(campaign.endDate)}
                    </p>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-slate-100">Quick Start</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                <Link href="/brand/campaigns/new">
                  <Flag className="mr-2 h-4 w-4" />
                  Launch from template
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                <Link href="/brand/discover">
                  <Users className="mr-2 h-4 w-4" />
                  Invite creators from discover
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-slate-100">Live Collaborations</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Recent collaborations moving across your campaign pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {promotions.slice(0, 5).map((promotion) => (
                <div
                  key={promotion.id}
                  className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{promotion.campaignTitle || "Collaboration"}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Badge className={`border-0 text-[10px] capitalize ${promotionPillClass[promotion.status]}`}>
                      {promotion.status.replaceAll("_", " ")}
                    </Badge>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Payment {promotion.paymentStatus}</p>
                  </div>
                </div>
              ))}
              {promotions.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">No collaborations created yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
