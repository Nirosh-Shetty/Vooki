"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, DollarSign, Loader2, MessageSquare, Plus, Save, Trash2, TrendingUp, Check, ChevronRight, FileText, BarChart, Send, CreditCard, LayoutDashboard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

const statusTransitions: Record<PromotionStatus, PromotionStatus[]> = {
  requested: ["negotiating", "accepted"],
  negotiating: ["accepted"],
  accepted: ["content_in_progress"],
  content_in_progress: ["posted"],
  posted: ["metrics_submitted"],
  metrics_submitted: ["payment_pending"],
  payment_pending: [], 
  completed: [],
}

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
  { value: "instagram", label: "Instagram", formats: ["reel", "story", "post", "carousel", "live"] },
  { value: "youtube", label: "YouTube", formats: ["short", "video", "live", "community_post"] },
  { value: "tiktok", label: "TikTok", formats: ["video", "series", "live"] },
  { value: "x", label: "X / Twitter", formats: ["post", "thread", "video"] },
  { value: "linkedin", label: "LinkedIn", formats: ["post", "article", "video"] },
  { value: "blog", label: "Blog", formats: ["article", "review", "roundup"] },
] as const

const humanizeLabel = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
const getPlatformLabel = (value: string) => PLATFORM_OPTIONS.find((o) => o.value === value)?.label || humanizeLabel(value)
const getFormatOptions = (platform: string) => PLATFORM_OPTIONS.find((i) => i.value === platform)?.formats || ["post"]

const createDeliverableDraft = (partial?: Partial<DeliverableDraft>): DeliverableDraft => {
  const platform = partial?.platform || PLATFORM_OPTIONS[0].value
  const formatOptions = getFormatOptions(platform)
  const format = partial?.format && formatOptions.some((o) => o === partial.format) ? partial.format : formatOptions[0]
  return { platform, format, quantity: partial?.quantity || "1" }
}

const formatMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)

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

const getMessagesPath = (role: UserRole) => role === "brand" ? "/brand/messages" : "/influencer/messages"

const buildChatHref = (role: UserRole, promotion: Promotion | null) => {
  const basePath = getMessagesPath(role)
  const otherUserId = role === "brand" ? promotion?.influencerId : promotion?.brandId
  if (!otherUserId) return basePath
  return `${basePath}?otherUserId=${otherUserId}`
}

const buildDeliverableSummary = (promotion: Promotion) => {
  if (!promotion.deliverables?.length) return "To be confirmed"
  return promotion.deliverables.map((d) => `${d.quantity} x ${getPlatformLabel(d.platform)} ${humanizeLabel(d.format)}`.trim()).join(", ")
}

const buildStructuredOfferData = (promotion: Promotion, messageType: "offer" | "counter_offer"): OfferData => ({
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
  note: messageType === "offer" ? "Please review this proposal in chat and reply with any changes before we lock the agreement." : "I am interested, but I would like to align on scope, pricing, or timing before we lock the agreement.",
})

const getAllowedNextStatuses = (role: UserRole, current: PromotionStatus): PromotionStatus[] => {
  if (role === "brand") {
    if (current === "requested") return ["negotiating"]
    if (current === "negotiating") return ["requested"]
    if (current === "accepted") return ["content_in_progress"]
    if (current === "metrics_submitted") return ["payment_pending"]
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

const STEPS = [
  { id: 1, label: "Negotiation", statuses: ["requested", "negotiating"] },
  { id: 2, label: "Execution", statuses: ["accepted", "content_in_progress"] },
  { id: 3, label: "Review", statuses: ["posted", "metrics_submitted"] },
  { id: 4, label: "Payment", statuses: ["payment_pending"] },
  { id: 5, label: "Completed", statuses: ["completed"] },
]

export function PromotionWorkspace({ promotionId, role, backHref, backLabel }: { promotionId: string, role: UserRole, backHref: string, backLabel: string }) {
  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [savingTerms, setSavingTerms] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [submittingMetrics, setSubmittingMetrics] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)
  const [submittingDelivery, setSubmittingDelivery] = useState(false)
  const [reviewingDelivery, setReviewingDelivery] = useState(false)
  
  const [statusAction, setStatusAction] = useState<PromotionStatus | null>(null)
  const [sendingStructuredMessage, setSendingStructuredMessage] = useState<"offer" | "counter_offer" | null>(null)
  
  const [terms, setTerms] = useState<TermsFormState>({
    product: "", deliverables: [createDeliverableDraft()], draftDueAt: "", postAt: "", captionRequirements: "", hashtags: "",
    paymentAmount: "0", advanceAmount: "0", paymentDueAt: "", paymentMethod: "direct", exclusivityDays: "", discountCode: "",
  })
  const [metrics, setMetrics] = useState({ reach: "0", views: "0", engagement: "0" })
  const [deliveryProofUrl, setDeliveryProofUrl] = useState("")
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [reviewFeedback, setReviewFeedback] = useState("")

  const router = useRouter()
  const { sendMessage } = useMessaging()

  const loadPromotion = async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${promotionId}`, { credentials: "include", signal })
      if (!response.ok) throw new Error("Unable to load collaboration")
      const data: PromotionResponse = await response.json()
      const item = data.promotion || null
      setPromotion(item)
      if (item) {
        setTerms({
          product: item.product || "",
          deliverables: item.deliverables?.length ? item.deliverables.map((d) => createDeliverableDraft({ platform: d.platform, format: d.format, quantity: String(d.quantity || 1) })) : [createDeliverableDraft()],
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

  const allowedNextStatuses = useMemo(() => (promotion ? getAllowedNextStatuses(role, promotion.status) : []), [promotion, role])
  const canEditTerms = role === "brand" && promotion && ["requested", "negotiating", "accepted"].includes(promotion.status)
  const isPlanningPhase = Boolean(promotion && ["requested", "negotiating", "accepted"].includes(promotion.status))
  const openChatHref = buildChatHref(role, promotion)
  const deliveryReviewStatus = promotion?.deliverySubmission?.reviewStatus || ""

  const updateDeliverableDraft = (index: number, updates: Partial<DeliverableDraft>) => {
    setTerms((prev) => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) => i === index ? { ...d, ...updates } : d)
    }))
  }

  const handleDeliverablePlatformChange = (index: number, platform: string) => {
    const formatOptions = getFormatOptions(platform)
    setTerms((prev) => {
      const current = prev.deliverables[index]
      const nextFormat = formatOptions.some((o) => o === (current?.format || "")) ? current.format : formatOptions[0]
      return { ...prev, deliverables: prev.deliverables.map((d, i) => i === index ? { ...d, platform, format: nextFormat } : d) }
    })
  }

  const addDeliverableDraft = () => setTerms((prev) => ({ ...prev, deliverables: [...prev.deliverables, createDeliverableDraft()] }))
  const removeDeliverableDraft = (index: number) => {
    setTerms((prev) => {
      if (prev.deliverables.length === 1) return { ...prev, deliverables: [createDeliverableDraft()] }
      return { ...prev, deliverables: prev.deliverables.filter((_, i) => i != index) }
    })
  }

  const sendPlanningMessage = async (messageType: "offer" | "counter_offer") => {
    if (!promotion) return
    const otherUserId = role === "brand" ? promotion.influencerId : promotion.brandId
    if (!otherUserId) return setError("Unable to open collaboration chat right now.")
    setSendingStructuredMessage(messageType)
    setError(null)
    setMessage(null)
    try {
      const response = await messagingAPI.getOrCreateConversation(otherUserId)
      const conversationId = response.conversation.id
      await sendMessage(conversationId, undefined, { messageType, offerData: buildStructuredOfferData(promotion, messageType) })
      router.push(`${getMessagesPath(role)}?conversationId=${conversationId}`)
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
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl: deliveryProofUrl.trim(), notes: deliveryNotes.trim() }),
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
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, feedback: reviewFeedback.trim() }),
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
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: terms.product.trim(),
          deliverables: terms.deliverables.map((d) => ({ platform: d.platform.trim(), format: d.format.trim(), quantity: Number(d.quantity || 1) })).filter((d) => d.platform && d.format),
          draftDueAt: terms.draftDueAt, postAt: terms.postAt, captionRequirements: terms.captionRequirements.trim(),
          hashtags: terms.hashtags.split(",").map((t) => t.trim()).filter(Boolean),
          paymentAmount: Number(terms.paymentAmount || 0), advanceAmount: Number(terms.advanceAmount || 0),
          paymentDueAt: terms.paymentDueAt, paymentMethod: terms.paymentMethod.trim(), exclusivityDays: terms.exclusivityDays ? Number(terms.exclusivityDays) : undefined, discountCode: terms.discountCode.trim(),
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
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
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
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reach: Number(metrics.reach || 0), views: Number(metrics.views || 0), engagement: Number(metrics.engagement || 0) }),
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${promotion.id}/payment`, { method: "PATCH", credentials: "include" })
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

  const confirmPayment = async () => {
    if (!promotion) return
    setConfirmingPayment(true)
    setMessage(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${promotion.id}/payment/confirm`, { method: "PATCH", credentials: "include" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.message || "Failed to confirm payment")
      setMessage(data?.message || "Payment confirmed.")
      await loadPromotion()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to confirm payment")
    } finally {
      setConfirmingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[color:var(--vooki-accent)]" />
        <p className="text-sm font-medium text-[color:var(--vooki-app-text-soft)]">Loading workspace...</p>
      </div>
    )
  }

  if (!promotion) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <Button asChild variant="outline"><Link href={backHref}><ArrowLeft className="mr-2 h-4 w-4" />{backLabel}</Link></Button>
        <Card className="border-red-200 bg-red-50 text-red-800"><CardContent className="p-5">{error || "Unable to load collaboration."}</CardContent></Card>
      </div>
    )
  }

  const currentStepIndex = STEPS.findIndex((s) => s.statuses.includes(promotion.status))

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* HEADER SECTION */}
      <div className="space-y-8 relative">
        <Button asChild variant="ghost" className="h-8 px-0 text-[color:var(--vooki-app-text-soft)] hover:bg-transparent hover:text-[color:var(--vooki-app-text-strong)]">
          <Link href={backHref}><ArrowLeft className="mr-2 h-4 w-4" />{backLabel}</Link>
        </Button>
        
        <div className="flex flex-col gap-2 relative z-10">
          <h1 className="text-3xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">{promotion.campaignTitle}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] opacity-70 uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] border-[color:var(--vooki-app-border-strong)]">ID: {promotion.id.slice(-6)}</Badge>
            <Badge className="border-0 bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] capitalize text-xs">
              Status: {promotion.status.replaceAll("_", " ")}
            </Badge>
          </div>
        </div>

        {/* VISUAL STEPPER */}
        <div className="relative pt-6 pb-2">
          <div className="absolute top-[42%] left-0 h-0.5 w-full -translate-y-1/2 bg-[color:var(--vooki-app-border-strong)]" />
          <div className="relative flex justify-between z-10">
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStepIndex
              const isPast = idx < currentStepIndex
              return (
                <div key={step.id} className="flex flex-col items-center gap-3 bg-[color:var(--vooki-app-bg)] px-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isActive ? "border-[color:var(--vooki-accent)] bg-[color:var(--vooki-accent)] text-white shadow-[var(--vooki-shadow-accent)] ring-4 ring-[color:var(--vooki-accent-soft)]" : 
                    isPast ? "border-[color:var(--vooki-accent)] bg-[color:var(--vooki-accent)] text-white" : 
                    "border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-soft)]"
                  }`}>
                    {isPast ? <Check className="h-4 w-4" /> : <span className="text-sm font-semibold">{step.id}</span>}
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? "text-[color:var(--vooki-app-text-strong)]" : "text-[color:var(--vooki-app-text-soft)] opacity-70"}`}>{step.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {error ? <Card className="border-red-200 bg-red-50"><CardContent className="p-4 text-sm text-red-800">{error}</CardContent></Card> : null}
      {message ? <Card className="border-emerald-200 bg-emerald-50"><CardContent className="p-4 text-sm text-emerald-800">{message}</CardContent></Card> : null}

      {/* 2-COLUMN LAYOUT */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start">
        
        {/* MAIN COLUMN: TABS */}
        <div className="w-full">
          <Tabs defaultValue="agreement" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-[color:var(--vooki-app-border)] rounded-none p-0 h-auto gap-6 mb-6">
              <TabsTrigger value="agreement" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[color:var(--vooki-accent)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-semibold tracking-wide uppercase text-[11px]">
                <FileText className="mr-2 h-4 w-4" /> Agreement Terms
              </TabsTrigger>
              <TabsTrigger value="delivery" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[color:var(--vooki-accent)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-semibold tracking-wide uppercase text-[11px]">
                <Send className="mr-2 h-4 w-4" /> Delivery & Review
              </TabsTrigger>
              <TabsTrigger value="performance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[color:var(--vooki-accent)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-semibold tracking-wide uppercase text-[11px]">
                <BarChart className="mr-2 h-4 w-4" /> Performance
              </TabsTrigger>
            </TabsList>
            
            {/* TAB: AGREEMENT */}
            <TabsContent value="agreement" className="outline-none mt-0">
              <Card className="border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-[color:var(--vooki-app-surface-strong)] border-b border-[color:var(--vooki-app-border)] px-6 py-5">
                  <CardTitle className="text-xl">Commercial Terms</CardTitle>
                  <CardDescription>
                    {role === "brand" ? "Update the agreement details based on your chat negotiations." : "The terms set by the brand. Ask for changes in chat if needed."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {role === "brand" ? (
                    <div className="space-y-8">
                        <div className="space-y-5">
                          <div>
                            <Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] mb-2 block">Product or service</Label>
                            <Input value={terms.product} onChange={(e) => setTerms((prev) => ({ ...prev, product: e.target.value }))} disabled={!canEditTerms} className="h-11 rounded-xl" />
                          </div>
                          
                          <div className="space-y-4 pt-6 border-t border-[color:var(--vooki-app-border-strong)]">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)]">Deliverables</Label>
                              <Button type="button" variant="outline" size="sm" onClick={addDeliverableDraft} disabled={!canEditTerms} className="rounded-full h-8 text-xs">
                                <Plus className="mr-2 h-3 w-3" /> Add
                              </Button>
                            </div>
                            {terms.deliverables.map((deliverable, index) => {
                              const formatOptions = getFormatOptions(deliverable.platform)
                              return (
                                <div key={index} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[color:var(--vooki-app-border)] p-4 bg-[color:var(--vooki-app-surface-strong)]">
                                  <div className="flex-1 min-w-[120px]">
                                    <Label className="text-[10px] uppercase tracking-wider mb-1 block opacity-70">Platform</Label>
                                    <select value={deliverable.platform} onChange={(e) => handleDeliverablePlatformChange(index, e.target.value)} disabled={!canEditTerms} className="h-10 w-full rounded-xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] px-3 text-sm focus:ring-2 focus:ring-[color:var(--vooki-accent)] outline-none">
                                      {PLATFORM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                  </div>
                                  <div className="flex-1 min-w-[120px]">
                                    <Label className="text-[10px] uppercase tracking-wider mb-1 block opacity-70">Format</Label>
                                    <select value={deliverable.format} onChange={(e) => updateDeliverableDraft(index, { format: e.target.value })} disabled={!canEditTerms} className="h-10 w-full rounded-xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] px-3 text-sm focus:ring-2 focus:ring-[color:var(--vooki-accent)] outline-none">
                                      {formatOptions.map((f) => <option key={f} value={f}>{humanizeLabel(f)}</option>)}
                                    </select>
                                  </div>
                                  <div className="w-24">
                                    <Label className="text-[10px] uppercase tracking-wider mb-1 block opacity-70">Qty</Label>
                                    <Input type="number" min={1} value={deliverable.quantity} onChange={(e) => updateDeliverableDraft(index, { quantity: e.target.value })} disabled={!canEditTerms} className="h-10 rounded-xl" />
                                  </div>
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeDeliverableDraft(index)} disabled={!canEditTerms || terms.deliverables.length === 1} className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )
                            })}
                          </div>

                          <div className="grid gap-6 sm:grid-cols-2 pt-6 border-t border-[color:var(--vooki-app-border-strong)]">
                            <div><Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] mb-2 block">Draft Due</Label><Input type="date" value={terms.draftDueAt} onChange={(e) => setTerms((prev) => ({ ...prev, draftDueAt: e.target.value }))} disabled={!canEditTerms} className="h-11 rounded-xl" /></div>
                            <div><Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] mb-2 block">Post Due</Label><Input type="date" value={terms.postAt} onChange={(e) => setTerms((prev) => ({ ...prev, postAt: e.target.value }))} disabled={!canEditTerms} className="h-11 rounded-xl" /></div>
                            <div className="sm:col-span-2"><Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] mb-2 block">Caption requirements</Label><Textarea value={terms.captionRequirements} onChange={(e) => setTerms((prev) => ({ ...prev, captionRequirements: e.target.value }))} disabled={!canEditTerms} className="rounded-xl min-h-[100px] resize-y" /></div>
                            <div className="sm:col-span-2"><Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] mb-2 block">Hashtags (comma separated)</Label><Input value={terms.hashtags} onChange={(e) => setTerms((prev) => ({ ...prev, hashtags: e.target.value }))} disabled={!canEditTerms} className="h-11 rounded-xl" /></div>
                          </div>

                          <div className="grid gap-6 sm:grid-cols-2 pt-6 border-t border-[color:var(--vooki-app-border-strong)]">
                            <div><Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] mb-2 block">Payout Amount</Label><Input type="number" min={0} value={terms.paymentAmount} onChange={(e) => setTerms((prev) => ({ ...prev, paymentAmount: e.target.value }))} disabled={!canEditTerms} className="h-11 rounded-xl" /></div>
                            <div><Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] mb-2 block">Advance Amount</Label><Input type="number" min={0} value={terms.advanceAmount} onChange={(e) => setTerms((prev) => ({ ...prev, advanceAmount: e.target.value }))} disabled={!canEditTerms} className="h-11 rounded-xl" /></div>
                            <div><Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] mb-2 block">Payment Due</Label><Input type="date" value={terms.paymentDueAt} onChange={(e) => setTerms((prev) => ({ ...prev, paymentDueAt: e.target.value }))} disabled={!canEditTerms} className="h-11 rounded-xl" /></div>
                            <div>
                              <Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] mb-2 block">Payment Method</Label>
                              <select value={terms.paymentMethod} onChange={(e) => setTerms((prev) => ({ ...prev, paymentMethod: e.target.value }))} disabled={!canEditTerms} className="h-11 w-full rounded-xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] px-3 text-sm focus:ring-2 focus:ring-[color:var(--vooki-accent)] outline-none">
                                <option value="direct">Direct payment</option><option value="escrow">Escrow</option>
                              </select>
                            </div>
                            <div><Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] mb-2 block">Exclusivity Days</Label><Input type="number" min={0} value={terms.exclusivityDays} onChange={(e) => setTerms((prev) => ({ ...prev, exclusivityDays: e.target.value }))} disabled={!canEditTerms} className="h-11 rounded-xl" /></div>
                            <div><Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] mb-2 block">Discount Code</Label><Input value={terms.discountCode} onChange={(e) => setTerms((prev) => ({ ...prev, discountCode: e.target.value }))} disabled={!canEditTerms} className="h-11 rounded-xl" /></div>
                          </div>
                        </div>
                        {canEditTerms && (
                          <Button onClick={saveTerms} disabled={savingTerms} className="w-full sm:w-auto rounded-full bg-[color:var(--vooki-accent)] text-white hover:bg-[color:var(--vooki-accent-strong)] px-8 shadow-[var(--vooki-shadow-accent)] h-11">
                            {savingTerms ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Agreement
                          </Button>
                        )}
                    </div>
                  ) : (
                    <div className="grid gap-8 sm:grid-cols-2">
                      <div className="space-y-2 bg-[color:var(--vooki-app-surface-strong)] p-4 rounded-2xl border border-[color:var(--vooki-app-border-strong)]">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--vooki-app-text-soft)]">Product/Service</p>
                        <p className="text-base font-medium">{promotion.product || "TBD"}</p>
                      </div>
                      <div className="space-y-2 bg-[color:var(--vooki-app-surface-strong)] p-4 rounded-2xl border border-[color:var(--vooki-app-border-strong)]">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--vooki-app-text-soft)]">Deliverables</p>
                        <p className="text-base font-medium">{buildDeliverableSummary(promotion)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--vooki-app-text-soft)]">Draft Due</p>
                        <p className="text-base font-medium">{formatDateTime(promotion.draftDueAt)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--vooki-app-text-soft)]">Post Due</p>
                        <p className="text-base font-medium">{formatDateTime(promotion.postAt)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--vooki-app-text-soft)]">Payout</p>
                        <p className="text-base font-medium">{formatMoney(promotion.paymentAmount)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--vooki-app-text-soft)]">Advance</p>
                        <p className="text-base font-medium">{promotion.advanceAmount > 0 ? formatMoney(promotion.advanceAmount) : "None"}</p>
                      </div>
                      <div className="sm:col-span-2 bg-[color:var(--vooki-app-surface-strong)] p-5 rounded-3xl border border-[color:var(--vooki-app-border)] shadow-sm">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--vooki-app-text-soft)] mb-3">Guidelines</p>
                        <p className="text-[color:var(--vooki-app-text-strong)] leading-relaxed">{promotion.captionRequirements || "No specific caption requirements."}</p>
                        {promotion.hashtags.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-[color:var(--vooki-app-border-strong)]">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--vooki-app-text-soft)] mb-2">Hashtags</p>
                            <div className="flex flex-wrap gap-2">
                              {promotion.hashtags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="rounded-md font-normal">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: DELIVERY */}
            <TabsContent value="delivery" className="outline-none mt-0">
              {promotion.deliverySubmission?.submittedAt ? (
                <Card className="border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-sm rounded-3xl overflow-hidden">
                  <CardHeader className="bg-[color:var(--vooki-app-surface-strong)] border-b border-[color:var(--vooki-app-border)] px-6 py-5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">Delivery Proof</CardTitle>
                      {deliveryReviewStatus === "approved" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-0 py-1 px-3">Approved</Badge>
                      ) : deliveryReviewStatus === "changes_requested" ? (
                        <Badge className="bg-amber-100 text-amber-800 border-0 py-1 px-3">Changes Requested</Badge>
                      ) : <Badge variant="secondary" className="border-0 py-1 px-3">Pending Review</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="p-5 bg-[color:var(--vooki-app-surface-strong)] rounded-2xl border border-[color:var(--vooki-app-border)]">
                      <Label className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--vooki-app-text-soft)] mb-2 block">URL</Label>
                      <a href={promotion.deliverySubmission.proofUrl} target="_blank" rel="noreferrer" className="block text-base text-[color:var(--vooki-accent)] hover:underline truncate">
                        {promotion.deliverySubmission.proofUrl}
                      </a>
                    </div>
                    {promotion.deliverySubmission.notes && (
                      <div className="p-5 bg-[color:var(--vooki-app-surface-strong)] rounded-2xl border border-[color:var(--vooki-app-border)]">
                        <Label className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--vooki-app-text-soft)] mb-2 block">Creator Notes</Label>
                        <p className="text-base">{promotion.deliverySubmission.notes}</p>
                      </div>
                    )}
                    {promotion.deliverySubmission.reviewFeedback && (
                      <div className="p-5 border border-amber-200 bg-amber-50 text-amber-900 rounded-2xl">
                        <Label className="text-[10px] uppercase tracking-wider font-semibold text-amber-700/70 mb-2 block">Brand Feedback</Label>
                        <p className="text-base">{promotion.deliverySubmission.reviewFeedback}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-[color:var(--vooki-app-border)] rounded-3xl bg-[color:var(--vooki-app-surface-strong)]/50">
                  <FileText className="h-10 w-10 mx-auto text-[color:var(--vooki-app-text-soft)] opacity-50 mb-3" />
                  <p className="text-[color:var(--vooki-app-text-strong)] font-medium text-lg">No delivery proof yet</p>
                  <p className="text-sm mt-1 text-[color:var(--vooki-app-text-soft)]">
                    {role === "influencer" ? "Submit your work using the Action Center." : "Waiting for the creator to upload."}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB: PERFORMANCE */}
            <TabsContent value="performance" className="outline-none mt-0">
              <Card className="border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-[color:var(--vooki-app-surface-strong)] border-b border-[color:var(--vooki-app-border)] px-6 py-5">
                  <CardTitle className="text-xl">Campaign Results</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {promotion.status === "metrics_submitted" || promotion.status === "payment_pending" || promotion.status === "completed" ? (
                    <div className="grid gap-6 sm:grid-cols-3">
                      <div className="p-6 rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-center shadow-sm">
                        <p className="text-[11px] font-semibold text-[color:var(--vooki-app-text-soft)] uppercase tracking-widest mb-2">Reach</p>
                        <p className="text-3xl font-bold">{promotion.performance.reach.toLocaleString()}</p>
                      </div>
                      <div className="p-6 rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-center shadow-sm">
                        <p className="text-[11px] font-semibold text-[color:var(--vooki-app-text-soft)] uppercase tracking-widest mb-2">Views</p>
                        <p className="text-3xl font-bold">{promotion.performance.views.toLocaleString()}</p>
                      </div>
                      <div className="p-6 rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-center shadow-sm">
                        <p className="text-[11px] font-semibold text-[color:var(--vooki-app-text-soft)] uppercase tracking-widest mb-2">Engagement</p>
                        <p className="text-3xl font-bold">{promotion.performance.engagement}%</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <BarChart className="h-10 w-10 mx-auto text-[color:var(--vooki-app-text-soft)] opacity-50 mb-3" />
                      <p className="text-[color:var(--vooki-app-text-strong)] font-medium text-lg">Metrics pending</p>
                      <p className="text-sm mt-1 text-[color:var(--vooki-app-text-soft)]">Performance will be available after content is posted.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT COLUMN: ACTION CENTER */}
        <div className="w-full">
          <Card className="border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)] rounded-3xl overflow-hidden sticky top-6">
            <div className="bg-[color:var(--vooki-app-surface-strong)] border-b border-[color:var(--vooki-app-border)] px-6 py-4">
              <h3 className="font-semibold text-[color:var(--vooki-app-text-strong)] flex items-center tracking-wide">
                <LayoutDashboard className="mr-2 h-4 w-4 text-[color:var(--vooki-accent)]" /> ACTION CENTER
              </h3>
            </div>
            
            <CardContent className="p-6 space-y-8">
              {/* PRIMARY ACTION BLOCK BASED ON CONTEXT */}
              <div className="space-y-4">
                
                {/* 1. Planning Phase Actions */}
                {isPlanningPhase && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">Negotiation Active</p>
                      <p className="text-xs text-[color:var(--vooki-app-text-soft)] mt-1">Align on terms in chat, then update the agreement.</p>
                    </div>
                    <Button onClick={() => router.push(openChatHref)} variant="outline" className="w-full rounded-full border-[color:var(--vooki-app-border-strong)] h-11">
                      <MessageSquare className="mr-2 h-4 w-4" /> {role === "brand" ? "Open Chat" : "Message Brand"}
                    </Button>
                    <Button onClick={() => sendPlanningMessage(role === "brand" ? "offer" : "counter_offer")} disabled={sendingStructuredMessage !== null} className="w-full rounded-full bg-[color:var(--vooki-violet)] hover:bg-[color:var(--vooki-violet-strong)] text-white shadow-md h-11">
                      {sendingStructuredMessage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      {role === "brand" ? "Send Offer to Chat" : "Propose Counter"}
                    </Button>
                  </div>
                )}

                {/* 2. Brand Status Update Actions (Accept, Move to Payment) */}
                {allowedNextStatuses.map((status) => (
                  <Button key={status} onClick={() => updateStatus(status)} disabled={updatingStatus} className="w-full rounded-full h-11 bg-[color:var(--vooki-accent)] text-white hover:bg-[color:var(--vooki-accent-strong)] shadow-[var(--vooki-shadow-accent)]">
                    {updatingStatus && statusAction === status ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                    {getStatusActionLabel(role, status)}
                  </Button>
                ))}

                {/* 3. Influencer Delivery Form */}
                {role === "influencer" && ["accepted", "content_in_progress", "posted"].includes(promotion.status) && (
                  <div className="space-y-4 pt-6 border-t border-[color:var(--vooki-app-border-strong)]">
                    <p className="text-sm font-semibold">Submit Delivery Proof</p>
                    <Input value={deliveryProofUrl} onChange={(e) => setDeliveryProofUrl(e.target.value)} placeholder="Proof URL (e.g. Google Drive, TikTok link)" className="text-sm h-11 rounded-xl" />
                    <Textarea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} placeholder="Notes for the brand..." className="text-sm min-h-[80px] rounded-xl" />
                    <Button onClick={submitDeliveryProof} disabled={submittingDelivery || !deliveryProofUrl} className="w-full rounded-full h-11 bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                      {submittingDelivery ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Submit Proof
                    </Button>
                  </div>
                )}

                {/* 4. Brand Review Form */}
                {role === "brand" && promotion.deliverySubmission?.submittedAt && ["accepted", "content_in_progress", "posted"].includes(promotion.status) && (
                  <div className="space-y-4 pt-6 border-t border-[color:var(--vooki-app-border-strong)]">
                    <p className="text-sm font-semibold">Review Delivery</p>
                    {deliveryReviewStatus === "approved" ? (
                      <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-sm">You have approved this submission.</div>
                    ) : (
                      <>
                        <Textarea value={reviewFeedback} onChange={(e) => setReviewFeedback(e.target.value)} placeholder="Optional feedback..." className="text-sm min-h-[80px] rounded-xl" />
                        <div className="flex gap-2">
                          <Button onClick={() => reviewDeliveryProof("approved")} disabled={reviewingDelivery} className="flex-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 h-10 text-sm shadow-md">
                            {reviewingDelivery ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />} Approve
                          </Button>
                          <Button variant="outline" onClick={() => reviewDeliveryProof("changes_requested")} disabled={reviewingDelivery} className="flex-1 rounded-full h-10 text-sm border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100">
                            Reject
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 5. Influencer Performance Form */}
                {role === "influencer" && ["posted", "metrics_submitted"].includes(promotion.status) && (
                  <div className="space-y-4 pt-6 border-t border-[color:var(--vooki-app-border-strong)]">
                    <p className="text-sm font-semibold">Share Metrics</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-[10px] uppercase tracking-wider mb-1 block">Reach</Label><Input type="number" min={0} value={metrics.reach} onChange={(e) => setMetrics((prev) => ({ ...prev, reach: e.target.value }))} className="h-10 text-sm rounded-xl" /></div>
                      <div><Label className="text-[10px] uppercase tracking-wider mb-1 block">Views</Label><Input type="number" min={0} value={metrics.views} onChange={(e) => setMetrics((prev) => ({ ...prev, views: e.target.value }))} className="h-10 text-sm rounded-xl" /></div>
                      <div className="col-span-2"><Label className="text-[10px] uppercase tracking-wider mb-1 block">Engagement %</Label><Input type="number" min={0} step="0.01" value={metrics.engagement} onChange={(e) => setMetrics((prev) => ({ ...prev, engagement: e.target.value }))} className="h-10 text-sm rounded-xl" /></div>
                    </div>
                    <Button onClick={submitPerformance} disabled={submittingMetrics} className="w-full rounded-full h-11 bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                      {submittingMetrics ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />} Submit Metrics
                    </Button>
                  </div>
                )}

                {/* 6. Brand Payment */}
                {role === "brand" && promotion.status === "payment_pending" && (
                  <div className="space-y-4 pt-6 border-t border-[color:var(--vooki-app-border-strong)]">
                    <p className="text-sm font-semibold">Payment</p>
                    {promotion.paymentStatus === "paid" ? (
                      <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">Waiting for creator to confirm receipt.</div>
                    ) : (
                      <Button onClick={markPaid} disabled={markingPaid} className="w-full rounded-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md">
                        {markingPaid ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />} Mark as Paid
                      </Button>
                    )}
                  </div>
                )}

                {/* 7. Influencer Confirm Payment */}
                {role === "influencer" && promotion.status === "payment_pending" && promotion.paymentStatus === "paid" && (
                  <div className="space-y-4 pt-6 border-t border-[color:var(--vooki-app-border-strong)]">
                    <p className="text-sm font-semibold">Payment Received?</p>
                    <Button onClick={confirmPayment} disabled={confirmingPayment} className="w-full rounded-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md">
                      {confirmingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Confirm Receipt
                    </Button>
                  </div>
                )}

                {(!isPlanningPhase && allowedNextStatuses.length === 0 && promotion.status !== "payment_pending") && (
                   <p className="text-xs text-center text-[color:var(--vooki-app-text-soft)] italic pt-4">
                     Waiting on the other party or next steps.
                   </p>
                )}

              </div>

              {/* QUICK SUMMARY */}
              <div className="pt-6 border-t border-[color:var(--vooki-app-border-strong)] space-y-4">
                <p className="text-[10px] font-semibold text-[color:var(--vooki-app-text-soft)] uppercase tracking-widest">Quick Details</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[color:var(--vooki-app-text-soft)]">Payout</span>
                  <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{formatMoney(promotion.paymentAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[color:var(--vooki-app-text-soft)]">Post Due</span>
                  <span className="font-medium text-[color:var(--vooki-app-text-strong)]">{formatDateTime(promotion.postAt)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[color:var(--vooki-app-text-soft)]">Method</span>
                  <span className="font-medium capitalize text-[color:var(--vooki-app-text-strong)]">{promotion.paymentMethod}</span>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
