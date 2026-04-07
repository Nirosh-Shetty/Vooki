"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Loader2, MessageSquare, Plus, Save, Trash2, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { messagingAPI, useMessaging, type OfferData } from "@/lib/socket"

type UserRole = "brand" | "influencer"
type PromotionStatus =
  | "requested"
  | "negotiating"
  | "accepted"
  | "content_in_progress"
  | "posted"
  | "metrics_submitted"
  | "payment_pending"
  | "completed"

type Deliverable = {
  platform: string
  format: string
  quantity: number
}

type Promotion = {
  id: string
  campaignId: string
  brandId: string
  influencerId: string
  campaignTitle: string
  product: string
  campaignGoal: "awareness" | "sales" | "launch" | "other"
  deliverables: Deliverable[]
  draftDueAt: string
  postAt: string
  requiresDraftApproval: boolean
  captionRequirements: string
  brandTagRequired: boolean
  hashtags: string[]
  linkRequired: boolean
  discountCode: string
  allowReuse: boolean
  exclusivityDays?: number
  paymentAmount: number
  advanceAmount: number
  paymentDueAt: string
  paymentMethod: string
  paymentStatus: "pending" | "paid"
  performance: {
    reach: number
    views: number
    engagement: number
  }
  deliverySubmission?: {
    proofUrl?: string
    notes?: string
    submittedAt?: string
    reviewedAt?: string
    reviewStatus?: "pending" | "approved" | "changes_requested" | ""
    reviewFeedback?: string
  }
  status: PromotionStatus
  createdAt: string
  updatedAt: string
}

type PromotionResponse = {
  promotion?: Promotion
}

type DeliverableDraft = {
  platform: string
  format: string
  quantity: string
}

type TermsFormState = {
  product: string
  deliverables: DeliverableDraft[]
  draftDueAt: string
  postAt: string
  captionRequirements: string
  hashtags: string
  paymentAmount: string
  advanceAmount: string
  paymentDueAt: string
  paymentMethod: string
  exclusivityDays: string
  discountCode: string
}

const PLATFORM_OPTIONS = [
  {
    value: "instagram",
    label: "Instagram",
    formats: ["reel", "story", "post", "carousel", "live"],
  },
  {
    value: "youtube",
    label: "YouTube",
    formats: ["short", "video", "live", "community_post"],
  },
  {
    value: "tiktok",
    label: "TikTok",
    formats: ["video", "series", "live"],
  },
  {
    value: "x",
    label: "X / Twitter",
    formats: ["post", "thread", "video"],
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    formats: ["post", "article", "video"],
  },
  {
    value: "blog",
    label: "Blog",
    formats: ["article", "review", "roundup"],
  },
] as const

const humanizeLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())

const getPlatformLabel = (value: string) =>
  PLATFORM_OPTIONS.find((option) => option.value === value)?.label || humanizeLabel(value)

const getFormatOptions = (platform: string) => {
  const option = PLATFORM_OPTIONS.find((item) => item.value === platform)
  return option?.formats || ["post"]
}

const createDeliverableDraft = (partial?: Partial<DeliverableDraft>): DeliverableDraft => {
  const platform = partial?.platform || PLATFORM_OPTIONS[0].value
  const formatOptions = getFormatOptions(platform)
  const format = partial?.format && formatOptions.some((option) => option === partial.format)
    ? partial.format
    : formatOptions[0]

  return {
    platform,
    format,
    quantity: partial?.quantity || "1",
  }
}

const statusPillClass: Record<PromotionStatus, string> = {
  requested: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  negotiating: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  accepted: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  content_in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  posted: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  metrics_submitted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  payment_pending: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
}

const statusGuidance: Record<PromotionStatus, string> = {
  requested: "The brand is still shaping the first proposal. Use chat to align on fit, scope, and pricing.",
  negotiating: "This collaboration is in discussion. Use chat first, then lock the agreement once both sides are aligned.",
  accepted: "The deal is agreed. Next step is moving into delivery and content execution.",
  content_in_progress: "Work is underway. Keep chat for quick questions and use this page to track delivery.",
  posted: "Content is live or ready. The influencer can now share final performance.",
  metrics_submitted: "Performance is in. Brand can now review results and move the deal toward payment.",
  payment_pending: "Execution is done. Final step is recording payment and closing the collaboration.",
  completed: "This collaboration is complete. Use the summary here as the source of truth for what happened.",
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const toDateInput = (value?: string) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

const getMessagesPath = (role: UserRole) =>
  role === "brand" ? "/brand/messages" : "/influencer/messages"

const buildChatHref = (role: UserRole, promotion: Promotion | null) => {
  const basePath = getMessagesPath(role)
  const otherUserId = role === "brand" ? promotion?.influencerId : promotion?.brandId
  if (!otherUserId) return basePath

  return `${basePath}?otherUserId=${otherUserId}`
}

const buildDeliverableSummary = (promotion: Promotion) => {
  if (!promotion.deliverables?.length) return "To be confirmed"
  return promotion.deliverables
    .map(
      (deliverable) =>
        `${deliverable.quantity} x ${getPlatformLabel(deliverable.platform)} ${humanizeLabel(deliverable.format)}`.trim()
    )
    .join(", ")
}

const buildStructuredOfferData = (
  promotion: Promotion,
  messageType: "offer" | "counter_offer"
): OfferData => ({
  campaignId: promotion.campaignId,
  promotionId: promotion.id,
  campaignTitle: promotion.campaignTitle,
  deliverableSummary: buildDeliverableSummary(promotion),
  paymentAmount: promotion.paymentAmount,
  advanceAmount: promotion.advanceAmount,
  draftDueAt: promotion.draftDueAt || null,
  postAt: promotion.postAt || null,
  hashtags: promotion.hashtags,
  discountCode: promotion.discountCode || "",
  note:
    messageType === "offer"
      ? "Please review this proposal in chat and reply with any changes before we lock the agreement."
      : "I am interested, but I would like to align on scope, pricing, or timing before we lock the agreement.",
})

const getAllowedNextStatuses = (role: UserRole, current: PromotionStatus): PromotionStatus[] => {
  if (role === "brand") {
    if (current === "requested") return ["negotiating"]
    if (current === "negotiating") return ["requested"]
    if (current === "accepted") return ["content_in_progress"]
    if (current === "metrics_submitted") return ["payment_pending"]
    if (current === "payment_pending") return ["completed"]
    return []
  }

  if (current === "requested") return ["negotiating", "accepted"]
  if (current === "negotiating") return ["accepted"]
  if (current === "content_in_progress") return ["posted"]
  if (current === "posted") return ["metrics_submitted"]
  return []
}

const getStatusActionLabel = (role: UserRole, nextStatus: PromotionStatus) => {
  if (role === "brand") {
    if (nextStatus === "negotiating") return "Move to negotiation"
    if (nextStatus === "requested") return "Send revised ask"
    if (nextStatus === "content_in_progress") return "Start delivery phase"
    if (nextStatus === "payment_pending") return "Move to payment"
    if (nextStatus === "completed") return "Complete collaboration"
  }

  if (nextStatus === "negotiating") return "Open negotiation"
  if (nextStatus === "accepted") return "Accept collaboration"
  if (nextStatus === "posted") return "Mark content as posted"
  if (nextStatus === "metrics_submitted") return "Submit final performance"

  return nextStatus.replaceAll("_", " ")
}

export function PromotionWorkspace({
  promotionId,
  role,
  backHref,
  backLabel,
}: {
  promotionId: string
  role: UserRole
  backHref: string
  backLabel: string
}) {
  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingTerms, setSavingTerms] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [submittingMetrics, setSubmittingMetrics] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [submittingDelivery, setSubmittingDelivery] = useState(false)
  const [reviewingDelivery, setReviewingDelivery] = useState(false)
  const [statusAction, setStatusAction] = useState<PromotionStatus | null>(null)
  const [terms, setTerms] = useState<TermsFormState>({
    product: "",
    deliverables: [createDeliverableDraft()],
    draftDueAt: "",
    postAt: "",
    captionRequirements: "",
    hashtags: "",
    paymentAmount: "0",
    advanceAmount: "0",
    paymentDueAt: "",
    paymentMethod: "direct",
    exclusivityDays: "",
    discountCode: "",
  })
  const [metrics, setMetrics] = useState({
    reach: "0",
    views: "0",
    engagement: "0",
  })
  const [deliveryProofUrl, setDeliveryProofUrl] = useState("")
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [reviewFeedback, setReviewFeedback] = useState("")

  const [sendingStructuredMessage, setSendingStructuredMessage] = useState<"offer" | "counter_offer" | null>(null)
  const router = useRouter()
  const { sendMessage } = useMessaging()

  const loadPromotion = async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${promotionId}`, {
        credentials: "include",
        signal,
      })
      if (!response.ok) {
        throw new Error("Unable to load collaboration")
      }
      const data: PromotionResponse = await response.json()
      const item = data.promotion || null
      setPromotion(item)
      if (item) {
        setTerms({
          product: item.product || "",
          deliverables: item.deliverables?.length
            ? item.deliverables.map((deliverable) =>
                createDeliverableDraft({
                  platform: deliverable.platform,
                  format: deliverable.format,
                  quantity: String(deliverable.quantity || 1),
                })
              )
            : [createDeliverableDraft()],
          draftDueAt: toDateInput(item.draftDueAt),
          postAt: toDateInput(item.postAt),
          captionRequirements: item.captionRequirements || "",
          hashtags: item.hashtags.join(", "),
          paymentAmount: String(item.paymentAmount ?? 0),
          advanceAmount: String(item.advanceAmount ?? 0),
          paymentDueAt: toDateInput(item.paymentDueAt),
          paymentMethod: item.paymentMethod || "direct",
          exclusivityDays: item.exclusivityDays !== undefined ? String(item.exclusivityDays) : "",
          discountCode: item.discountCode || "",
        })
        setMetrics({
          reach: String(item.performance.reach || 0),
          views: String(item.performance.views || 0),
          engagement: String(item.performance.engagement || 0),
        })
        setDeliveryProofUrl(item.deliverySubmission?.proofUrl || "")
        setDeliveryNotes(item.deliverySubmission?.notes || "")
        setReviewFeedback(item.deliverySubmission?.reviewFeedback || "")
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Unable to load collaboration")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    loadPromotion(controller.signal)
    return () => controller.abort()
  }, [promotionId])

  const allowedNextStatuses = useMemo(
    () => (promotion ? getAllowedNextStatuses(role, promotion.status) : []),
    [promotion, role]
  )

  const canEditTerms =
    role === "brand" && promotion && ["requested", "negotiating", "accepted"].includes(promotion.status)
  const isPlanningPhase = Boolean(
    promotion && ["requested", "negotiating", "accepted"].includes(promotion.status)
  )
  const messagesPath = getMessagesPath(role)
  const openChatHref = buildChatHref(role, promotion)
  const deliveryReviewStatus = promotion?.deliverySubmission?.reviewStatus || ""

  const updateDeliverableDraft = (index: number, updates: Partial<DeliverableDraft>) => {
    setTerms((prev) => {
      const nextDeliverables = prev.deliverables.map((deliverable, deliverableIndex) =>
        deliverableIndex === index ? { ...deliverable, ...updates } : deliverable
      )

      return { ...prev, deliverables: nextDeliverables }
    })
  }

  const handleDeliverablePlatformChange = (index: number, platform: string) => {
    const formatOptions = getFormatOptions(platform)
    setTerms((prev) => {
      const current = prev.deliverables[index]
      const nextFormat = formatOptions.some((option) => option === (current?.format || ""))
        ? current.format
        : formatOptions[0]

      const nextDeliverables = prev.deliverables.map((deliverable, deliverableIndex) =>
        deliverableIndex === index
          ? { ...deliverable, platform, format: nextFormat }
          : deliverable
      )

      return { ...prev, deliverables: nextDeliverables }
    })
  }

  const addDeliverableDraft = () => {
    setTerms((prev) => ({
      ...prev,
      deliverables: [...prev.deliverables, createDeliverableDraft()],
    }))
  }

  const removeDeliverableDraft = (index: number) => {
    setTerms((prev) => {
      if (prev.deliverables.length === 1) {
        return { ...prev, deliverables: [createDeliverableDraft()] }
      }

      return {
        ...prev,
        deliverables: prev.deliverables.filter((_, deliverableIndex) => deliverableIndex != index),
      }
    })
  }

  const sendPlanningMessage = async (messageType: "offer" | "counter_offer") => {
    if (!promotion) return

    const otherUserId = role === "brand" ? promotion.influencerId : promotion.brandId
    if (!otherUserId) {
      setError("Unable to open collaboration chat right now.")
      return
    }

    setSendingStructuredMessage(messageType)
    setError(null)
    setMessage(null)

    try {
      const response = await messagingAPI.getOrCreateConversation(otherUserId)

      const conversationId = response.conversation.id
      await sendMessage(conversationId, undefined, {
        messageType,
        offerData: buildStructuredOfferData(promotion, messageType),
      })

      router.push(`${messagesPath}?conversationId=${conversationId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to send collaboration update")
    } finally {
      setSendingStructuredMessage(null)
    }
  }

  const submitDeliveryProof = async () => {
    if (!promotion) return
    setSubmittingDelivery(true)
    setMessage(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${promotion.id}/delivery`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofUrl: deliveryProofUrl.trim(),
          notes: deliveryNotes.trim(),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.message || "Failed to submit delivery proof")
      setMessage(data?.message || "Delivery proof submitted.")
      await loadPromotion()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit delivery proof")
    } finally {
      setSubmittingDelivery(false)
    }
  }

  const reviewDeliveryProof = async (action: "approved" | "changes_requested") => {
    if (!promotion) return
    setReviewingDelivery(true)
    setMessage(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${promotion.id}/delivery/review`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          feedback: reviewFeedback.trim(),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.message || "Failed to review delivery proof")
      setMessage(data?.message || "Delivery review updated.")
      await loadPromotion()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to review delivery proof")
    } finally {
      setReviewingDelivery(false)
    }
  }

  const saveTerms = async () => {
    if (!promotion) return
    setSavingTerms(true)
    setMessage(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${promotion.id}/terms`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: terms.product.trim(),
          deliverables: terms.deliverables
            .map((deliverable) => ({
              platform: deliverable.platform.trim(),
              format: deliverable.format.trim(),
              quantity: Number(deliverable.quantity || 1),
            }))
            .filter((deliverable) => deliverable.platform && deliverable.format),
          draftDueAt: terms.draftDueAt,
          postAt: terms.postAt,
          captionRequirements: terms.captionRequirements.trim(),
          hashtags: terms.hashtags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          paymentAmount: Number(terms.paymentAmount || 0),
          advanceAmount: Number(terms.advanceAmount || 0),
          paymentDueAt: terms.paymentDueAt,
          paymentMethod: terms.paymentMethod.trim(),
          exclusivityDays: terms.exclusivityDays ? Number(terms.exclusivityDays) : undefined,
          discountCode: terms.discountCode.trim(),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.message || "Failed to save terms")
      setMessage(data?.message || "Collaboration terms updated.")
      await loadPromotion()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save terms")
    } finally {
      setSavingTerms(false)
    }
  }

  const updateStatus = async (nextStatus: PromotionStatus) => {
    if (!promotion) return
    setStatusAction(nextStatus)
    setUpdatingStatus(true)
    setMessage(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${promotion.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.message || "Failed to update status")
      setMessage(data?.message || "Collaboration status updated.")
      await loadPromotion()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setUpdatingStatus(false)
      setStatusAction(null)
    }
  }

  const submitPerformance = async () => {
    if (!promotion) return
    setSubmittingMetrics(true)
    setMessage(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${promotion.id}/performance`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reach: Number(metrics.reach || 0),
          views: Number(metrics.views || 0),
          engagement: Number(metrics.engagement || 0),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.message || "Failed to submit metrics")
      setMessage(data?.message || "Performance submitted.")
      await loadPromotion()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit metrics")
    } finally {
      setSubmittingMetrics(false)
    }
  }

  const markPaid = async () => {
    if (!promotion) return
    setMarkingPaid(true)
    setMessage(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${promotion.id}/payment`, {
        method: "PATCH",
        credentials: "include",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.message || "Failed to update payment")
      setMessage(data?.message || "Payment status updated.")
      await loadPromotion()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update payment")
    } finally {
      setMarkingPaid(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
        <Link href={backHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Link>
      </Button>

      {loading ? (
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-5 text-sm text-slate-600 dark:text-slate-300">Loading collaboration details...</CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-4 text-sm text-rose-600 dark:text-rose-300">{error}</CardContent>
        </Card>
      ) : null}

      {message ? (
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-4 text-sm text-emerald-700 dark:text-emerald-300">{message}</CardContent>
        </Card>
      ) : null}

      {!loading && promotion ? (
        <>
          <Card className="border-white/60 bg-white/85 shadow-xl shadow-cyan-100/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">{promotion.campaignTitle}</CardTitle>
                  <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                    {statusGuidance[promotion.status]}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`border-0 capitalize ${statusPillClass[promotion.status]}`}>
                    {promotion.status.replaceAll("_", " ")}
                  </Badge>
                  <Badge className="border-0 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    Payment {promotion.paymentStatus}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">Current payout</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{formatMoney(promotion.paymentAmount)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">Platforms and deliverables</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{buildDeliverableSummary(promotion)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">Draft due</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{formatDateTime(promotion.draftDueAt)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">Post due</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{formatDateTime(promotion.postAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">How this collaboration works</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Keep the human conversation in chat, then use this page as the clean source of truth once both sides align.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="font-semibold text-slate-900 dark:text-slate-100">1. Align in chat</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">Discuss pay, deliverables, timing, and brand asks like hashtags or codes.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="font-semibold text-slate-900 dark:text-slate-100">2. Lock the agreement</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">The brand updates the agreement summary here after the conversation is aligned.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="font-semibold text-slate-900 dark:text-slate-100">3. Deliver and pay</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">Once accepted, move into delivery, review, metrics, and payment.</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
            <div className="space-y-6">
              <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-100">
                    {role === "brand" ? "Agreement proposal" : "Agreement snapshot"}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {role === "brand"
                      ? "Use chat to discuss the commercial details first. Once both sides align, update the agreement summary here."
                      : "This is the current agreement summary from the brand. If anything feels off, ask for changes in chat before you accept the collaboration."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {role === "brand" ? (
                    <>
                      <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-800 dark:border-cyan-900 dark:bg-cyan-500/10 dark:text-cyan-300">
                        This is the clean agreement summary after the real conversation happens in chat.
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Label>Product or service</Label>
                          <Input value={terms.product} onChange={(e) => setTerms((prev) => ({ ...prev, product: e.target.value }))} disabled={!canEditTerms} />
                        </div>
                        <div className="sm:col-span-2 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <Label>Platforms and deliverables</Label>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Choose exactly where the creator should publish and in what format.
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addDeliverableDraft}
                              disabled={!canEditTerms}
                              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add platform
                            </Button>
                          </div>

                          {terms.deliverables.map((deliverable, index) => {
                            const formatOptions = getFormatOptions(deliverable.platform)
                            return (
                              <div
                                key={`${deliverable.platform}-${index}`}
                                className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-[1.1fr_1.1fr_0.65fr_auto]"
                              >
                                <div>
                                  <Label className="text-xs">Platform</Label>
                                  <select
                                    value={deliverable.platform}
                                    onChange={(e) => handleDeliverablePlatformChange(index, e.target.value)}
                                    disabled={!canEditTerms}
                                    className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                  >
                                    {PLATFORM_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <Label className="text-xs">Format</Label>
                                  <select
                                    value={deliverable.format}
                                    onChange={(e) => updateDeliverableDraft(index, { format: e.target.value })}
                                    disabled={!canEditTerms}
                                    className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                  >
                                    {formatOptions.map((format) => (
                                      <option key={format} value={format}>
                                        {humanizeLabel(format)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <Label className="text-xs">Quantity</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={deliverable.quantity}
                                    onChange={(e) => updateDeliverableDraft(index, { quantity: e.target.value })}
                                    disabled={!canEditTerms}
                                    className="mt-1"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removeDeliverableDraft(index)}
                                    disabled={!canEditTerms || terms.deliverables.length === 1}
                                    className="h-10 w-10 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div>
                          <Label>Draft due</Label>
                          <Input type="date" value={terms.draftDueAt} onChange={(e) => setTerms((prev) => ({ ...prev, draftDueAt: e.target.value }))} disabled={!canEditTerms} />
                        </div>
                        <div>
                          <Label>Post due</Label>
                          <Input type="date" value={terms.postAt} onChange={(e) => setTerms((prev) => ({ ...prev, postAt: e.target.value }))} disabled={!canEditTerms} />
                        </div>
                        <div className="sm:col-span-2">
                          <Label>Caption requirements</Label>
                          <Textarea value={terms.captionRequirements} onChange={(e) => setTerms((prev) => ({ ...prev, captionRequirements: e.target.value }))} disabled={!canEditTerms} />
                        </div>
                        <div className="sm:col-span-2">
                          <Label>Hashtags</Label>
                          <Input value={terms.hashtags} onChange={(e) => setTerms((prev) => ({ ...prev, hashtags: e.target.value }))} placeholder="comma separated" disabled={!canEditTerms} />
                        </div>
                        <div>
                          <Label>Total compensation</Label>
                          <Input type="number" min={0} value={terms.paymentAmount} onChange={(e) => setTerms((prev) => ({ ...prev, paymentAmount: e.target.value }))} disabled={!canEditTerms} />
                        </div>
                        <div>
                          <Label>Advance amount</Label>
                          <Input type="number" min={0} value={terms.advanceAmount} onChange={(e) => setTerms((prev) => ({ ...prev, advanceAmount: e.target.value }))} disabled={!canEditTerms} />
                        </div>
                        <div>
                          <Label>Payment due</Label>
                          <Input type="date" value={terms.paymentDueAt} onChange={(e) => setTerms((prev) => ({ ...prev, paymentDueAt: e.target.value }))} disabled={!canEditTerms} />
                        </div>
                        <div>
                          <Label>Payment method</Label>
                          <select
                            value={terms.paymentMethod}
                            onChange={(e) => setTerms((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                            disabled={!canEditTerms}
                            className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          >
                            <option value="direct">Direct payment</option>
                            <option value="escrow">Escrow</option>
                          </select>
                        </div>
                        <div>
                          <Label>Exclusivity days</Label>
                          <Input type="number" min={0} value={terms.exclusivityDays} onChange={(e) => setTerms((prev) => ({ ...prev, exclusivityDays: e.target.value }))} disabled={!canEditTerms} />
                        </div>
                        <div>
                          <Label>Discount code</Label>
                          <Input value={terms.discountCode} onChange={(e) => setTerms((prev) => ({ ...prev, discountCode: e.target.value }))} disabled={!canEditTerms} />
                        </div>
                      </div>
                      <Button onClick={saveTerms} disabled={!canEditTerms || savingTerms} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700">
                        {savingTerms ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Update agreement
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-300">
                        If you want to change pricing, timelines, hashtags, or scope, ask in chat. The brand owns this agreement summary.
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Product or service</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{promotion.product || "To be confirmed"}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Platforms and deliverables</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{buildDeliverableSummary(promotion)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Draft due</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDateTime(promotion.draftDueAt)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Post due</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDateTime(promotion.postAt)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Total compensation</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatMoney(promotion.paymentAmount)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Advance amount</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{promotion.advanceAmount > 0 ? formatMoney(promotion.advanceAmount) : "No advance"}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Payment due</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDateTime(promotion.paymentDueAt)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Payment method</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{promotion.paymentMethod ? humanizeLabel(promotion.paymentMethod) : "To be confirmed"}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Discount code</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{promotion.discountCode || "Not required"}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Exclusivity</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{promotion.exclusivityDays ? `${promotion.exclusivityDays} day(s)` : "None"}</p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">Guidelines</p>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">{promotion.captionRequirements || "No special caption requirements yet."}</p>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                          Hashtags: {promotion.hashtags.length ? promotion.hashtags.join(", ") : "none yet"}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              {role === "influencer" ? (
                <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Submit work for review</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Share the live asset link or proof here after the agreement is accepted and work starts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Proof URL</Label>
                      <Input value={deliveryProofUrl} onChange={(e) => setDeliveryProofUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <div>
                      <Label>Notes for the brand</Label>
                      <Textarea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} />
                    </div>
                    {deliveryReviewStatus ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                        Review status: {deliveryReviewStatus.replaceAll("_", " ")}
                        {promotion.deliverySubmission?.reviewFeedback ? ` - ${promotion.deliverySubmission.reviewFeedback}` : ""}
                      </div>
                    ) : null}
                    <Button
                      onClick={submitDeliveryProof}
                      disabled={submittingDelivery || !["accepted", "content_in_progress", "posted"].includes(promotion.status)}
                      className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                    >
                      {submittingDelivery ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Submit for brand review
                    </Button>
                  </CardContent>
                </Card>
              ) : null}

              {role === "influencer" ? (
                <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Share final performance</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Once the content is posted, share the results here so the brand can close out payment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label>Reach</Label>
                        <Input type="number" min={0} value={metrics.reach} onChange={(e) => setMetrics((prev) => ({ ...prev, reach: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Views</Label>
                        <Input type="number" min={0} value={metrics.views} onChange={(e) => setMetrics((prev) => ({ ...prev, views: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Engagement %</Label>
                        <Input type="number" min={0} step="0.01" value={metrics.engagement} onChange={(e) => setMetrics((prev) => ({ ...prev, engagement: e.target.value }))} />
                      </div>
                    </div>
                    <Button onClick={submitPerformance} disabled={submittingMetrics || !["posted", "metrics_submitted"].includes(promotion.status)} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700">
                      {submittingMetrics ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
                      Share performance
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <div className="space-y-6">
              <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-100">What happens next</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Use chat for negotiation, then use these actions to move the collaboration forward in a clean, human way.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Link href={openChatHref}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {role === "brand" ? "Open collaboration chat" : "Open brand chat"}
                    </Link>
                  </Button>

                  {isPlanningPhase ? (
                    <Button
                      variant="outline"
                      onClick={() => sendPlanningMessage(role === "brand" ? "offer" : "counter_offer")}
                      disabled={sendingStructuredMessage !== null}
                      className="w-full border-cyan-300 bg-cyan-50 text-cyan-900 hover:bg-cyan-100 dark:border-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                    >
                      {sendingStructuredMessage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                      {role === "brand" ? "Send offer in chat" : "Request changes in chat"}
                    </Button>
                  ) : null}

                  {allowedNextStatuses.length > 0 ? (
                    allowedNextStatuses.map((status) => (
                      <Button
                        key={status}
                        onClick={() => updateStatus(status)}
                        disabled={updatingStatus}
                        className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                      >
                        {updatingStatus && statusAction === status ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        {getStatusActionLabel(role, status)}
                      </Button>
                    ))
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      No stage update is needed right now. Continue the conversation or complete the current work step.
                    </div>
                  )}

                  {role === "brand" ? (
                    <Button
                      variant="outline"
                      onClick={markPaid}
                      disabled={markingPaid || promotion.paymentStatus === "paid"}
                      className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {markingPaid ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {promotion.paymentStatus === "paid" ? "Payment recorded" : "Record payment"}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
              {role === "brand" ? (
                <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Review creator submission</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Keep review lightweight: approve what works, or send feedback and continue the discussion in chat.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                      <p className="font-medium text-slate-900 dark:text-slate-100">Proof URL</p>
                      <p className="mt-1 break-all text-xs text-slate-600 dark:text-slate-300">
                        {promotion.deliverySubmission?.proofUrl || "No proof submitted yet."}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                      <p className="font-medium text-slate-900 dark:text-slate-100">Creator notes</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {promotion.deliverySubmission?.notes || "No notes submitted yet."}
                      </p>
                    </div>
                    <div>
                      <Label>Feedback</Label>
                      <Textarea value={reviewFeedback} onChange={(e) => setReviewFeedback(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => reviewDeliveryProof("approved")}
                        disabled={reviewingDelivery || !promotion.deliverySubmission?.submittedAt}
                        className="flex-1 bg-slate-900 text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                      >
                        {reviewingDelivery ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Approve submission
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => reviewDeliveryProof("changes_requested")}
                        disabled={reviewingDelivery || !promotion.deliverySubmission?.submittedAt}
                        className="flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Request changes
                      </Button>
                    </div>
                    {deliveryReviewStatus ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Current review: {deliveryReviewStatus.replaceAll("_", " ")}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Current performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Reach</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{promotion.performance.reach}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Views</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{promotion.performance.views}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Engagement</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{promotion.performance.engagement}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

