"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
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
  DollarSign,
  Lock,
  Grid,
  Briefcase
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
  rating?: number
  totalReviews?: number
  influencerProfile?: {
    statsConnection?: {
      instagram?: { followers: number; engagementRate?: number }
      youtube?: { subscribers: number; engagementRate?: number }
    }
  }
  socialLinks: Record<string, string>
  metrics: {
    engagementRate: number
    estCpv: number
  }
  audienceDemographics: {
    topAgeBracket: string
    genderSplit: { male: number; female: number }
    topLocation: string
  }
  pastCollaborations: string[]
  recentContent: string[]
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
    socialLinks: {
      instagram: "https://instagram.com/minastyles",
      youtube: "https://youtube.com/@minastyles",
    },
    metrics: {
      engagementRate: 7.8,
      estCpv: 0.05,
    },
    audienceDemographics: {
      topAgeBracket: "18-24",
      genderSplit: { male: 15, female: 85 },
      topLocation: "New York, USA",
    },
    pastCollaborations: ["Sephora", "Zara", "Revolve"],
    recentContent: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1509631179647-0c500ab14c50?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1485230405346-71acb9518d9c?auto=format&fit=crop&q=80&w=800",
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
    socialLinks: {
      instagram: "https://instagram.com/noahbytes",
      youtube: "https://youtube.com/@noahbytes",
    },
    metrics: {
      engagementRate: 6.1,
      estCpv: 0.04,
    },
    audienceDemographics: {
      topAgeBracket: "25-34",
      genderSplit: { male: 75, female: 25 },
      topLocation: "London, UK",
    },
    pastCollaborations: ["Sony", "Logitech", "Samsung"],
    recentContent: [
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&q=80&w=800",
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
  const [activeTab, setActiveTab] = useState<"content" | "collabs">("content")

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
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[color:var(--vooki-app-border-strong)] bg-gradient-to-br from-[color:var(--vooki-app-surface-strong)] to-[color:var(--vooki-app-surface-card)] text-2xl font-black text-[color:var(--vooki-app-text-strong)] shadow-inner">
                {profile.name.charAt(0)}
                {profile.verified && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--vooki-app-bg)]">
                    <Sparkles className="h-3 w-3 text-[color:var(--vooki-accent)]" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[color:var(--vooki-app-text-strong)]">
                  {profile.name}
                </h1>
                <p className="text-sm font-medium text-[color:var(--vooki-app-text-soft)]">{profile.handle}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-[10px] font-semibold bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] border-[color:var(--vooki-app-border)] uppercase tracking-wider">
                    {profile.niche}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="h-12 px-6 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-transparent text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)] transition-all font-bold">
                <Link href={`/brand/messages`}>
                  Message
                </Link>
              </Button>
              <CreateInviteModal
                campaigns={campaigns}
                preselectedInfluencerId={influencerId}
                onSuccess={() => setInviteStatus("pending")}
                trigger={
                  <Button
                    disabled={inviteBusy || inviteStatus === "pending" || campaigns.length === 0}
                    className="h-12 px-8 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] hover:-translate-y-0.5 hover:shadow-md transition-all font-bold"
                  >
                    <HeartHandshake className="mr-2 h-4 w-4" />
                    {campaigns.length === 0
                      ? "No Campaigns"
                      : inviteStatus === "pending"
                      ? "Invite Pending"
                      : inviteStatus === "accepted" || inviteStatus === "rejected" || inviteStatus === "expired"
                        ? "Invite Again"
                        : "Invite to Campaign"}
                  </Button>
                }
              />
            </div>
          </div>

          {/* Top Section: Dashboard Insights */}
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Reputation & Value */}
            <div className="rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)]">Creator Value</h3>
                <div className="space-y-5">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-sm font-medium text-[color:var(--vooki-app-text-strong)] flex items-center gap-2 min-w-0"><Star className="w-4 h-4 shrink-0 text-amber-500 fill-amber-500" /> <span className="truncate">Vooki Rating</span></span>
                    <span className="text-lg font-black tracking-tight text-[color:var(--vooki-app-text-strong)] shrink-0">{profile.rating ? `${profile.rating}/5` : "New"}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-sm font-medium text-[color:var(--vooki-app-text-strong)] flex items-center gap-2 min-w-0"><Activity className="w-4 h-4 shrink-0 text-emerald-500" /> <span className="truncate">Avg. Engagement</span></span>
                    <span className="text-lg font-black tracking-tight text-emerald-500 shrink-0">{profile.metrics?.engagementRate || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-sm font-medium text-[color:var(--vooki-app-text-strong)] flex items-center gap-2 min-w-0"><DollarSign className="w-4 h-4 shrink-0 text-emerald-600" /> <span className="truncate">Est CPV</span></span>
                    <span className="text-lg font-black tracking-tight text-[color:var(--vooki-app-text-strong)] shrink-0">${profile.metrics?.estCpv?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Reach & Links */}
            <div className="rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)]">Platforms</h3>
                
                <div className="space-y-4">
                  {/* Instagram Stats */}
                  <a href={profile.socialLinks?.instagram || "#"} target={profile.socialLinks?.instagram ? "_blank" : "_self"} rel="noreferrer" className="flex items-center justify-between p-3 rounded-2xl bg-[color:var(--vooki-app-surface-strong)]/30 border border-[color:var(--vooki-app-border)] gap-2 hover:border-[color:var(--vooki-accent)] transition-all group cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                        <Instagram className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[color:var(--vooki-app-text-strong)] truncate flex items-center gap-1">Instagram <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                        <p className="text-[11px] font-medium text-[color:var(--vooki-app-text-subtle)] uppercase tracking-wider truncate">Followers</p>
                      </div>
                    </div>
                    <span className="text-lg font-black tracking-tight text-[color:var(--vooki-app-text-strong)] shrink-0">
                      {formatCompact(profile.influencerProfile?.statsConnection?.instagram?.followers || profile.followers || 0)}
                    </span>
                  </a>

                  {/* YouTube Stats */}
                  <a href={profile.socialLinks?.youtube || "#"} target={profile.socialLinks?.youtube ? "_blank" : "_self"} rel="noreferrer" className="flex items-center justify-between p-3 rounded-2xl bg-[color:var(--vooki-app-surface-strong)]/30 border border-[color:var(--vooki-app-border)] gap-2 hover:border-[color:var(--vooki-accent)] transition-all group cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                        <Youtube className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[color:var(--vooki-app-text-strong)] truncate flex items-center gap-1">YouTube <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                        <p className="text-[11px] font-medium text-[color:var(--vooki-app-text-subtle)] uppercase tracking-wider truncate">Subscribers</p>
                      </div>
                    </div>
                    <span className="text-lg font-black tracking-tight text-[color:var(--vooki-app-text-strong)] shrink-0">
                      {formatCompact(profile.influencerProfile?.statsConnection?.youtube?.subscribers || 0)}
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* Audience Demographics (Conditional) */}
            <div className="rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)]">Audience</h3>
                {profile.audienceDemographics && profile.audienceDemographics.genderSplit && Object.keys(profile.audienceDemographics.genderSplit).length > 0 && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px]">Verified Data</Badge>
                )}
              </div>
              
              {(!profile.audienceDemographics || !profile.audienceDemographics.genderSplit || Object.keys(profile.audienceDemographics.genderSplit).length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[color:var(--vooki-app-surface-strong)]/30 rounded-2xl border border-dashed border-[color:var(--vooki-app-border-strong)]">
                  <div className="h-10 w-10 bg-[color:var(--vooki-app-surface-strong)] rounded-full flex items-center justify-center mb-3">
                    <Lock className="w-5 h-5 text-[color:var(--vooki-app-text-subtle)]" />
                  </div>
                  <h4 className="text-sm font-bold text-[color:var(--vooki-app-text-strong)] mb-1">Data Unavailable</h4>
                  <p className="text-xs text-[color:var(--vooki-app-text-soft)]">The creator has not granted permission to access authenticated demographic data.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Gender */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-[color:var(--vooki-app-text-strong)]">Gender Split</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-[color:var(--vooki-app-surface-strong)] flex overflow-hidden">
                      <div className="h-full bg-pink-500" style={{ width: `${profile.audienceDemographics?.genderSplit?.female || 50}%` }} />
                      <div className="h-full bg-blue-500" style={{ width: `${profile.audienceDemographics?.genderSplit?.male || 50}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-bold">
                      <span className="text-pink-500">{profile.audienceDemographics?.genderSplit?.female || 50}% F</span>
                      <span className="text-blue-500">{profile.audienceDemographics?.genderSplit?.male || 50}% M</span>
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-[color:var(--vooki-app-text-strong)]">Top Age Bracket</span>
                      <span className="font-bold text-[color:var(--vooki-app-text-strong)]">{profile.audienceDemographics?.topAgeBracket || "N/A"}</span>
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-[color:var(--vooki-app-text-strong)]">Top Location</span>
                      <span className="font-bold text-[color:var(--vooki-app-text-strong)] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[color:var(--vooki-app-text-soft)]" />
                        {profile.audienceDemographics?.topLocation || "Global"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section: Tabbed Content */}
          <div className="mt-10">
            <div className="flex items-center gap-6 border-b border-[color:var(--vooki-app-border-strong)] mb-6 overflow-x-auto">
              <button 
                onClick={() => setActiveTab("content")} 
                className={`pb-4 text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'content' ? 'border-b-2 border-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-text-strong)]' : 'border-b-2 border-transparent text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)]'}`}
              >
                <Grid className="w-4 h-4" />
                Recent Content
              </button>
              <button 
                onClick={() => setActiveTab("collabs")} 
                className={`pb-4 text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'collabs' ? 'border-b-2 border-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-text-strong)]' : 'border-b-2 border-transparent text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)]'}`}
              >
                <Briefcase className="w-4 h-4" />
                Past Collaborations
              </button>
            </div>

            {/* Tab Panels */}
            {activeTab === "content" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {(!profile.recentContent || profile.recentContent.length === 0) ? (
                   <div className="py-20 rounded-3xl border border-dashed border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-card)] text-center flex flex-col items-center">
                    <Grid className="w-10 h-10 text-[color:var(--vooki-app-text-subtle)] mb-4" />
                    <h3 className="text-lg font-bold text-[color:var(--vooki-app-text-strong)]">No Content Available</h3>
                    <p className="text-sm text-[color:var(--vooki-app-text-soft)]">This creator has not synced recent media.</p>
                   </div>
                ) : (
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                    {profile.recentContent.map((imgUrl, idx) => (
                      <div key={idx} className="group relative overflow-hidden rounded-3xl break-inside-avoid shadow-sm hover:shadow-md transition-all border border-[color:var(--vooki-app-border)]">
                        <div className="absolute inset-0 bg-[color:var(--vooki-app-surface-strong)] animate-pulse" />
                        <Image 
                          src={imgUrl} 
                          alt={`Recent content from ${profile.name}`}
                          width={400}
                          height={idx % 3 === 0 ? 500 : 350} 
                          className="relative z-10 w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                          unoptimized
                        />
                        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "collabs" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {(!profile.pastCollaborations || profile.pastCollaborations.length === 0) ? (
                   <div className="py-20 rounded-3xl border border-dashed border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-card)] text-center flex flex-col items-center">
                    <Briefcase className="w-10 h-10 text-[color:var(--vooki-app-text-subtle)] mb-4" />
                    <h3 className="text-lg font-bold text-[color:var(--vooki-app-text-strong)]">No Past Collaborations</h3>
                    <p className="text-sm text-[color:var(--vooki-app-text-soft)]">No brand collaborations have been listed.</p>
                   </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {profile.pastCollaborations.map(brand => (
                      <Badge key={brand} variant="secondary" className="bg-[color:var(--vooki-app-surface-card)] text-[color:var(--vooki-app-text-strong)] border border-[color:var(--vooki-app-border-strong)] px-4 py-2 text-sm font-bold shadow-sm">
                        {brand}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
