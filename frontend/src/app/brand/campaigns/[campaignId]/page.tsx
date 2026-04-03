"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, DollarSign, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type CampaignStatus = "draft" | "active" | "paused" | "completed" | "archived"
type CampaignPriority = "low" | "medium" | "high"
type CampaignGoal = "awareness" | "sales" | "launch" | "other"
type PromotionStatus =
  | "requested"
  | "negotiating"
  | "accepted"
  | "content_in_progress"
  | "posted"
  | "metrics_submitted"
  | "payment_pending"
  | "completed"

type Campaign = {
  id: string
  name: string
  objective: string
  niche: string
  status: CampaignStatus
  priority: CampaignPriority
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

type Promotion = {
  id: string
  campaignId: string
  campaignTitle: string
  influencerId: string
  status: PromotionStatus
  paymentStatus: "pending" | "paid"
  paymentAmount: number
  paymentDueAt: string
  performance: {
    reach: number
    views: number
    engagement: number
  }
}

type InviteStatus = "pending" | "accepted" | "rejected" | "expired"

type CampaignInvite = {
  id: string
  influencerId: string
  influencerName: string
  influencerHandle: string
  influencerNiche: string
  campaignId: string
  campaignLabel: string
  note: string
  status: InviteStatus
  promotionId?: string
  promotionStatus?: PromotionStatus | ""
  createdAt: string
}

type CampaignResponse = { campaign?: Campaign }
type PromotionListResponse = { items?: Promotion[] }
type InviteListResponse = { items?: CampaignInvite[] }

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

const invitePillClass: Record<InviteStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  expired: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
}

export default function CampaignDetailPage() {
  const params = useParams<{ campaignId: string }>()
  const campaignId = params?.campaignId

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [invites, setInvites] = useState<CampaignInvite[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null)
  const [payBusyId, setPayBusyId] = useState<string | null>(null)
  const [statusDrafts, setStatusDrafts] = useState<Record<string, PromotionStatus>>({})
  const [createBusy, setCreateBusy] = useState(false)
  const [selectedCreatorId, setSelectedCreatorId] = useState("")
  const [product, setProduct] = useState("")
  const [campaignGoal, setCampaignGoal] = useState<CampaignGoal>("awareness")
  const [deliverablePlatform, setDeliverablePlatform] = useState("instagram")
  const [deliverableFormat, setDeliverableFormat] = useState("reel")
  const [deliverableQuantity, setDeliverableQuantity] = useState("1")
  const [draftDueAt, setDraftDueAt] = useState("")
  const [postAt, setPostAt] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDueAt, setPaymentDueAt] = useState("")

  const loadData = useCallback(async (signal?: AbortSignal) => {
    if (!campaignId) return

    setLoading(true)
    setError(null)
    try {
      const [campaignRes, invitesRes, promotionsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/campaigns/${campaignId}`, {
          credentials: "include",
          signal,
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/invites?campaignId=${campaignId}&status=all&limit=50`, {
          credentials: "include",
          signal,
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions?campaignId=${campaignId}&status=all&limit=50`, {
          credentials: "include",
          signal,
        }),
      ])

      if (!campaignRes.ok) throw new Error("Failed to load campaign")

      const campaignData: CampaignResponse = await campaignRes.json()
      setCampaign(campaignData?.campaign || null)

      if (invitesRes.ok) {
        const invitesData: InviteListResponse = await invitesRes.json()
        setInvites(Array.isArray(invitesData?.items) ? invitesData.items : [])
      } else {
        setInvites([])
      }

      if (promotionsRes.ok) {
        const promotionsData: PromotionListResponse = await promotionsRes.json()
        const items = Array.isArray(promotionsData?.items) ? promotionsData.items : []
        setPromotions(items)
        setStatusDrafts(
          Object.fromEntries(items.map((item) => [item.id, item.status]))
        )
      } else {
        setPromotions([])
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError("Unable to load campaign details right now.")
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    const controller = new AbortController()
    loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  const canAdvanceStatus = useMemo(
    () =>
      new Set<PromotionStatus>([
        "negotiating",
        "requested",
        "content_in_progress",
        "payment_pending",
        "completed",
      ]),
    []
  )

  const workspaceStats = useMemo(() => {
    const pendingInvites = invites.filter((invite) => invite.status === "pending").length
    const acceptedInvites = invites.filter((invite) => invite.status === "accepted").length
    const livePromotions = promotions.filter((promotion) =>
      ["negotiating", "accepted", "content_in_progress", "posted", "metrics_submitted", "payment_pending"].includes(promotion.status)
    ).length
    const completedPromotions = promotions.filter((promotion) => promotion.status === "completed").length

    return {
      pendingInvites,
      acceptedInvites,
      livePromotions,
      completedPromotions,
    }
  }, [invites, promotions])

  const eligibleCreators = useMemo(() => {
    const existingPromotionInfluencerIds = new Set(promotions.map((promotion) => promotion.influencerId))
    const latestInviteByInfluencer = new Map<string, CampaignInvite>()

    for (const invite of invites) {
      const existing = latestInviteByInfluencer.get(invite.influencerId)
      if (!existing || new Date(invite.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
        latestInviteByInfluencer.set(invite.influencerId, invite)
      }
    }

    const accepted = [] as CampaignInvite[]
    const otherInvited = [] as CampaignInvite[]

    for (const invite of latestInviteByInfluencer.values()) {
      if (existingPromotionInfluencerIds.has(invite.influencerId)) continue
      if (invite.status === "accepted") accepted.push(invite)
      else otherInvited.push(invite)
    }

    return [...accepted, ...otherInvited]
  }, [invites, promotions])

  const linkedInviteCount = useMemo(
    () => invites.filter((invite) => Boolean(invite.promotionId || invite.promotionStatus)).length,
    [invites]
  )

  const updatePromotionStatus = async (promotionId: string) => {
    const nextStatus = statusDrafts[promotionId]
    if (!nextStatus) return
    setStatusBusyId(promotionId)
    setActionMessage(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${promotionId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.message || "Failed to update status")

      setActionMessage("Promotion status updated.")
      await loadData()
    } catch (err: unknown) {
      setActionMessage(err instanceof Error ? err.message : "Status update failed.")
    } finally {
      setStatusBusyId(null)
    }
  }

  const markPaid = async (promotionId: string) => {
    setPayBusyId(promotionId)
    setActionMessage(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${promotionId}/payment`, {
        method: "PATCH",
        credentials: "include",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.message || "Failed to mark paid")

      setActionMessage("Payment marked as paid.")
      await loadData()
    } catch (err: unknown) {
      setActionMessage(err instanceof Error ? err.message : "Payment update failed.")
    } finally {
      setPayBusyId(null)
    }
  }

  const createPromotion = async () => {
    if (!campaignId || !campaign) return
    if (!selectedCreatorId) {
      setActionMessage("Select a campaign creator before creating a promotion.")
      return
    }

    setCreateBusy(true)
    setActionMessage(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          influencerId: selectedCreatorId,
          campaignTitle: campaign.name,
          product: product.trim(),
          campaignGoal,
          deliverables: [
            {
              platform: deliverablePlatform.trim(),
              format: deliverableFormat.trim(),
              quantity: Number(deliverableQuantity),
            },
          ],
          draftDueAt,
          postAt,
          paymentAmount: Number(paymentAmount),
          paymentDueAt,
          requiresDraftApproval: true,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.message || "Failed to create promotion")

      setActionMessage("Promotion created successfully.")
      setSelectedCreatorId("")
      setProduct("")
      setDeliverablePlatform("instagram")
      setDeliverableFormat("reel")
      setDeliverableQuantity("1")
      setDraftDueAt("")
      setPostAt("")
      setPaymentAmount("")
      setPaymentDueAt("")

      await loadData()
    } catch (err: unknown) {
      setActionMessage(err instanceof Error ? err.message : "Could not create promotion.")
    } finally {
      setCreateBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
        <Link href="/brand/campaigns">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to campaigns
        </Link>
      </Button>

      {loading ? (
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-5 text-sm text-slate-600 dark:text-slate-300">Loading campaign details...</CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-5 text-sm text-rose-600 dark:text-rose-300">{error}</CardContent>
        </Card>
      ) : null}

      {actionMessage ? (
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-4 text-sm text-emerald-700 dark:text-emerald-300">{actionMessage}</CardContent>
        </Card>
      ) : null}

      {!loading && campaign ? (
        <>
          <Card className="border-white/60 bg-white/85 shadow-xl shadow-cyan-100/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">{campaign.name}</CardTitle>
                  <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">{campaign.objective}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={`border-0 capitalize ${statusPillClass[campaign.status]}`}>{campaign.status}</Badge>
                  <Badge className="border-0 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 capitalize">{campaign.priority}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-4">
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
                <p className="text-xs text-slate-500 dark:text-slate-400">Invited/Accepted</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {campaign.invitedCreators} / {campaign.acceptedCreators}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">ROI</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{campaign.roi > 0 ? `${campaign.roi.toFixed(1)}x` : "Not started"}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Pending invites</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{workspaceStats.pendingInvites}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Accepted invites</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{workspaceStats.acceptedInvites}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Live collaborations</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{workspaceStats.livePromotions}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Completed collaborations</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{workspaceStats.completedPromotions}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Campaign pipeline</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Track outreach and see which invites have turned into active collaborations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {invites.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  No invites have been sent for this campaign yet.
                </div>
              ) : (
                invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {invite.influencerName || invite.influencerHandle || "Influencer"}
                          </p>
                          <Badge className={`border-0 text-[10px] capitalize ${invitePillClass[invite.status]}`}>
                            {invite.status}
                          </Badge>
                          {invite.promotionStatus ? (
                            <Badge className={`border-0 text-[10px] capitalize ${promotionPillClass[invite.promotionStatus]}`}>
                              deal {invite.promotionStatus.replaceAll("_", " ")}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {invite.influencerHandle || "No handle"}{invite.influencerNiche ? ` - ${invite.influencerNiche}` : ""}
                        </p>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                          {invite.note || "Invite sent from discover."}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline" className="h-8 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                            <Link href={`/brand/messages?otherUserId=${invite.influencerId}&campaignId=${invite.campaignId}&campaignTitle=${encodeURIComponent(invite.campaignLabel || campaign?.name || "Campaign")}${invite.promotionId ? `&promotionId=${invite.promotionId}` : ""}`}>Open chat</Link>
                          </Button>
                          {invite.promotionId ? (
                            <Button asChild size="sm" className="h-8 bg-slate-900 text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700">
                              <Link href={`/brand/promotions/${invite.promotionId}`}>Open collaboration</Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Sent {formatDate(invite.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Collaborations</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Move from outreach to agreement, delivery, and payment for this campaign.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/60">
                <p className="font-medium text-slate-900 dark:text-slate-100">Discover is the entry point</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  We removed the manual collaboration creator from this page. The cleaner path is: invite from Discover, accept, discuss in chat, then continue execution here.
                </p>
                <Button asChild className="mt-3 bg-slate-900 text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700">
                  <Link href="/brand/discover">Go to Discover</Link>
                </Button>
              </div>

              {promotions.map((promotion) => (
                <div
                  key={promotion.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{promotion.campaignTitle || "Collaboration"}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge className={`border-0 text-[10px] capitalize ${promotionPillClass[promotion.status]}`}>
                          {promotion.status.replaceAll("_", " ")}
                        </Badge>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Payment {promotion.paymentStatus}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatMoney(promotion.paymentAmount)} due {formatDate(promotion.paymentDueAt)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Input
                        value={statusDrafts[promotion.id] || promotion.status}
                        onChange={(event) =>
                          setStatusDrafts((prev) => ({
                            ...prev,
                            [promotion.id]: event.target.value as PromotionStatus,
                          }))
                        }
                        list={`promotion-status-${promotion.id}`}
                        className="h-8 w-[180px] text-xs"
                      />
                      <datalist id={`promotion-status-${promotion.id}`}>
                        {Array.from(canAdvanceStatus).map((status) => (
                          <option key={status} value={status} />
                        ))}
                      </datalist>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-8 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Link href={`/brand/messages?otherUserId=${promotion.influencerId}&campaignId=${promotion.campaignId}&promotionId=${promotion.id}&campaignTitle=${encodeURIComponent(promotion.campaignTitle || campaign?.name || "Campaign")}`}>Open chat</Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-8 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Link href={`/brand/promotions/${promotion.id}`}>Open collaboration</Link>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updatePromotionStatus(promotion.id)}
                        disabled={statusBusyId === promotion.id}
                        className="h-8 bg-slate-900 text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                      >
                        {statusBusyId === promotion.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update status"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markPaid(promotion.id)}
                        disabled={payBusyId === promotion.id || promotion.paymentStatus === "paid"}
                        className="h-8 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {payBusyId === promotion.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <DollarSign className="mr-1 h-3.5 w-3.5" />
                            {promotion.paymentStatus === "paid" ? "Paid" : "Mark paid"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {(promotion.performance.reach || promotion.performance.views || promotion.performance.engagement) ? (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                      <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
                      Metrics: Reach {promotion.performance.reach}, Views {promotion.performance.views}, Engagement {promotion.performance.engagement}%
                    </div>
                  ) : null}
                </div>
              ))}

              {promotions.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">No collaborations in this campaign yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
