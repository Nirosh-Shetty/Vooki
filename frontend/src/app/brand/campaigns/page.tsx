"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Filter,
  Plus,
  Search,
  Target,
  Users,
  Activity
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

type CampaignListResponse = {
  items?: Campaign[]
}

const statusOrder: CampaignStatus[] = ["draft", "active", "paused", "completed", "archived"]

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })

const statusPillClass: Record<CampaignStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  active: "bg-cyan-50 text-cyan-700 border-cyan-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-slate-100 text-slate-700 border-slate-200",
}

const priorityPillClass: Record<CampaignPriority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-orange-50 text-orange-700",
  high: "bg-rose-50 text-rose-700",
}

export default function CampaignsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<CampaignPriority | "all">("all")
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        setError("Showing preview campaign data. Live campaign API unavailable.")
      } finally {
        setLoading(false)
      }
    }

    loadCampaigns()
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
    const avgRoi = active.length ? active.reduce((sum, campaign) => sum + campaign.roi, 0) / active.length : 0

    return {
      activeCampaigns: active.length,
      activeSpend,
      activeBudget,
      avgRoi,
    }
  }, [campaigns])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      
      {/* 1. Sleek Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)]">
            Manage your marketing initiatives and creator budgets.
          </p>
        </div>
        <Button asChild className="shrink-0 bg-[color:var(--vooki-accent)] text-white hover:bg-[color:var(--vooki-accent-strong)] shadow-[var(--vooki-shadow-accent)] rounded-full px-6">
          <Link href="/brand/campaigns/new">
            <Plus className="mr-2 h-4 w-4" /> Create Campaign
          </Link>
        </Button>
      </div>

      {/* 2. Compact KPI Bar */}
      <Card className="border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)] rounded-3xl overflow-hidden">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[color:var(--vooki-app-border-strong)]">
          <div className="flex items-center gap-4 px-2">
            <div className="rounded-full bg-cyan-50 p-2.5 text-cyan-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider">Active Campaigns</p>
              <p className="text-2xl font-bold text-[color:var(--vooki-app-text-strong)]">{kpi.activeCampaigns}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-2 pt-4 sm:pt-0">
            <div className="rounded-full bg-emerald-50 p-2.5 text-emerald-600">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider">Active Spend</p>
              <p className="text-2xl font-bold text-[color:var(--vooki-app-text-strong)]">{formatMoney(kpi.activeSpend)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-2 pt-4 lg:pt-0">
            <div className="rounded-full bg-purple-50 p-2.5 text-purple-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider">Budget Committed</p>
              <p className="text-2xl font-bold text-[color:var(--vooki-app-text-strong)]">{formatMoney(kpi.activeBudget)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-2 pt-4 lg:pt-0">
            <div className="rounded-full bg-amber-50 p-2.5 text-amber-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider">Avg ROI (Active)</p>
              <p className="text-2xl font-bold text-[color:var(--vooki-app-text-strong)]">{kpi.avgRoi.toFixed(1)}x</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Streamlined Filter Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between w-full">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--vooki-app-text-soft)]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 rounded-full border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] pl-10 text-sm text-[color:var(--vooki-app-text-strong)] focus-visible:ring-[color:var(--vooki-accent)] w-full"
              placeholder="Search campaigns..."
            />
          </div>
          
          {/* Status Dropdown */}
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as CampaignStatus | "all")}
          >
            <SelectTrigger className="h-10 w-full sm:w-[160px] rounded-full border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] font-semibold text-[color:var(--vooki-app-text-strong)] focus:ring-[color:var(--vooki-accent)]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="border border-[color:var(--vooki-home-border)] bg-[#1a1c17] text-[color:var(--vooki-app-text-strong)] shadow-2xl rounded-2xl">
              <SelectItem value="all">All Statuses ({campaigns.length})</SelectItem>
              {statusOrder.map((status) => (
                <SelectItem key={status} value={status}>
                  <span className="capitalize">{status} ({statusCount[status]})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 lg:mt-0">
          {/* Priority Dropdown */}
          <Select
            value={priorityFilter}
            onValueChange={(val) => setPriorityFilter(val as CampaignPriority | "all")}
          >
            <SelectTrigger className="h-10 w-full sm:w-[160px] rounded-full border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] font-semibold text-[color:var(--vooki-app-text-strong)] focus:ring-[color:var(--vooki-accent)]">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent className="border border-[color:var(--vooki-home-border)] bg-[#1a1c17] text-[color:var(--vooki-app-text-strong)] shadow-2xl rounded-2xl">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("")
              setStatusFilter("all")
              setPriorityFilter("all")
            }}
            className="h-10 rounded-full text-sm font-semibold text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)] shrink-0"
          >
            <Filter className="mr-1.5 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {loading ? <p className="text-sm text-[color:var(--vooki-app-text-soft)]">Loading campaigns...</p> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {/* 4. Sleek Horizontal Campaign Rows */}
      <div className="grid gap-4">
        {filteredCampaigns.length === 0 && !loading ? (
          <div className="rounded-3xl border-2 border-dashed border-[color:var(--vooki-app-border)] p-10 text-center bg-[color:var(--vooki-app-surface-strong)]/50">
            <Activity className="h-10 w-10 mx-auto text-[color:var(--vooki-app-text-soft)] opacity-50 mb-3" />
            <p className="text-[color:var(--vooki-app-text-strong)] font-medium text-lg">No campaigns found</p>
            <p className="text-sm mt-1 text-[color:var(--vooki-app-text-soft)]">Try adjusting your filters.</p>
          </div>
        ) : null}

        {filteredCampaigns.map((campaign) => {
          const budgetUsedPercent = campaign.budgetTotal
            ? Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100)
            : 0

          return (
            <div
              key={campaign.id}
              onClick={() => router.push(`/brand/campaigns/${campaign.id}`)}
              className="group relative flex cursor-pointer flex-col gap-4 rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-5 transition-all hover:border-[color:var(--vooki-accent)] hover:shadow-[var(--vooki-shadow-app)] sm:flex-row sm:items-center sm:gap-8 lg:p-6"
            >
              {/* Campaign Info */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-[color:var(--vooki-app-text-strong)] group-hover:text-[color:var(--vooki-accent)] transition-colors">
                    {campaign.name}
                  </h3>
                  <Badge variant="outline" className={`border capitalize text-[10px] px-2 py-0.5 font-semibold ${statusPillClass[campaign.status]}`}>
                    {campaign.status}
                  </Badge>
                </div>
                <p className="line-clamp-1 text-sm text-[color:var(--vooki-app-text-soft)]">
                  {campaign.objective}
                </p>
                <p className="text-[11px] font-medium text-[color:var(--vooki-app-text-soft)] opacity-80 uppercase tracking-wide">
                  {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)} • {campaign.niche}
                </p>
              </div>

              {/* Creators Funnel */}
              <div className="w-full sm:w-[140px] shrink-0">
                <p className="mb-2 text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider font-semibold">Network</p>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[color:var(--vooki-app-text-strong)]">
                      {campaign.invitedCreators}
                    </span>
                    <span className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wide">Invited</span>
                  </div>
                  <div className="w-px h-6 bg-[color:var(--vooki-app-border-strong)]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-emerald-600">
                      {campaign.acceptedCreators}
                    </span>
                    <span className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wide">Accepted</span>
                  </div>
                </div>
              </div>

              {/* Budget Progress */}
              <div className="w-full sm:w-[200px] shrink-0">
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider font-semibold">Budget</span>
                  <span className="font-bold text-sm text-[color:var(--vooki-app-text-strong)]">
                    {formatMoney(campaign.budgetSpent)} <span className="text-[color:var(--vooki-app-text-soft)] font-medium text-xs">/ {formatMoney(campaign.budgetTotal)}</span>
                  </span>
                </div>
                <Progress value={budgetUsedPercent} className="h-2 rounded-full bg-[color:var(--vooki-app-border-strong)]" />
              </div>

              {/* Badges / Extras */}
              <div className="hidden items-center justify-end gap-3 lg:flex w-[100px] shrink-0">
                <div className="text-right">
                  <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider font-semibold mb-1">Priority</p>
                  <Badge variant="outline" className={`capitalize text-[10px] font-semibold border-0 ${priorityPillClass[campaign.priority]}`}>
                    {campaign.priority}
                  </Badge>
                </div>
              </div>

              {/* Action Chevron */}
              <div className="hidden sm:flex items-center justify-center h-10 w-10 rounded-full transition-colors group-hover:bg-[color:var(--vooki-accent-soft)]">
                <ChevronRight className="h-5 w-5 text-[color:var(--vooki-app-text-soft)] group-hover:text-[color:var(--vooki-accent)] transition-colors" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
