"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Globe,
  HeartHandshake,
  MapPin,
  Star,
  TrendingUp,
  Users,
  Sparkles,
  Instagram,
  Youtube,
  BarChart3,
  Eye,
  Activity,
  DollarSign
} from "lucide-react"
import { CreateInviteModal } from "@/components/collaboration/CreateInviteModal"

type PublicProfile = {
  id: string
  name: string
  handle: string
  role: "influencer"
  profilePicture: string
  verified: boolean
  niche: string
  followers: number
  rating: number
  totalReviews: number
  socialLinks: Record<string, string>
  metrics: {
    engagementRate: number
    avgViews: number
    estCpv: number
    fitScore: number
  }
  highlights: string[]
}

type BrandInviteItem = {
  influencerId: string
  campaignId: string
  status: "pending" | "accepted" | "rejected" | "expired"
}

type BrandInviteListResponse = {
  items?: BrandInviteItem[]
}

type CampaignOption = {
  id: string
  name: string
}

type CampaignListResponse = {
  items?: CampaignOption[]
}

const previewProfiles: Record<string, PublicProfile> = {
  seed_1: {
    id: "seed_1",
    name: "Mina Styles",
    handle: "@minastyles",
    role: "influencer",
    profilePicture: "",
    verified: true,
    niche: "Fashion + Lifestyle",
    followers: 182000,
    rating: 4.8,
    totalReviews: 62,
    socialLinks: {
      instagram: "https://instagram.com/minastyles",
      youtube: "https://youtube.com/@minastyles",
    },
    metrics: {
      engagementRate: 7.8,
      avgViews: 96000,
      estCpv: 0.05,
      fitScore: 92,
    },
    highlights: [
      "Strong conversion on product styling reels",
      "Consistent campaign delivery and brand-safe content",
      "High repeat-collab rate with D2C fashion brands",
    ],
  },
  seed_2: {
    id: "seed_2",
    name: "Noah Tech",
    handle: "@noahbytes",
    role: "influencer",
    profilePicture: "",
    verified: true,
    niche: "Consumer Tech",
    followers: 128000,
    rating: 4.7,
    totalReviews: 49,
    socialLinks: {
      instagram: "https://instagram.com/noahbytes",
      youtube: "https://youtube.com/@noahbytes",
    },
    metrics: {
      engagementRate: 6.1,
      avgViews: 84000,
      estCpv: 0.04,
      fitScore: 88,
    },
    highlights: [
      "Great for product explainers and comparison content",
      "Reliable performance in launch-week campaign windows",
      "Audience quality is strong for SaaS and gadget categories",
    ],
  },
}

const formatCompact = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return `${value}`
}

export default function DiscoverProfilePage() {
  const params = useParams<{ influencerId: string }>()
  const influencerId = params?.influencerId

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<"pending" | "accepted" | "rejected" | "expired" | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState("")

  const isPreviewProfile = Boolean(influencerId && previewProfiles[influencerId])

  useEffect(() => {
    if (!influencerId) return

    if (previewProfiles[influencerId]) {
      setProfile(previewProfiles[influencerId])
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/public/${influencerId}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error("Failed to load profile")
        }

        const data: PublicProfile = await response.json()
        setProfile(data)
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError("Unable to load this profile right now.")
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [influencerId])

  useEffect(() => {
    if (!influencerId || isPreviewProfile) {
      setInviteStatus(null)
      return
    }

    const controller = new AbortController()

    const loadInviteStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites?status=all&limit=50`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        )

        if (!response.ok) return

        const data: BrandInviteListResponse = await response.json()
        const items = Array.isArray(data?.items) ? data.items : []
        const currentInvite = items.find(
          (item) =>
            String(item?.influencerId) === String(influencerId)
        )
        setInviteStatus(currentInvite?.status || null)
      } catch {
        setInviteStatus(null)
      }
    }

    loadInviteStatus()
    return () => controller.abort()
  }, [influencerId, isPreviewProfile])

  useEffect(() => {
    const controller = new AbortController()

    const loadCampaigns = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/campaigns?limit=50`, {
          credentials: "include",
          signal: controller.signal,
        })
        if (!response.ok) return

        const data: CampaignListResponse = await response.json()
        const items = Array.isArray(data.items) ? data.items : []
        setCampaigns(items)
        if (items.length > 0) {
          setSelectedCampaignId((prev) => prev || items[0].id)
        }
      } catch {
        // Ignore campaign loading failures here.
      }
    }

    loadCampaigns()
    return () => controller.abort()
  }, [])
  // We use CreateInviteModal now for detailed invites.

  const socialEntries = useMemo(
    () => Object.entries(profile?.socialLinks || {}).filter(([, value]) => Boolean(value)),
    [profile?.socialLinks]
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 text-[color:var(--vooki-app-text-strong)]">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" className="h-9 rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] text-[color:var(--vooki-app-text-strong)] hover:border-[color:var(--vooki-accent)] hover:text-[color:var(--vooki-app-text-strong)] transition-all">
          <Link href="/brand/discover">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to discover
          </Link>
        </Button>
      </div>

      {loading && (
        <div className="rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-8 text-center text-sm text-[color:var(--vooki-app-text-soft)]">
          Loading profile...
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-500 text-center">
          {error}
        </div>
      )}

      {actionMessage && (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-500 text-center">
          {actionMessage}
        </div>
      )}

      {!loading && profile && (
        <>
          <div className="overflow-hidden rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
            {/* Banner/Cover Photo */}
            <div className="h-32 w-full bg-gradient-to-r from-cyan-500/20 via-emerald-500/20 to-cyan-500/20" />
            
            <div className="px-6 sm:px-10 pb-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between relative -mt-12">
                
                {/* Identity */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-[color:var(--vooki-app-surface-card)] bg-gradient-to-br from-cyan-400 to-[color:var(--vooki-accent)] text-3xl font-bold text-[color:var(--vooki-accent-text)] shadow-inner">
                    {profile.name.charAt(0)}
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                        {profile.name}
                      </h1>
                      {profile.verified && (
                         <Sparkles className="h-5 w-5 text-[color:var(--vooki-accent)] shrink-0" />
                      )}
                    </div>
                    {profile.handle.replace(/^@/, "") !== profile.name && (
                      <p className="text-sm font-medium text-[color:var(--vooki-app-text-soft)] mt-0.5">{profile.handle}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-[color:var(--vooki-app-text-subtle)]">
                      <span>{profile.niche}</span>
                      <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-[color:var(--vooki-app-border-strong)]" />
                      <span className="flex items-center whitespace-nowrap"><MapPin className="mr-1 h-3.5 w-3.5" /> Location not provided</span>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 sm:mt-14 shrink-0">
                  <CreateInviteModal
                    campaigns={campaigns}
                    preselectedInfluencerId={influencerId}
                    onSuccess={() => setInviteStatus("pending")}
                    trigger={
                      <Button
                        disabled={inviteBusy || inviteStatus === "pending" || campaigns.length === 0}
                        className="h-10 rounded-full bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] shadow-sm px-6 font-semibold"
                      >
                        <HeartHandshake className="mr-2 h-4 w-4" />
                        {campaigns.length === 0
                          ? "No Campaigns"
                          : inviteStatus === "pending"
                          ? "Invite pending"
                          : inviteStatus === "accepted" || inviteStatus === "rejected" || inviteStatus === "expired"
                            ? "Invite again"
                            : "Invite to campaign"}
                      </Button>
                    }
                  />
                  <Button asChild variant="outline" className="h-10 rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] hover:border-[color:var(--vooki-accent)] shadow-sm">
                    <Link href={`/brand/messages`}>
                      Message <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Core Metrics */}
              <div className="grid gap-4 sm:grid-cols-4 mt-6 pt-8 border-t border-[color:var(--vooki-app-border)]">
                <div className="rounded-2xl bg-[color:var(--vooki-app-surface-strong)]/50 p-4 border border-[color:var(--vooki-app-border)]/50 flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-[color:var(--vooki-app-text-soft)]" />
                    <p className="text-[11px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider font-semibold">Total Audience</p>
                  </div>
                  <p className="font-bold text-2xl text-[color:var(--vooki-app-text-strong)]">{formatCompact(profile.followers)}</p>
                </div>
                <div className="rounded-2xl bg-[color:var(--vooki-app-surface-strong)]/50 p-4 border border-[color:var(--vooki-app-border)]/50 flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-[color:var(--vooki-app-text-soft)]" />
                    <p className="text-[11px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider font-semibold">Engagement</p>
                  </div>
                  <p className="font-bold text-2xl text-emerald-500">{profile.metrics.engagementRate}%</p>
                </div>
                <div className="rounded-2xl bg-[color:var(--vooki-app-surface-strong)]/50 p-4 border border-[color:var(--vooki-app-border)]/50 flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 text-[color:var(--vooki-app-text-soft)]" />
                    <p className="text-[11px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider font-semibold">Avg Views</p>
                  </div>
                  <p className="font-bold text-2xl text-[color:var(--vooki-app-text-strong)]">{formatCompact(profile.metrics.avgViews)}</p>
                </div>
                <div className="rounded-2xl bg-[color:var(--vooki-app-surface-strong)]/50 p-4 border border-[color:var(--vooki-app-border)]/50 flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-[color:var(--vooki-app-text-soft)]" />
                    <p className="text-[11px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider font-semibold">Est CPV</p>
                  </div>
                  <p className="font-bold text-2xl text-[color:var(--vooki-app-text-strong)]">${profile.metrics.estCpv.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Performance Snapshot */}
            <div className="rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 lg:col-span-2 shadow-[var(--vooki-shadow-app)]">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[color:var(--vooki-app-text-strong)]">Performance Snapshot</h3>
                <p className="text-sm text-[color:var(--vooki-app-text-soft)]">
                  Quick signals for collaboration fit and campaign outcome quality.
                </p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)]/30 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-semibold text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider">Fit Score</span>
                    </div>
                    <span className="text-xl font-bold text-[color:var(--vooki-app-text-strong)]">{profile.metrics.fitScore}%</span>
                  </div>
                  <div className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)]/30 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-amber-500 fill-current" />
                      <span className="text-sm font-semibold text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider">Rating</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-[color:var(--vooki-app-text-strong)]">{profile.rating.toFixed(1)}</span>
                      <p className="text-[10px] text-[color:var(--vooki-app-text-subtle)]">({profile.totalReviews} reviews)</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mt-2">
                  {profile.highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="flex items-start gap-3 rounded-2xl border border-[color:var(--vooki-app-border)]/50 bg-[color:var(--vooki-app-surface-strong)]/20 p-4 text-sm text-[color:var(--vooki-app-text-strong)]"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--vooki-accent)]" />
                      <span className="leading-relaxed">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app)]">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[color:var(--vooki-app-text-strong)]">Social Channels</h3>
                <p className="text-sm text-[color:var(--vooki-app-text-soft)]">
                  Connected platforms.
                </p>
              </div>
              <div className="space-y-3">
                {socialEntries.length === 0 ? (
                  <div className="rounded-2xl border border-[color:var(--vooki-app-border)]/50 bg-[color:var(--vooki-app-surface-strong)]/20 p-4 text-sm text-[color:var(--vooki-app-text-soft)] text-center">
                    No social links shared yet.
                  </div>
                ) : (
                  socialEntries.map(([platform, value]) => {
                    const isInsta = platform.toLowerCase() === 'instagram'
                    const isYT = platform.toLowerCase() === 'youtube'
                    
                    return (
                      <a
                        key={platform}
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)]/30 p-4 text-sm text-[color:var(--vooki-app-text-strong)] hover:border-[color:var(--vooki-accent)] hover:bg-[color:var(--vooki-app-surface-strong)] transition-all"
                      >
                        <span className="flex items-center gap-3 font-medium capitalize">
                          {isInsta ? <Instagram className="h-5 w-5 text-pink-500" /> : isYT ? <Youtube className="h-5 w-5 text-red-500" /> : <Globe className="h-5 w-5 text-[color:var(--vooki-accent)]" />}
                          {platform}
                        </span>
                        <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:text-[color:var(--vooki-accent)] transition-all" />
                      </a>
                    )
                  })
                )}
                <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-600 dark:text-emerald-400">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 shrink-0" />
                    <span className="leading-relaxed font-medium">Audience data enrichment active.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
