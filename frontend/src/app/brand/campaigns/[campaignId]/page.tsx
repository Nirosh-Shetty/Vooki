"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Search, Calendar, Users, Target, Activity, MessageSquare, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type CampaignStatus = "draft" | "active" | "paused" | "completed" | "archived"
type CampaignPriority = "low" | "medium" | "high"
type PromotionStatus = "requested" | "negotiating" | "accepted" | "content_in_progress" | "posted" | "metrics_submitted" | "payment_pending" | "completed"
type Deliverable = { platform: string; format: string; quantity: number }

type Campaign = {
  id: string; name: string; objective: string; niche: string; status: CampaignStatus; priority: CampaignPriority;
  budgetTotal: number; budgetSpent: number; roi: number; startDate: string; endDate: string;
  invitedCreators: number; acceptedCreators: number; deliverablesDone: number; deliverablesTotal: number;
}

type Promotion = {
  id: string; campaignId: string; campaignTitle: string; influencerId: string; influencerName?: string; influencerHandle?: string;
  deliverables: Deliverable[]; status: PromotionStatus; paymentStatus: "pending" | "paid"; paymentAmount: number; paymentDueAt: string;
  performance: { reach: number; views: number; engagement: number }
}

type InviteStatus = "pending" | "accepted" | "rejected" | "expired"

type CampaignInvite = {
  id: string; influencerId: string; influencerName: string; influencerHandle: string; influencerNiche: string;
  campaignId: string; campaignLabel: string; note: string; status: InviteStatus;
  promotionId?: string; promotionStatus?: PromotionStatus | ""; createdAt: string;
}

type CampaignResponse = { campaign?: Campaign }
type PromotionListResponse = { items?: Promotion[] }
type InviteListResponse = { items?: CampaignInvite[] }

const formatMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
const formatLabel = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())

const formatDeliverables = (deliverables: Deliverable[]) => {
  if (!deliverables?.length) return "TBD"
  return deliverables.map((d) => `${d.quantity}x ${formatLabel(d.format)}`).join(", ")
}

const statusPillClass: Record<CampaignStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  active: "bg-cyan-50 text-cyan-700 border-cyan-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-slate-100 text-slate-700 border-slate-200",
}

const promotionPillClass: Record<PromotionStatus, string> = {
  requested: "bg-slate-100 text-slate-700",
  negotiating: "bg-violet-50 text-violet-700",
  accepted: "bg-cyan-50 text-cyan-700",
  content_in_progress: "bg-amber-50 text-amber-700",
  posted: "bg-sky-50 text-sky-700",
  metrics_submitted: "bg-emerald-50 text-emerald-700",
  payment_pending: "bg-orange-50 text-orange-700",
  completed: "bg-emerald-50 text-emerald-700",
}

const invitePillClass: Record<InviteStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  expired: "bg-slate-100 text-slate-700",
}

export default function CampaignDetailPage() {
  const params = useParams<{ campaignId: string }>()
  const router = useRouter()
  const campaignId = params?.campaignId

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [invites, setInvites] = useState<CampaignInvite[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (signal?: AbortSignal) => {
    if (!campaignId) return
    setLoading(true)
    setError(null)
    try {
      const [campaignRes, invitesRes, promotionsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/campaigns/${campaignId}`, { credentials: "include", signal }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites?campaignId=${campaignId}&status=all&limit=50`, { credentials: "include", signal }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions?campaignId=${campaignId}&status=all&limit=50`, { credentials: "include", signal }),
      ])

      if (!campaignRes.ok) throw new Error("Failed to load campaign")

      const campaignData: CampaignResponse = await campaignRes.json()
      setCampaign(campaignData?.campaign || null)

      let invitesData: InviteListResponse = { items: [] }
      if (invitesRes.ok) {
        invitesData = await invitesRes.json()
        setInvites(Array.isArray(invitesData?.items) ? invitesData.items : [])
      } else {
        setInvites([])
      }

      if (promotionsRes.ok) {
        const promotionsData: PromotionListResponse = await promotionsRes.json()
        const items = Array.isArray(promotionsData?.items) ? promotionsData.items : []
        
        const enrichedPromotions = items.map(p => {
            const relatedInvite = invitesData?.items?.find(i => i.promotionId === p.id || i.influencerId === p.influencerId);
            return {
                ...p,
                influencerName: p.influencerName || relatedInvite?.influencerName || "Influencer",
                influencerHandle: p.influencerHandle || relatedInvite?.influencerHandle || ""
            }
        });
        
        setPromotions(enrichedPromotions)
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

  if (loading) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[color:var(--vooki-accent)]" />
        <p className="text-sm font-medium text-[color:var(--vooki-app-text-soft)]">Loading campaign...</p>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
        <Button asChild variant="outline"><Link href="/brand/campaigns"><ArrowLeft className="mr-2 h-4 w-4" />Back to campaigns</Link></Button>
        <Card className="border-red-200 bg-red-50 text-red-800"><CardContent className="p-5">{error || "Campaign not found."}</CardContent></Card>
      </div>
    )
  }

  const budgetPercentage = campaign.budgetTotal > 0 ? Math.min(100, Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100)) : 0;
  
  const pendingInvitesCount = invites.filter((i) => i.status === "pending").length;
  const acceptedInvitesCount = invites.filter((i) => i.status === "accepted").length;
  const liveDealsCount = promotions.filter((p) => ["negotiating", "accepted", "content_in_progress", "posted", "metrics_submitted", "payment_pending"].includes(p.status)).length;
  const completedDealsCount = promotions.filter((p) => p.status === "completed").length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      
      {/* UNIFIED HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
        <div>
          <Button asChild variant="ghost" className="h-8 px-0 text-[color:var(--vooki-app-text-soft)] hover:bg-transparent hover:text-[color:var(--vooki-app-text-strong)] mb-2">
            <Link href="/brand/campaigns"><ArrowLeft className="mr-2 h-4 w-4" />Campaigns</Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">{campaign.name}</h1>
            <Badge variant="outline" className={`capitalize font-medium ${statusPillClass[campaign.status]}`}>
              {campaign.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)]">{campaign.objective}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button asChild className="bg-[color:var(--vooki-accent)] text-white hover:bg-[color:var(--vooki-accent-strong)] shadow-[var(--vooki-shadow-accent)] rounded-full px-6">
            <Link href="/brand/discover">
              <Search className="mr-2 h-4 w-4" /> Find Creators
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        {/* TAB NAVIGATION */}
        <TabsList className="w-full justify-start bg-transparent border-b border-[color:var(--vooki-app-border)] rounded-none p-0 h-auto gap-6 mb-8">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[color:var(--vooki-accent)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-semibold tracking-wide uppercase text-[11px]">
             Overview
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[color:var(--vooki-accent)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-semibold tracking-wide uppercase text-[11px]">
             Outreach Pipeline ({invites.length})
          </TabsTrigger>
          <TabsTrigger value="network" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[color:var(--vooki-accent)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-semibold tracking-wide uppercase text-[11px]">
             Active Network ({promotions.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 outline-none mt-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Budget Card */}
            <Card className="border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)] rounded-3xl overflow-hidden lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[color:var(--vooki-app-text-soft)] uppercase tracking-widest flex items-center">
                    <Target className="mr-2 h-4 w-4" /> Budget Utilization
                  </h3>
                  <span className="text-sm font-medium text-[color:var(--vooki-app-text-strong)]">{budgetPercentage}%</span>
                </div>
                
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-3xl font-bold text-[color:var(--vooki-app-text-strong)]">{formatMoney(campaign.budgetSpent)}</p>
                    <p className="text-sm text-[color:var(--vooki-app-text-soft)]">spent of {formatMoney(campaign.budgetTotal)}</p>
                  </div>
                  {campaign.roi > 0 && (
                    <div className="text-right">
                      <p className="text-xl font-bold text-emerald-600">{campaign.roi.toFixed(1)}x</p>
                      <p className="text-xs text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider">Estimated ROI</p>
                    </div>
                  )}
                </div>
                
                <Progress value={budgetPercentage} className="h-3 mt-4 rounded-full bg-[color:var(--vooki-app-border-strong)]" />
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card className="border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)] rounded-3xl overflow-hidden">
              <CardContent className="p-6 h-full flex flex-col justify-center">
                <h3 className="text-sm font-semibold text-[color:var(--vooki-app-text-soft)] uppercase tracking-widest flex items-center mb-6">
                  <Calendar className="mr-2 h-4 w-4" /> Timeline
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] font-semibold">Start Date</p>
                    <p className="text-base font-medium text-[color:var(--vooki-app-text-strong)]">{formatDate(campaign.startDate)}</p>
                  </div>
                  <div className="w-full h-px bg-[color:var(--vooki-app-border-strong)]" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] font-semibold">End Date</p>
                    <p className="text-base font-medium text-[color:var(--vooki-app-text-strong)]">{formatDate(campaign.endDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Funnel Stats */}
            <div className="lg:col-span-3 grid gap-6 grid-cols-2 md:grid-cols-4">
              <div className="p-6 rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-sm">
                <p className="text-xs text-[color:var(--vooki-app-text-soft)] font-medium">Outreach</p>
                <p className="mt-1 text-3xl font-bold">{pendingInvitesCount}</p>
                <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider mt-1">Pending Invites</p>
              </div>
              <div className="p-6 rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-sm">
                <p className="text-xs text-[color:var(--vooki-app-text-soft)] font-medium">Acquisition</p>
                <p className="mt-1 text-3xl font-bold">{acceptedInvitesCount}</p>
                <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider mt-1">Accepted Invites</p>
              </div>
              <div className="p-6 rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-sm">
                <p className="text-xs text-[color:var(--vooki-app-text-soft)] font-medium">Execution</p>
                <p className="mt-1 text-3xl font-bold">{liveDealsCount}</p>
                <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider mt-1">Live Deals</p>
              </div>
              <div className="p-6 rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-sm">
                <p className="text-xs text-[color:var(--vooki-app-text-soft)] font-medium">Completion</p>
                <p className="mt-1 text-3xl font-bold">{completedDealsCount}</p>
                <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider mt-1">Finished Deals</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: PIPELINE */}
        <TabsContent value="pipeline" className="space-y-4 outline-none mt-0">
          {invites.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-[color:var(--vooki-app-border)] rounded-3xl bg-[color:var(--vooki-app-surface-strong)]/50">
              <Users className="h-10 w-10 mx-auto text-[color:var(--vooki-app-text-soft)] opacity-50 mb-3" />
              <p className="text-[color:var(--vooki-app-text-strong)] font-medium text-lg">Your pipeline is empty</p>
              <p className="text-sm mt-1 text-[color:var(--vooki-app-text-soft)] mb-6">Find creators and send invites to start building your network.</p>
              <Button asChild className="bg-[color:var(--vooki-accent)] text-white hover:bg-[color:var(--vooki-accent-strong)] rounded-full">
                <Link href="/brand/discover">Discover Creators</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {invites.map((invite) => (
                <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] hover:border-[color:var(--vooki-accent-soft)] transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[color:var(--vooki-app-surface-strong)] flex items-center justify-center text-lg font-bold text-[color:var(--vooki-app-text-strong)] border border-[color:var(--vooki-app-border-strong)]">
                       {(invite.influencerName || invite.influencerHandle || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-base text-[color:var(--vooki-app-text-strong)]">{invite.influencerName || invite.influencerHandle || "Influencer"}</h4>
                      <p className="text-xs text-[color:var(--vooki-app-text-soft)]">
                        {invite.influencerHandle ? `@${invite.influencerHandle}` : "No handle"} {invite.influencerNiche ? `• ${invite.influencerNiche}` : ""}
                      </p>
                      <p className="text-xs text-[color:var(--vooki-app-text-soft)] mt-1 truncate max-w-xs xl:max-w-md opacity-80">"{invite.note || "Invite sent from discover."}"</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 sm:ml-auto w-full sm:w-auto">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider mb-1">Status</p>
                      <Badge className={`border-0 text-xs capitalize ${invitePillClass[invite.status]}`}>{invite.status}</Badge>
                    </div>
                    
                    <div className="flex gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                      <Button asChild variant="outline" className="flex-1 sm:flex-none rounded-full border-[color:var(--vooki-app-border-strong)] text-sm shadow-sm">
                        <Link href={`/brand/messages?otherUserId=${invite.influencerId}`}>
                          <MessageSquare className="mr-2 h-4 w-4" /> Message
                        </Link>
                      </Button>
                      {invite.promotionId && (
                        <Button asChild className="flex-1 sm:flex-none rounded-full bg-[color:var(--vooki-accent)] text-white hover:bg-[color:var(--vooki-accent-strong)] text-sm shadow-[var(--vooki-shadow-accent)]">
                          <Link href={`/brand/promotions/${invite.promotionId}`}>
                            Workspace <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: NETWORK */}
        <TabsContent value="network" className="space-y-4 outline-none mt-0">
          {promotions.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-[color:var(--vooki-app-border)] rounded-3xl bg-[color:var(--vooki-app-surface-strong)]/50">
              <Activity className="h-10 w-10 mx-auto text-[color:var(--vooki-app-text-soft)] opacity-50 mb-3" />
              <p className="text-[color:var(--vooki-app-text-strong)] font-medium text-lg">No active collaborations yet</p>
              <p className="text-sm mt-1 text-[color:var(--vooki-app-text-soft)]">Once creators accept your invites, their workspaces will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {promotions.map((promotion) => (
                <div 
                  key={promotion.id} 
                  onClick={() => router.push(`/brand/promotions/${promotion.id}`)}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-5 rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] hover:border-[color:var(--vooki-accent)] hover:shadow-md transition-all cursor-pointer group gap-4 lg:gap-8"
                >
                  
                  {/* Creator Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[color:var(--vooki-violet)] to-[color:var(--vooki-accent)] flex items-center justify-center text-lg font-bold text-white shadow-inner">
                       {(promotion.influencerName || promotion.influencerHandle || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-base text-[color:var(--vooki-app-text-strong)] group-hover:text-[color:var(--vooki-accent)] transition-colors">
                        {promotion.influencerName || promotion.influencerHandle || "Influencer"}
                      </h4>
                      <p className="text-xs text-[color:var(--vooki-app-text-soft)] mt-0.5">
                         {formatDeliverables(promotion.deliverables)}
                      </p>
                    </div>
                  </div>

                  {/* Status & Payment */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8 flex-1 lg:justify-end">
                    
                    <div className="flex flex-col lg:items-end">
                      <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider mb-1">State</p>
                      <Badge className={`border-0 text-xs capitalize whitespace-nowrap ${promotionPillClass[promotion.status]}`}>
                        {promotion.status.replaceAll("_", " ")}
                      </Badge>
                    </div>

                    <div className="flex flex-col lg:items-end w-24">
                      <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider mb-1">Payout</p>
                      <p className="text-sm font-semibold">{formatMoney(promotion.paymentAmount)}</p>
                    </div>

                    {/* Metrics Peek */}
                    <div className="flex items-center gap-4 bg-[color:var(--vooki-app-surface-strong)] px-4 py-2 rounded-xl border border-[color:var(--vooki-app-border)] w-full sm:w-auto min-w-[120px] justify-center">
                       {(promotion.performance.reach || promotion.performance.views || promotion.performance.engagement) ? (
                         <>
                           <div className="text-center">
                             <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wide">Views</p>
                             <p className="font-bold text-xs">{promotion.performance.views >= 1000 ? (promotion.performance.views / 1000).toFixed(1) + 'k' : promotion.performance.views}</p>
                           </div>
                           <div className="w-px h-6 bg-[color:var(--vooki-app-border-strong)]" />
                           <div className="text-center">
                             <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wide">Eng</p>
                             <p className="font-bold text-xs text-emerald-600">{promotion.performance.engagement}%</p>
                           </div>
                         </>
                       ) : (
                         <span className="text-xs text-[color:var(--vooki-app-text-soft)] italic">Metrics pending</span>
                       )}
                    </div>

                    <Button variant="ghost" size="icon" className="hidden lg:flex rounded-full h-8 w-8 text-[color:var(--vooki-app-text-soft)] group-hover:text-[color:var(--vooki-accent)] group-hover:bg-[color:var(--vooki-accent-soft)] transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </Button>

                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
