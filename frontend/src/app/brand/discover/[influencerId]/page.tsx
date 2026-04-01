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
} from "lucide-react"

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
    if (!influencerId || isPreviewProfile || !selectedCampaignId) {
      setInviteStatus(null)
      return
    }

    const controller = new AbortController()

    const loadInviteStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/invites?status=all&limit=50`,
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
            String(item?.influencerId) === String(influencerId) &&
            String(item?.campaignId) === String(selectedCampaignId)
        )
        setInviteStatus(currentInvite?.status || null)
      } catch {
        setInviteStatus(null)
      }
    }

    loadInviteStatus()
    return () => controller.abort()
  }, [influencerId, isPreviewProfile, selectedCampaignId])

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

  const sendInvite = async () => {
    if (!profile || !influencerId) return

    if (isPreviewProfile) {
      setActionMessage("Preview profile cannot receive live invites.")
      return
    }

    if (inviteStatus === "pending") {
      setActionMessage("Invite already pending for this creator.")
      return
    }
    if (!selectedCampaignId) {
      setActionMessage("Select a campaign before sending invite.")
      return
    }

    setInviteBusy(true)
    setActionMessage(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          influencerIds: [influencerId],
          campaignId: selectedCampaignId,
          campaignLabel:
            campaigns.find((campaign) => campaign.id === selectedCampaignId)?.name || "Profile Outreach",
          note: `Invite sent from profile view (${profile.handle || profile.name}).`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send invite")
      }

      const data = await response.json()
      const created = Array.isArray(data?.created) ? data.created : []
      const skipped = Array.isArray(data?.skipped) ? data.skipped : []

      if (created.length > 0) {
        setInviteStatus("pending")
        setActionMessage("Invite sent successfully.")
        return
      }

      if (skipped.length > 0) {
        setActionMessage("Invite already exists or creator is not eligible.")
        return
      }

      setActionMessage("Invite request processed.")
    } catch {
      setActionMessage("Could not send invite right now.")
    } finally {
      setInviteBusy(false)
    }
  }

  const socialEntries = useMemo(
    () => Object.entries(profile?.socialLinks || {}).filter(([, value]) => Boolean(value)),
    [profile?.socialLinks]
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
          <Link href="/brand/discover">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to discover
          </Link>
        </Button>
      </div>

      {loading ? (
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-6 text-sm text-slate-600 dark:text-slate-300">Loading profile...</CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-6 text-sm text-rose-600 dark:text-rose-300">{error}</CardContent>
        </Card>
      ) : null}
      {actionMessage ? (
        <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardContent className="p-4 text-sm text-emerald-700 dark:text-emerald-300">{actionMessage}</CardContent>
        </Card>
      ) : null}

      {!loading && profile ? (
        <>
          <Card className="border-white/60 bg-white/85 shadow-xl shadow-cyan-100/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-cyan-900/10">
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-lg font-semibold text-white">
                    {profile.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        {profile.name}
                      </h1>
                      {profile.verified ? (
                        <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          Verified
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{profile.handle}</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{profile.niche}</p>
                    <p className="mt-1 inline-flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="mr-1 h-3.5 w-3.5" />
                      Location data not provided
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedCampaignId}
                    onChange={(event) => setSelectedCampaignId(event.target.value)}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select campaign</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={sendInvite}
                    disabled={inviteBusy || inviteStatus === "pending"}
                    className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                  >
                    <HeartHandshake className="mr-2 h-4 w-4" />
                    {inviteStatus === "pending"
                      ? "Invite pending"
                      : inviteBusy
                        ? "Sending invite..."
                        : inviteStatus === "accepted" || inviteStatus === "rejected" || inviteStatus === "expired"
                          ? "Invite again"
                          : "Invite to campaign"}
                  </Button>
                  <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                    <Link href={`/brand/messages`}>
                      Message creator <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Followers</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCompact(profile.followers)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Engagement</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{profile.metrics.engagementRate}%</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Avg Views</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCompact(profile.metrics.avgViews)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Est CPV</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">${profile.metrics.estCpv.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Performance Snapshot</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Quick signals for collaboration fit and campaign outcome quality.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Fit score: <span className="font-semibold">{profile.metrics.fitScore}%</span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <Star className="h-4 w-4 text-amber-500" />
                    Rating: <span className="font-semibold">{profile.rating.toFixed(1)}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({profile.totalReviews} reviews)
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {profile.highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-600" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Social Links</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Connected channels for this creator.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {socialEntries.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    No social links shared yet.
                  </div>
                ) : (
                  socialEntries.map(([platform, value]) => (
                    <a
                      key={platform}
                      href={value}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Globe className="h-4 w-4 text-cyan-600" />
                        {platform}
                      </span>
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ))
                )}
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  <div className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Audience data enrichment can be connected next.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}
