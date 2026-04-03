"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Filter,
  MessageSquare,
  Search,
  Sparkles,
  Upload,
} from "lucide-react"

type PromotionStatus =
  | "requested"
  | "negotiating"
  | "accepted"
  | "content_in_progress"
  | "posted"
  | "metrics_submitted"
  | "payment_pending"
  | "completed"

type Promotion = {
  id: string
  brandId?: string
  campaignId?: string
  campaignTitle: string
  status: PromotionStatus
  paymentStatus: "pending" | "paid"
  paymentAmount: number
  paymentDueAt: string
  performance: {
    reach: number
    views: number
    engagement: number
  }
  createdAt: string
  brandName?: string
}

type PromotionResponse = {
  items?: Promotion[]
}

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
]

const tabs: { value: "all" | "active" | "review" | "completed" | "pending"; label: string; matcher: (status: PromotionStatus) => boolean }[] = [
  { value: "all", label: "All", matcher: () => true },
  {
    value: "active",
    label: "Active",
    matcher: (status) => ["accepted", "content_in_progress", "posted", "metrics_submitted"].includes(status),
  },
  {
    value: "review",
    label: "In Review",
    matcher: (status) => ["requested", "negotiating"].includes(status),
  },
  {
    value: "completed",
    label: "Completed",
    matcher: (status) => status === "completed",
  },
  {
    value: "pending",
    label: "Pending",
    matcher: (status) => status === "payment_pending",
  },
]

const statusStyles: Record<PromotionStatus, string> = {
  requested: "border-0 bg-slate-100 text-slate-700",
  negotiating: "border-0 bg-violet-100 text-violet-700",
  accepted: "border-0 bg-cyan-100 text-cyan-700",
  content_in_progress: "border-0 bg-amber-100 text-amber-700",
  posted: "border-0 bg-sky-100 text-sky-700",
  metrics_submitted: "border-0 bg-emerald-100 text-emerald-700",
  payment_pending: "border-0 bg-orange-100 text-orange-700",
  completed: "border-0 bg-emerald-100 text-emerald-700",
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)

export default function MyCollaborations() {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<typeof tabs[number]["value"]>("all")
  const [promotions, setPromotions] = useState<Promotion[]>(seedPromotions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions?status=all&limit=50`, {
          credentials: "include",
          signal: controller.signal,
        })
        if (!response.ok) throw new Error("Failed to fetch collaborations")
        const data: PromotionResponse = await response.json()
        if (Array.isArray(data.items) && data.items.length > 0) {
          setPromotions(data.items)
        } else {
          setPromotions([])
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setPromotions(seedPromotions)
        setError("Showing preview data while we reconnect.")
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return promotions.filter((promotion) => {
      const matchesText =
        !query ||
        promotion.campaignTitle.toLowerCase().includes(query) ||
        (promotion.brandName || "").toLowerCase().includes(query)
      const tabRow = tabs.find((tab) => tab.value === activeTab)
      const matchesTab = tabRow ? tabRow.matcher(promotion.status) : true
      return matchesText && matchesTab
    })
  }, [promotions, search, activeTab])

  const counts = useMemo(() => {
    const base: Record<typeof tabs[number]["value"], number> = {
      all: promotions.length,
      active: promotions.filter((p) => tabs[1].matcher(p.status)).length,
      review: promotions.filter((p) => tabs[2].matcher(p.status)).length,
      completed: promotions.filter((p) => tabs[3].matcher(p.status)).length,
      pending: promotions.filter((p) => tabs[4].matcher(p.status)).length,
    }
    return base
  }, [promotions])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Card className="border-white/60 bg-white/85 shadow-lg shadow-cyan-100/40 backdrop-blur-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <Badge className="border-0 bg-amber-100 text-amber-800 hover:bg-amber-100">
              <Sparkles className="mr-1 h-3.5 w-3.5" /> Partnership Hub
            </Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">My Collaborations</h1>
            <p className="mt-1 text-sm text-slate-600">Live collaboration statuses tied to your campaigns.</p>
          </div>
          <Button asChild className="w-full bg-slate-900 text-white hover:bg-slate-800 sm:w-auto">
            <Link href="/influencer/messages">
              <MessageSquare className="mr-2 h-4 w-4" /> Open messages
            </Link>
          </Button>
        </CardContent>
      </Card>
      {error && (
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-4 text-sm text-rose-600 dark:text-rose-300">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tabs.slice(0, 4).map((tab) => (
          <Card key={tab.value} className="border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">{tab.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{counts[tab.value]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 bg-white/90 shadow-sm">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by campaign or brand"
                className="h-10 border-slate-300 bg-white pl-10 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <Button variant="outline" className="h-10 border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof tabs[number]["value"])} className="mt-4 w-full">
            <TabsList className="grid h-auto w-full grid-cols-5 rounded-xl border border-slate-200 bg-white p-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
                >
                  {tab.label} ({counts[tab.value]})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <Card className="border-dashed border-slate-300 bg-white/90 shadow-sm">
            <CardContent className="p-6 text-sm text-slate-600">Loading collaborations...</CardContent>
          </Card>
        ) : null}

        {filtered.length === 0 && !loading ? (
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="flex flex-col items-center px-4 py-12 text-center">
              <div className="rounded-full bg-slate-100 p-3">
                <MessageSquare className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">No collaborations found</h3>
              <p className="mt-1 text-sm text-slate-600">Adjust filters or wait for a new campaign assignment.</p>
            </CardContent>
          </Card>
        ) : null}

        {filtered.map((promotion) => (
          <Card
            key={promotion.id}
            className="border-slate-200 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg text-slate-900">{promotion.campaignTitle || "Collaboration"}</CardTitle>
                    <Badge className={statusStyles[promotion.status]}>{promotion.status.replaceAll("_", " ")}</Badge>
                  </div>
                  {promotion.brandName ? (
                    <CardDescription className="mt-1 text-slate-600">{promotion.brandName}</CardDescription>
                  ) : null}
                </div>
                <p className="text-lg font-semibold text-slate-900">{formatMoney(promotion.paymentAmount)}</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <Calendar className="h-4 w-4 text-cyan-700" />
                  <span>Due {new Date(promotion.paymentDueAt).toLocaleDateString()}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <Clock3 className="h-4 w-4 text-amber-700" />
                  <span>Payment {promotion.paymentStatus}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <span>Reach {promotion.performance.reach || 0}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                  <Link href={`/influencer/my-collabs/${promotion.id}`}>View details</Link>
                </Button>
                {promotion.brandId ? (
                  <Button asChild variant="outline" size="sm" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
                    <Link href={`/influencer/messages?otherUserId=${promotion.brandId}${promotion.campaignId ? `&campaignId=${promotion.campaignId}` : ""}&promotionId=${promotion.id}&campaignTitle=${encodeURIComponent(promotion.campaignTitle || "Collaboration")}`}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Open brand chat
                    </Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline" size="sm" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
                  <Link href={`/influencer/my-collabs/${promotion.id}`}>
                    <Upload className="mr-2 h-4 w-4" /> Continue workflow
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
