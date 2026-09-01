"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  MessageSquare,
  MoreVertical,
  Users,
  Activity,
  Heart,
  Send,
  Briefcase,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Star,
  CheckCircle2,
  Trash2,
  BookmarkCheck,
} from "lucide-react"

// Types
export type NetworkStatus = "shortlisted" | "invited" | "active"

export interface NetworkInfluencer {
  id: string
  name: string
  handle: string
  avatar: string
  niche: string
  location?: string
  followers: number
  engagement: number
  rating?: number
  totalReviews?: number
  status: NetworkStatus
  isShortlisted?: boolean
  hasActiveCollab?: boolean
  hasPendingInvite?: boolean
  campaignName?: string
  campaignId?: string
  promotionId?: string
  inviteId?: string
  conversationId?: string
  lastActive: string
  performanceLabel?: string
  totalCollaborations?: number
}

interface NetworkSummary {
  allCount: number
  activeCount: number
  invitedCount: number
  shortlistedCount: number
}

interface NetworkApiResponse {
  items: NetworkInfluencer[]
  summary: NetworkSummary
}

const formatCompact = (value: number) => {
  if (!value || isNaN(value)) return "0"
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return `${value}`
}

const formatRelativeTime = (isoString: string) => {
  if (!isoString) return "Recently"
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return "Recently"
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

export default function MyNetworkPage() {
  const [network, setNetwork] = useState<NetworkInfluencer[]>([])
  const [summary, setSummary] = useState<NetworkSummary>({
    allCount: 0,
    activeCount: 0,
    invitedCount: 0,
    shortlistedCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<NetworkStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activePerformanceFilter, setActivePerformanceFilter] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchNetwork = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/network`,
        {
          credentials: "include",
          signal,
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch network (${response.status})`)
      }

      const data: NetworkApiResponse = await response.json()
      setNetwork(Array.isArray(data.items) ? data.items : [])
      if (data.summary) {
        setSummary(data.summary)
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return
      console.error("Error loading network data:", err)
      setError("Unable to load live network data. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchNetwork(controller.signal)
    return () => controller.abort()
  }, [fetchNetwork])

  // Shortlist toggle handler
  const handleToggleShortlist = async (influencer: NetworkInfluencer) => {
    try {
      setActionLoadingId(influencer.id)
      const isCurrentlyShortlisted = Boolean(influencer.isShortlisted)

      if (isCurrentlyShortlisted) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/shortlist/${influencer.id}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        )
        if (!res.ok) throw new Error("Failed to remove from shortlist")

        setNetwork((prev) =>
          prev
            .map((item) => {
              if (item.id === influencer.id) {
                const isStillInNetwork = item.hasActiveCollab || item.hasPendingInvite
                if (!isStillInNetwork) return null
                return {
                  ...item,
                  isShortlisted: false,
                  status: item.hasActiveCollab ? "active" : item.hasPendingInvite ? "invited" : "shortlisted",
                }
              }
              return item
            })
            .filter((item): item is NetworkInfluencer => item !== null)
        )
        setSummary((prev) => ({
          ...prev,
          shortlistedCount: Math.max(0, prev.shortlistedCount - 1),
          allCount:
            !influencer.hasActiveCollab && !influencer.hasPendingInvite
              ? Math.max(0, prev.allCount - 1)
              : prev.allCount,
        }))
      } else {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/shortlist`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ influencerId: influencer.id }),
          }
        )
        if (!res.ok) throw new Error("Failed to add to shortlist")

        setNetwork((prev) =>
          prev.map((item) =>
            item.id === influencer.id
              ? { ...item, isShortlisted: true }
              : item
          )
        )
        setSummary((prev) => ({
          ...prev,
          shortlistedCount: prev.shortlistedCount + 1,
        }))
      }
    } catch (err) {
      console.error("Error updating shortlist status:", err)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filter Network
  const filteredNetwork = network.filter((influencer) => {
    let matchesTab = true
    if (activeTab === "active") {
      matchesTab = influencer.status === "active" || Boolean(influencer.hasActiveCollab)
    } else if (activeTab === "invited") {
      matchesTab = influencer.status === "invited" || Boolean(influencer.hasPendingInvite)
    } else if (activeTab === "shortlisted") {
      matchesTab = influencer.status === "shortlisted" || Boolean(influencer.isShortlisted)
    }

    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      influencer.name.toLowerCase().includes(q) ||
      influencer.handle.toLowerCase().includes(q) ||
      influencer.niche.toLowerCase().includes(q) ||
      (influencer.campaignName && influencer.campaignName.toLowerCase().includes(q))

    const matchesPerformance =
      !activePerformanceFilter || influencer.performanceLabel === activePerformanceFilter

    return matchesTab && matchesSearch && matchesPerformance
  })

  const tabs = [
    { id: "all", label: "All Network", icon: Users, count: summary.allCount },
    { id: "active", label: "Active Collaborators", icon: Briefcase, count: summary.activeCount },
    { id: "invited", label: "Pending Invites", icon: Send, count: summary.invitedCount },
    { id: "shortlisted", label: "Shortlisted", icon: Heart, count: summary.shortlistedCount },
  ] as const

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 pb-12">
      {/* Header Area */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-[color:var(--vooki-app-text-strong)]">
              My Network
            </h1>
          </div>
          <p className="mt-2 text-sm text-[color:var(--vooki-app-text-soft)]">
            Manage your creator relationships, track ongoing campaigns, and review shortlisted talent.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchNetwork()}
            disabled={loading}
            className="h-11 w-11 rounded-xl border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)]"
            title="Refresh network"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            asChild
            className="h-11 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] font-bold shadow-md hover:-translate-y-0.5 transition-all"
          >
            <Link href="/brand/discover">
              <Search className="mr-2 h-4 w-4" />
              Discover New Creators
            </Link>
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
          <p className="font-medium">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchNetwork()}
            className="rounded-lg h-8 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Toolbar (Tabs & Search) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl bg-[color:var(--vooki-app-surface-card)] p-2 shadow-sm border border-[color:var(--vooki-app-border)]">
        <div className="flex flex-wrap items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] shadow-sm"
                    : "text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-strong)]/50 hover:text-[color:var(--vooki-app-text-strong)]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-[color:var(--vooki-accent)]" : ""}`}
                />
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? "bg-[color:var(--vooki-app-bg)] text-[color:var(--vooki-app-text-strong)]"
                      : "bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-subtle)]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full md:w-80 px-2 pb-2 md:px-0 md:pb-0 md:pr-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--vooki-app-text-subtle)]" />
          <Input
            placeholder="Search by name, handle, niche, or campaign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 h-10 bg-[color:var(--vooki-app-bg)] border-[color:var(--vooki-app-border-strong)] rounded-xl text-sm font-medium focus-visible:ring-1 focus-visible:ring-[color:var(--vooki-accent)]"
          />
        </div>
      </div>

      {/* Performance Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-[color:var(--vooki-app-text-soft)] mr-2 flex items-center gap-1.5">
          Past Performance:
        </span>
        {["Top Performer", "High ROI", "High Engagement"].map((label) => (
          <Badge
            key={label}
            variant="outline"
            className={`cursor-pointer px-3 py-1.5 text-xs font-bold transition-all rounded-lg ${
              activePerformanceFilter === label
                ? "bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] border-transparent shadow-sm"
                : "bg-[color:var(--vooki-app-surface-card)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)]"
            }`}
            onClick={() =>
              setActivePerformanceFilter((prev) => (prev === label ? null : label))
            }
          >
            {label}
          </Badge>
        ))}
      </div>

      {/* Loading Skeleton Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="flex flex-col rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 animate-pulse space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-[1.25rem] bg-[color:var(--vooki-app-surface-strong)]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-[color:var(--vooki-app-surface-strong)] rounded" />
                  <div className="h-3 w-16 bg-[color:var(--vooki-app-surface-strong)] rounded" />
                </div>
              </div>
              <div className="h-5 w-24 bg-[color:var(--vooki-app-surface-strong)] rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-14 bg-[color:var(--vooki-app-surface-strong)] rounded-xl" />
                <div className="h-14 bg-[color:var(--vooki-app-surface-strong)] rounded-xl" />
              </div>
              <div className="h-10 bg-[color:var(--vooki-app-surface-strong)] rounded-xl mt-auto" />
            </div>
          ))}
        </div>
      ) : filteredNetwork.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl border border-dashed border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-card)] text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-subtle)]">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-[color:var(--vooki-app-text-strong)]">
            {searchQuery || activePerformanceFilter
              ? "No creators match your filters"
              : activeTab === "active"
              ? "No active collaborators yet"
              : activeTab === "invited"
              ? "No pending invites"
              : activeTab === "shortlisted"
              ? "No shortlisted creators yet"
              : "Your network is empty"}
          </h3>
          <p className="mt-2 text-sm text-[color:var(--vooki-app-text-soft)] max-w-sm mx-auto">
            {searchQuery || activePerformanceFilter
              ? "Try adjusting your search keywords or resetting your performance filter."
              : activeTab === "active"
              ? "Send collaboration invites from Discover or your campaigns to start working together."
              : activeTab === "invited"
              ? "Explore creator profiles and invite them to your brand campaigns."
              : activeTab === "shortlisted"
              ? "Shortlist creators while browsing the Discover feed to save them for upcoming campaigns."
              : "Find top creators across Instagram, YouTube, and Facebook to build your network."}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {searchQuery || activePerformanceFilter ? (
              <Button
                variant="outline"
                className="rounded-xl font-bold"
                onClick={() => {
                  setSearchQuery("")
                  setActivePerformanceFilter(null)
                  setActiveTab("all")
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button asChild className="rounded-xl font-bold bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)]">
                <Link href="/brand/discover">
                  <Search className="mr-2 h-4 w-4" />
                  Discover Creators
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Network Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNetwork.map((influencer) => (
            <div
              key={influencer.id}
              className="group relative flex flex-col rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-[color:var(--vooki-app-border-strong)]"
            >
              {/* Header: Avatar, Name, Handle, Menu */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3.5">
                  <Avatar className="h-14 w-14 rounded-[1.25rem] border border-[color:var(--vooki-app-border-strong)] shadow-inner">
                    <AvatarImage src={influencer.avatar} alt={influencer.name} />
                    <AvatarFallback className="rounded-[1.25rem] bg-gradient-to-br from-[color:var(--vooki-app-surface-strong)] to-[color:var(--vooki-app-surface-card)] text-xl font-black text-[color:var(--vooki-app-text-strong)]">
                      {influencer.name ? influencer.name.charAt(0).toUpperCase() : "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-[color:var(--vooki-app-text-strong)] leading-tight truncate">
                        {influencer.name}
                      </h3>
                      {influencer.rating !== undefined && influencer.rating > 0 && (
                        <span className="flex items-center text-xs font-semibold text-amber-500 shrink-0">
                          <Star className="h-3 w-3 fill-amber-500 mr-0.5" />
                          {influencer.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[color:var(--vooki-app-text-subtle)] truncate">
                      {influencer.handle}
                    </p>
                  </div>
                </div>

                {/* Dropdown Options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-[color:var(--vooki-app-text-subtle)] hover:text-[color:var(--vooki-app-text-strong)] transition-colors p-1.5 -mr-2 rounded-lg hover:bg-[color:var(--vooki-app-surface-strong)]">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-[color:var(--vooki-app-border)]">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href={`/brand/discover/${influencer.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link
                        href={`/brand/messages?otherUserId=${influencer.id}${
                          influencer.conversationId ? `&conversationId=${influencer.conversationId}` : ""
                        }`}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Send Message
                      </Link>
                    </DropdownMenuItem>
                    {influencer.campaignId && (
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/brand/campaigns/${influencer.campaignId}`}>
                          <Briefcase className="mr-2 h-4 w-4" />
                          View Campaign
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleToggleShortlist(influencer)}
                      disabled={actionLoadingId === influencer.id}
                      className="cursor-pointer"
                    >
                      {influencer.isShortlisted ? (
                        <>
                          <Trash2 className="mr-2 h-4 w-4 text-rose-500" />
                          <span className="text-rose-600 dark:text-rose-400">Remove Shortlist</span>
                        </>
                      ) : (
                        <>
                          <BookmarkCheck className="mr-2 h-4 w-4" />
                          Add to Shortlist
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Badges / Status */}
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                <Badge
                  variant="secondary"
                  className="rounded-lg px-2 py-0.5 text-[10px] font-bold bg-[color:var(--vooki-app-surface-strong)] border-[color:var(--vooki-app-border)] uppercase tracking-wider"
                >
                  {influencer.niche}
                </Badge>
                {influencer.hasActiveCollab ? (
                  <Badge className="rounded-lg px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 uppercase tracking-wider">
                    <Briefcase className="mr-1 h-3 w-3 inline" /> Active Collab
                  </Badge>
                ) : influencer.hasPendingInvite ? (
                  <Badge className="rounded-lg px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 uppercase tracking-wider">
                    <Send className="mr-1 h-3 w-3 inline" /> Pending Invite
                  </Badge>
                ) : influencer.isShortlisted ? (
                  <Badge className="rounded-lg px-2 py-0.5 text-[10px] font-bold bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 uppercase tracking-wider">
                    <Heart className="mr-1 h-3 w-3 inline" /> Shortlisted
                  </Badge>
                ) : null}

                {influencer.performanceLabel && (
                  <Badge className="rounded-lg px-2 py-0.5 text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 uppercase tracking-wider">
                    <CheckCircle2 className="mr-1 h-3 w-3 inline" /> {influencer.performanceLabel}
                  </Badge>
                )}
              </div>

              {/* Campaign Context Banner */}
              {influencer.campaignName && (
                <div className="mb-4 rounded-xl bg-[color:var(--vooki-app-surface-strong)]/40 px-3 py-2 border border-[color:var(--vooki-app-border)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-subtle)] mb-0.5">
                    Current Focus
                  </p>
                  <p className="text-xs font-semibold text-[color:var(--vooki-app-text-strong)] truncate">
                    {influencer.campaignName}
                  </p>
                </div>
              )}

              <div className="flex-1" />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)]/20 p-3">
                  <div className="flex items-center gap-1.5 mb-1 text-[color:var(--vooki-app-text-soft)]">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Followers</span>
                  </div>
                  <p className="text-lg font-black text-[color:var(--vooki-app-text-strong)]">
                    {formatCompact(influencer.followers)}
                  </p>
                </div>
                <div className="rounded-xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)]/20 p-3">
                  <div className="flex items-center gap-1.5 mb-1 text-[color:var(--vooki-app-text-soft)]">
                    <Activity className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Engagement</span>
                  </div>
                  <p className="text-lg font-black text-[color:var(--vooki-app-text-strong)]">
                    {influencer.engagement ? `${influencer.engagement}%` : "—"}
                  </p>
                </div>
              </div>

              {/* Activity & Action Footer */}
              <div className="pt-3 border-t border-[color:var(--vooki-app-border)] mt-auto flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[color:var(--vooki-app-text-subtle)]">
                  Active {formatRelativeTime(influencer.lastActive)}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="h-9 px-3 rounded-xl border-[color:var(--vooki-app-border-strong)] bg-transparent text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)] font-bold text-xs"
                  >
                    <Link href={`/brand/discover/${influencer.id}`}>
                      View Profile
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="h-9 w-9 p-0 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] shrink-0"
                    title="Send message"
                  >
                    <Link
                      href={`/brand/messages?otherUserId=${influencer.id}${
                        influencer.conversationId ? `&conversationId=${influencer.conversationId}` : ""
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

