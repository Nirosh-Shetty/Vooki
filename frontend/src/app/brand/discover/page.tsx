"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowUpRight,
  Bookmark,
  BookmarkPlus,
  Filter,
  MapPin,
  Search,
  Sparkles,
  Users,
  Send,
  Loader2,
  Trash2,
  Instagram,
  Youtube
} from "lucide-react"
import { CreateInviteModal } from "@/components/collaboration/CreateInviteModal"

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
  status: "pending" | "accepted" | "rejected" | "expired"
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

// const seedCreators: Creator[] = [
//   {
//     id: "seed_1",
//     name: "Mina Styles",
//     handle: "@minastyles",
//     niche: "Fashion + Lifestyle",
//     location: "Los Angeles, CA",
//     followers: 182000,
//     engagementRate: 7.8,
//     avgViews: 96000,
//     estCpv: 0.05,
//     fitScore: 92,
//     tags: ["Reels", "UGC", "Product Styling"],
//     verified: true,
//   },
//   {
//     id: "seed_2",
//     name: "Noah Tech",
//     handle: "@noahbytes",
//     niche: "Consumer Tech",
//     location: "Austin, TX",
//     followers: 128000,
//     engagementRate: 6.1,
//     avgViews: 84000,
//     estCpv: 0.04,
//     fitScore: 88,
//     tags: ["YouTube Shorts", "Reviews", "Tutorials"],
//     verified: true,
//   },
// ]

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
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Inviting State
  const [sentInvites, setSentInvites] = useState<SentInvite[]>([])
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([])
  const [inviteBusyIds, setInviteBusyIds] = useState<string[]>([])
  const [inviteCampaignId, setInviteCampaignId] = useState("")

  const [shortlistBusyIds, setShortlistBusyIds] = useState<string[]>([])
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const fetchSentInvites = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites?status=all&limit=50`, {
        credentials: "include",
      })
      if (!response.ok) return
      const data: SentInviteResponse = await response.json()
      setSentInvites(Array.isArray(data.items) ? data.items : [])
    } catch {
      // Keep UI functional
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

        if (!response.ok) throw new Error("Failed to fetch")
        const data: DiscoverResponse = await response.json()
        setCreators(data.items)
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError("Showing preview data. Live discover endpoint is not available yet.")
        setCreators([])
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(load, 300)
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
          setShortlist(data.influencerIds.map((v: string) => String(v)))
        }
      } catch { }
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
        setCampaigns(Array.isArray(data.items) ? data.items : [])
      } catch { }
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

  const toggleShortlist = async (creatorId: string) => {
    const isSaved = shortlist.includes(creatorId)
    setShortlistBusyIds((prev) => [...prev, creatorId])
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
      if (!response.ok) throw new Error("Failed to update shortlist")
      setShortlist((prev) =>
        isSaved ? prev.filter((id) => id !== creatorId) : Array.from(new Set([...prev, creatorId]))
      )
    } catch {
      setShortlist((prev) =>
        isSaved ? prev.filter((id) => id !== creatorId) : Array.from(new Set([...prev, creatorId]))
      )
    } finally {
      setShortlistBusyIds((prev) => prev.filter((id) => id !== creatorId))
    }
  }

  const sendInvites = async (targetId: string) => {
    if (!inviteCampaignId) {
      alert("Please select a target campaign from the dropdown in the header first.")
      return
    }
    const idsToInvite = targetId === "bulk" ? shortlist : [targetId]
    if (!idsToInvite.length) return

    setInviteBusyIds((prev) => [...prev, targetId])
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          influencerIds: idsToInvite,
          campaignId: inviteCampaignId,
          campaignLabel: campaigns.find((c) => c.id === inviteCampaignId)?.name || "Campaign",
          note: "Invitation sent from Discover",
        }),
      })
      if (!response.ok) throw new Error("Failed to send invites")
      await fetchSentInvites()
      if (targetId === "bulk") {
        alert("Bulk invites sent successfully!")
      } else {
        alert("Invite sent successfully!")
      }
    } catch {
      alert("Failed to send invites")
    } finally {
      setInviteBusyIds((prev) => prev.filter((id) => id !== targetId))
    }
  }

  const shortlistedCreators = creators.filter((c) => shortlist.includes(c.id))

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">

      {/* 1. Sleek Search & Filter Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
        <div className="flex-1 w-full max-w-2xl">
          {/* <h1 className="text-3xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)] flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[color:var(--vooki-accent)]" /> Discover Creators
          </h1> */}

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--vooki-app-text-soft)]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, handle, or niche..."
                className="h-11 rounded-full border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] pl-11 text-sm text-[color:var(--vooki-app-text-strong)] focus-visible:ring-[color:var(--vooki-accent)]"
              />
            </div>

            <div className="w-full sm:w-64 shrink-0">
              <Select
                value={inviteCampaignId}
                onValueChange={setInviteCampaignId}
              >
                <SelectTrigger className="h-11 w-full rounded-full border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] text-sm font-medium text-[color:var(--vooki-app-text-strong)] focus:ring-[color:var(--vooki-accent)]">
                  <SelectValue placeholder="Select Target Campaign..." />
                </SelectTrigger>
                <SelectContent className="border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] text-[color:var(--vooki-app-text-strong)] shadow-2xl rounded-2xl">
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" className="h-11 rounded-full border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)]">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>

          {/* Saved Creators Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-11 rounded-full bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border)] text-[color:var(--vooki-app-text-strong)] hover:border-[color:var(--vooki-accent)] hover:text-[color:var(--vooki-accent)] shadow-sm relative pr-5">
                <Bookmark className="mr-2 h-4 w-4" />
                Saved
                {shortlist.length > 0 && (
                  <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[color:var(--vooki-accent)] px-1.5 text-[10px] font-bold text-[color:var(--vooki-accent-text)]">
                    {shortlist.length}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-[color:var(--vooki-app-surface)] border-[color:var(--vooki-app-border)] text-[color:var(--vooki-app-text-strong)] shadow-[var(--vooki-shadow-card)]">
              <DialogHeader>
                <DialogTitle>Saved Creators ({shortlist.length})</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3 mt-4">
                {shortlistedCreators.length === 0 ? (
                  <div className="text-center py-8 opacity-50">
                    <Bookmark className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No creators saved yet.</p>
                  </div>
                ) : (
                  shortlistedCreators.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)]">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[color:var(--vooki-violet)] to-[color:var(--vooki-accent)] flex items-center justify-center font-bold text-white text-sm">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{c.name}</p>
                          <p className="text-xs text-[color:var(--vooki-app-text-soft)]">{c.handle}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => toggleShortlist(c.id)} className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              {shortlistedCreators.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[color:var(--vooki-app-border-strong)] flex flex-col gap-2">
                  <Button
                    onClick={() => sendInvites("bulk")}
                    disabled={inviteBusyIds.includes("bulk") || !inviteCampaignId}
                    className="w-full h-11 rounded-full bg-[color:var(--vooki-accent)] text-[color:var(--vooki-accent-text)] hover:bg-[color:var(--vooki-accent-strong)] shadow-[var(--vooki-shadow-accent)]"
                  >
                    {inviteBusyIds.includes("bulk") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Bulk Invite ({shortlist.length})
                  </Button>
                  {!inviteCampaignId && <p className="text-[10px] text-center text-amber-500">Select a campaign in the top bar first</p>}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-2 hide-scrollbar">
        {nicheFilters.map((niche) => (
          <button
            key={niche}
            onClick={() => setActiveNiche(niche)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${activeNiche === niche
              ? "border-transparent bg-[color:var(--vooki-accent)] text-[color:var(--vooki-accent-text)] shadow-sm"
              : "border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-strong)]"
              }`}
          >
            {niche}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-amber-500 font-medium bg-amber-500/10 px-4 py-2 rounded-lg inline-block">{error}</p> : null}

      {/* 2. Creator Cards Grid (1-Column Sleek List) */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[color:var(--vooki-accent)]" />
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[color:var(--vooki-app-border)] p-12 text-center bg-[color:var(--vooki-app-surface-strong)]/50">
            <Users className="h-10 w-10 mx-auto text-[color:var(--vooki-app-text-soft)] opacity-50 mb-3" />
            <p className="text-[color:var(--vooki-app-text-strong)] font-medium text-lg">No creators found</p>
            <p className="text-sm mt-1 text-[color:var(--vooki-app-text-soft)]">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          filteredCreators.map((creator) => {
            const saved = shortlist.includes(creator.id)
            const isSaving = shortlistBusyIds.includes(creator.id)
            const hasPendingInvite = sentInvites.some((invite) => invite.influencerId === creator.id && invite.status === "pending")

            return (
              <div
                key={creator.id}
                className="group relative flex flex-col gap-4 rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-5 transition-all hover:border-[color:var(--vooki-accent)] hover:shadow-[var(--vooki-shadow-app)]"
              >
                {/* Top Row: Identity & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">

                  {/* Creator Identity */}
                  <div className="flex items-center gap-4 min-w-0">
                    <Link href={`/brand/discover/${creator.id}`} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-[color:var(--vooki-accent)] text-xl font-bold text-[color:var(--vooki-accent-text)] shadow-inner transition-transform hover:scale-105">
                      {creator.name.charAt(0)}
                    </Link>
                    <div className="min-w-0">
                      <Link href={`/brand/discover/${creator.id}`} className="group-hover:text-[color:var(--vooki-accent)] transition-colors inline-block">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-[color:var(--vooki-app-text-strong)] truncate">
                            {creator.name}
                          </h3>
                          {creator.verified && (
                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[color:var(--vooki-accent)]" />
                          )}
                        </div>
                        {creator.handle.replace(/^@/, "") !== creator.name && (
                          <p className="text-xs font-medium text-[color:var(--vooki-app-text-soft)] truncate">{creator.handle}</p>
                        )}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[color:var(--vooki-app-text-subtle)]">
                        <span>{creator.niche}</span>
                        <span className="w-1 h-1 shrink-0 rounded-full bg-[color:var(--vooki-app-border-strong)]" />
                        <span className="flex items-center whitespace-nowrap"><MapPin className="mr-1 h-3 w-3" /> {creator.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0 sm:self-center border-t border-[color:var(--vooki-app-border)] pt-4 sm:border-0 sm:pt-0">
                    <div className="flex items-center gap-2 mr-1 sm:mr-3">
                      <span className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider font-semibold">Fit Score</span>
                      <Badge className="bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-app-text-strong)] border-[color:var(--vooki-accent-border)] font-bold">
                        {creator.fitScore}%
                      </Badge>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleShortlist(creator.id)}
                      disabled={isSaving}
                      className={`h-9 w-9 rounded-full transition-colors ${saved
                        ? "bg-[color:var(--vooki-accent)] text-[color:var(--vooki-accent-text)] hover:bg-[color:var(--vooki-accent-strong)] shadow-[var(--vooki-shadow-accent)]"
                        : "bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-soft)] border border-[color:var(--vooki-app-border)] hover:text-[color:var(--vooki-app-text-strong)] hover:border-[color:var(--vooki-accent)]"
                        }`}
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Bookmark className="h-4 w-4 fill-current" /> : <BookmarkPlus className="h-4 w-4" />}
                    </Button>

                    <CreateInviteModal
                      campaignId={inviteCampaignId}
                      campaignName={campaigns.find((c) => c.id === inviteCampaignId)?.name || ""}
                      preselectedInfluencerId={creator.id}
                      onSuccess={fetchSentInvites}
                      trigger={
                        <Button
                          disabled={hasPendingInvite || !inviteCampaignId}
                          className="h-9 rounded-full bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] shadow-sm px-5 text-sm font-semibold"
                        >
                          {hasPendingInvite ? "Pending" : "Invite"}
                        </Button>
                      }
                    />
                  </div>
                </div>

                {/* Bottom Row: Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 rounded-2xl bg-[color:var(--vooki-app-surface-strong)]/30 p-4 border border-[color:var(--vooki-app-border)]/50 mt-1">
                  <div className="flex flex-col gap-1 shrink-0">
                    <span className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider font-semibold">Platforms</span>
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-500 opacity-80" />
                      <Youtube className="h-4 w-4 text-red-500 opacity-80" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 sm:gap-6 flex-1 w-full">
                    <div>
                      <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider font-semibold mb-0.5">Audience</p>
                      <p className="font-bold text-base text-[color:var(--vooki-app-text-strong)]">{creator.followers > 0 ? formatCompact(creator.followers) : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider font-semibold mb-0.5">Engage</p>
                      <p className="font-bold text-base text-emerald-500">{creator.engagementRate > 0 ? `${creator.engagementRate}%` : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider font-semibold mb-0.5">Avg Views</p>
                      <p className="font-bold text-base text-[color:var(--vooki-app-text-strong)]">{creator.avgViews > 0 ? formatCompact(creator.avgViews) : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[color:var(--vooki-app-text-soft)] uppercase tracking-wider font-semibold mb-0.5">Est CPV</p>
                      <p className="font-bold text-base text-[color:var(--vooki-app-text-strong)]">{creator.avgViews > 0 && creator.estCpv > 0 ? `$${creator.estCpv.toFixed(2)}` : "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
