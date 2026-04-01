"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  ArrowUpRight,
  BookmarkPlus,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react"

type Creator = {
  id: string
  name: string
  handle: string
  niche: string
  location: string
  followers: number
  engagementRate: number
  avgViews: number
  estCpv: number
  fitScore: number
  tags: string[]
  verified: boolean
}

type DiscoverResponse = {
  items: Creator[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

type SentInvite = {
  id: string
  influencerId: string
  campaignId: string
  influencerName: string
  influencerHandle: string
  influencerNiche: string
  campaignLabel: string
  note: string
  status: "pending" | "accepted" | "rejected" | "expired"
  createdAt: string
}

type SentInviteResponse = {
  items: SentInvite[]
}

type CampaignOption = {
  id: string
  name: string
}

type CampaignListResponse = {
  items?: CampaignOption[]
}

const seedCreators: Creator[] = [
  {
    id: "seed_1",
    name: "Mina Styles",
    handle: "@minastyles",
    niche: "Fashion + Lifestyle",
    location: "Los Angeles, CA",
    followers: 182000,
    engagementRate: 7.8,
    avgViews: 96000,
    estCpv: 0.05,
    fitScore: 92,
    tags: ["Reels", "UGC", "Product Styling"],
    verified: true,
  },
  {
    id: "seed_2",
    name: "Noah Tech",
    handle: "@noahbytes",
    niche: "Consumer Tech",
    location: "Austin, TX",
    followers: 128000,
    engagementRate: 6.1,
    avgViews: 84000,
    estCpv: 0.04,
    fitScore: 88,
    tags: ["YouTube Shorts", "Reviews", "Tutorials"],
    verified: true,
  },
]

const nicheFilters = ["All", "Lifestyle", "Tech", "Wellness", "Beauty", "Fitness", "Finance"]

const formatCompact = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return `${value}`
}

export default function DiscoverPage() {
  const [search, setSearch] = useState("")
  const [activeNiche, setActiveNiche] = useState("All")
  const [shortlist, setShortlist] = useState<string[]>([])
  const [creators, setCreators] = useState<Creator[]>(seedCreators)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [shortlistBusyIds, setShortlistBusyIds] = useState<string[]>([])
  const [inviteBusy, setInviteBusy] = useState(false)
  const [sentInvites, setSentInvites] = useState<SentInvite[]>([])
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState("")

  const fetchSentInvites = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/invites?status=all&limit=50`, {
        credentials: "include",
      })
      if (!response.ok) return
      const data: SentInviteResponse = await response.json()
      setSentInvites(Array.isArray(data.items) ? data.items : [])
    } catch {
      // Keep UI functional without invite history.
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (search.trim()) params.set("q", search.trim())
        if (activeNiche !== "All") params.set("niche", activeNiche)
        params.set("limit", "24")

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/influencers?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch discover influencers (${response.status})`)
        }

        const data: DiscoverResponse = await response.json()
        setCreators(data.items)
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError("Showing preview data. Live discover endpoint is not available yet.")
        setCreators(seedCreators)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(load, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [search, activeNiche])

  useEffect(() => {
    const controller = new AbortController()

    const loadShortlist = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/shortlist`, {
          credentials: "include",
          signal: controller.signal,
        })

        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data.influencerIds)) {
          setShortlist(data.influencerIds.map((value: string) => String(value)))
        }
      } catch {
        // Keep local shortlist fallback.
      }
    }

    loadShortlist()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    fetchSentInvites()
  }, [fetchSentInvites])

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
          setSelectedCampaignId((previous) => previous || items[0].id)
        }
      } catch {
        // Keep discover usable without campaign list.
      }
    }

    loadCampaigns()
    return () => controller.abort()
  }, [])

  const filteredCreators = useMemo(() => {
    return creators.filter((creator) => {
      const matchesSearch =
        creator.name.toLowerCase().includes(search.toLowerCase()) ||
        creator.handle.toLowerCase().includes(search.toLowerCase()) ||
        creator.niche.toLowerCase().includes(search.toLowerCase())
      const matchesNiche = activeNiche === "All" || creator.niche.toLowerCase().includes(activeNiche.toLowerCase())
      return matchesSearch && matchesNiche
    })
  }, [creators, search, activeNiche])

  const inviteStatusByCampaignInfluencer = useMemo(() => {
    const map = new Map<string, SentInvite["status"]>()
    for (const invite of sentInvites) {
      const key = `${invite.campaignId}:${invite.influencerId}`
      if (!map.has(key)) {
        map.set(key, invite.status)
      }
    }
    return map
  }, [sentInvites])

  const toggleShortlist = async (creatorId: string) => {
    const isSaved = shortlist.includes(creatorId)
    setShortlistBusyIds((previous) => [...previous, creatorId])
    setActionMessage(null)

    try {
      const response = await fetch(
        isSaved
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/shortlist/${creatorId}`
          : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/shortlist`,
        {
          method: isSaved ? "DELETE" : "POST",
          headers: isSaved ? undefined : { "Content-Type": "application/json" },
          credentials: "include",
          body: isSaved ? undefined : JSON.stringify({ influencerId: creatorId }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update shortlist")
      }

      setShortlist((previous) =>
        isSaved ? previous.filter((id) => id !== creatorId) : Array.from(new Set([...previous, creatorId]))
      )
      setActionMessage(isSaved ? "Removed from shortlist." : "Added to shortlist.")
    } catch {
      // Fallback to local-only behavior so UI remains usable during integration.
      setShortlist((previous) =>
        isSaved ? previous.filter((id) => id !== creatorId) : Array.from(new Set([...previous, creatorId]))
      )
      setActionMessage("Saved locally. Backend sync unavailable.")
    } finally {
      setShortlistBusyIds((previous) => previous.filter((id) => id !== creatorId))
    }
  }

  const sendInvites = async (influencerIds: string[]) => {
    if (!influencerIds.length) return
    if (!selectedCampaignId) {
      setActionMessage("Select a campaign before sending invites.")
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
          influencerIds,
          campaignId: selectedCampaignId,
          campaignLabel: campaigns.find((campaign) => campaign.id === selectedCampaignId)?.name || "Discover Outreach",
          note: "Auto-generated from brand discover shortlist",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send invites")
      }

      const data = await response.json()
      const createdCount = Array.isArray(data.created) ? data.created.length : 0
      const skippedCount = Array.isArray(data.skipped) ? data.skipped.length : 0
      setActionMessage(
        `Invites sent: ${createdCount}${skippedCount ? `, skipped: ${skippedCount}` : ""}.`
      )
      await fetchSentInvites()
    } catch {
      setActionMessage("Could not send invites right now.")
    } finally {
      setInviteBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8">
      <Card className="border-white/60 bg-white/85 shadow-xl shadow-cyan-100/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-cyan-900/10">
        <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge className="border-0 bg-cyan-100 text-cyan-900 hover:bg-cyan-100 dark:bg-cyan-500/20 dark:text-cyan-300">
                <Sparkles className="mr-1 h-3.5 w-3.5" /> Discover Creators
              </Badge>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                Find Influencers That Match Campaign ROI
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                Search creators by niche, engagement quality, and estimated cost-per-view fit.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Advanced filters
              </Button>
              <Button
                disabled={!shortlist.length || inviteBusy}
                onClick={() => sendInvites(shortlist)}
                className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-cyan-600 dark:hover:bg-cyan-700"
              >
                <Users className="mr-2 h-4 w-4" /> Build shortlist
              </Button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by creator name, handle, or niche"
                className="h-11 border-slate-300 bg-white pl-10 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <Button variant="outline" className="h-11 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              <Filter className="mr-2 h-4 w-4" /> Quick filter
            </Button>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <select
              value={selectedCampaignId}
              onChange={(event) => setSelectedCampaignId(event.target.value)}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Select campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
            <Button asChild variant="outline" className="h-11 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              <Link href="/brand/campaigns/new">Create campaign</Link>
            </Button>
          </div>

          {error ? <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p> : null}
          {actionMessage ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{actionMessage}</p> : null}

          <div className="flex flex-wrap gap-2">
            {nicheFilters.map((niche) => (
              <button
                key={niche}
                onClick={() => setActiveNiche(niche)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeNiche === niche
                    ? "border-cyan-300 bg-cyan-100 text-cyan-900 dark:border-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {niche}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {loading ? (
            <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
              <CardContent className="p-5 text-sm text-slate-600 dark:text-slate-300">Loading discover results...</CardContent>
            </Card>
          ) : null}

          {!loading && filteredCreators.length === 0 ? (
            <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
              <CardContent className="p-5 text-sm text-slate-600 dark:text-slate-300">
                No creators matched these filters yet.
              </CardContent>
            </Card>
          ) : null}

          {filteredCreators.map((creator) => {
            const saved = shortlist.includes(creator.id)
            const inviteStatus = selectedCampaignId
              ? inviteStatusByCampaignInfluencer.get(`${selectedCampaignId}:${creator.id}`)
              : undefined
            return (
              <Card key={creator.id} className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-sm font-semibold text-white">
                        {creator.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{creator.name}</h3>
                          {creator.verified ? (
                            <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300">
                              Verified
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{creator.handle}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{creator.niche}</p>
                        <p className="mt-1 inline-flex items-center text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="mr-1 h-3.5 w-3.5" />
                          {creator.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300">
                        Fit {creator.fitScore}%
                      </Badge>
                      {inviteStatus ? (
                        <Badge
                          className={`border-0 ${
                            inviteStatus === "pending"
                              ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300"
                              : inviteStatus === "accepted"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                : inviteStatus === "rejected"
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                                  : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {inviteStatus}
                        </Badge>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={shortlistBusyIds.includes(creator.id)}
                        onClick={() => toggleShortlist(creator.id)}
                        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <BookmarkPlus className="mr-2 h-4 w-4" />
                        {shortlistBusyIds.includes(creator.id) ? "Saving..." : saved ? "Saved" : "Shortlist"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Followers</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCompact(creator.followers)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Engagement</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{creator.engagementRate}%</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Avg Views</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCompact(creator.avgViews)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Est CPV</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">${creator.estCpv.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {creator.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={inviteBusy || inviteStatus === "pending"}
                      onClick={() => {
                        if (inviteStatus === "pending") return
                        sendInvites([creator.id])
                      }}
                      className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                    >
                      {inviteStatus === "pending"
                        ? "Invite sent"
                        : inviteStatus === "accepted"
                          ? "Invite again"
                          : inviteStatus === "rejected" || inviteStatus === "expired"
                            ? "Re-invite"
                            : "Invite to campaign"}
                    </Button>
                    <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                      <Link href={`/brand/discover/${creator.id}`}>
                        View profile <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="h-fit border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Shortlist</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Creators saved for this campaign round.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-900 dark:text-slate-100">{shortlist.length} creators shortlisted</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use shortlist to bulk-invite once backend shortlist APIs are added.</p>
            </div>
            {filteredCreators
              .filter((creator) => shortlist.includes(creator.id))
              .map((creator) => (
                <div key={creator.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{creator.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{creator.handle}</p>
                    </div>
                    <button onClick={() => toggleShortlist(creator.id)} className="text-xs text-rose-600 dark:text-rose-400">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Estimated campaign fit: <span className="font-semibold">87%</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                Based on engagement and niche relevance.
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Recent invites</p>
              <div className="mt-2 space-y-2">
                {sentInvites.slice(0, 5).map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="text-slate-700 dark:text-slate-300">{invite.influencerName}</p>
                      <p className="text-slate-500 dark:text-slate-400">{invite.influencerHandle}</p>
                    </div>
                    <Badge
                      className={`border-0 ${
                        invite.status === "pending"
                          ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300"
                          : invite.status === "accepted"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : invite.status === "rejected"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {invite.status}
                    </Badge>
                  </div>
                ))}
                {sentInvites.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No invites sent yet.</p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
