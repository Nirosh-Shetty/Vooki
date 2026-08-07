"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  MessageSquare,
  MoreVertical,
  Users,
  Activity,
  Heart,
  Send,
  Briefcase
} from "lucide-react"

// Types for our Mock Data
type NetworkStatus = "shortlisted" | "invited" | "active"

interface NetworkInfluencer {
  id: string
  name: string
  handle: string
  avatar: string
  niche: string
  followers: number
  engagement: number
  status: NetworkStatus
  campaignName?: string
  lastActive: string
  performanceLabel?: string
}

const mockNetwork: NetworkInfluencer[] = [
  {
    id: "seed_1",
    name: "Alex Rivera",
    handle: "@arivera",
    avatar: "A",
    niche: "Tech & Lifestyle",
    followers: 1250000,
    engagement: 5.2,
    status: "active",
    campaignName: "Q3 Headphone Launch",
    lastActive: "2h ago",
    performanceLabel: "Top Performer"
  },
  {
    id: "seed_2",
    name: "Sam Chen",
    handle: "@samchen",
    avatar: "S",
    niche: "Fitness",
    followers: 850000,
    engagement: 6.8,
    status: "active",
    campaignName: "Summer Activewear",
    lastActive: "5h ago",
    performanceLabel: "High ROI"
  },
  {
    id: "seed_3",
    name: "Jordan Lee",
    handle: "@jlee",
    avatar: "J",
    niche: "Travel",
    followers: 450000,
    engagement: 4.5,
    status: "invited",
    campaignName: "Autumn Getaway",
    lastActive: "1d ago"
  },
  {
    id: "seed_4",
    name: "Mia Wong",
    handle: "@miaw",
    avatar: "M",
    niche: "Beauty",
    followers: 2100000,
    engagement: 3.9,
    status: "invited",
    campaignName: "Skincare Essentials",
    lastActive: "2d ago"
  },
  {
    id: "seed_5",
    name: "David Kim",
    handle: "@dkim",
    avatar: "D",
    niche: "Gaming",
    followers: 3200000,
    engagement: 8.1,
    status: "shortlisted",
    lastActive: "3h ago",
    performanceLabel: "High Engagement"
  },
  {
    id: "seed_6",
    name: "Emma Davis",
    handle: "@emmad",
    avatar: "E",
    niche: "Fashion",
    followers: 650000,
    engagement: 5.5,
    status: "shortlisted",
    lastActive: "1w ago"
  }
]

const formatCompact = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return `${value}`
}

export default function MyNetworkPage() {
  const [activeTab, setActiveTab] = useState<NetworkStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activePerformanceFilter, setActivePerformanceFilter] = useState<string | null>(null)

  const filteredNetwork = mockNetwork.filter(influencer => {
    const matchesTab = activeTab === "all" || influencer.status === activeTab
    const matchesSearch = influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          influencer.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          influencer.niche.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPerformance = !activePerformanceFilter || influencer.performanceLabel === activePerformanceFilter;
    return matchesTab && matchesSearch && matchesPerformance
  })

  const tabs = [
    { id: "all", label: "All Network", icon: Users },
    { id: "active", label: "Active Collaborators", icon: Briefcase },
    { id: "invited", label: "Pending Invites", icon: Send },
    { id: "shortlisted", label: "Shortlisted", icon: Heart },
  ] as const

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 pb-12">
      {/* Header Area */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[color:var(--vooki-app-text-strong)]">My Network</h1>
          <p className="mt-2 text-[color:var(--vooki-app-text-soft)]">
            Manage your relationships, track active collaborations, and review shortlisted creators.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button className="h-12 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] font-bold shadow-md hover:-translate-y-0.5 transition-all">
            <Search className="mr-2 h-4 w-4" />
            Discover New Creators
          </Button>
        </div>
      </div>

      {/* Toolbar (Tabs & Search) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl bg-[color:var(--vooki-app-surface-card)] p-2 shadow-sm border border-[color:var(--vooki-app-border)]">
        <div className="flex flex-wrap items-center gap-1">
          {tabs.map(tab => {
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
                <Icon className={`h-4 w-4 ${isActive ? 'text-[color:var(--vooki-accent)]' : ''}`} />
                {tab.label}
              </button>
            )
          })}
        </div>
        
        <div className="relative w-full md:w-72 px-2 pb-2 md:px-0 md:pb-0 md:pr-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--vooki-app-text-subtle)]" />
          <Input 
            placeholder="Search by name, handle, or niche..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 h-10 bg-[color:var(--vooki-app-bg)] border-[color:var(--vooki-app-border-strong)] rounded-xl text-sm font-medium focus-visible:ring-1 focus-visible:ring-[color:var(--vooki-accent)]"
          />
        </div>
      </div>

      {/* Performance Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-[color:var(--vooki-app-text-soft)] mr-2">Past Performance:</span>
        {["Top Performer", "High ROI", "High Engagement"].map(label => (
          <Badge 
            key={label}
            variant="outline"
            className={`cursor-pointer px-3 py-1.5 text-xs font-bold transition-all rounded-lg ${activePerformanceFilter === label ? 'bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] border-transparent' : 'bg-[color:var(--vooki-app-surface-card)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)]'}`}
            onClick={() => setActivePerformanceFilter(prev => prev === label ? null : label)}
          >
            {label}
          </Badge>
        ))}
      </div>

      {/* Network Grid */}
      {filteredNetwork.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-card)] text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-subtle)]">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-[color:var(--vooki-app-text-strong)]">No creators found</h3>
          <p className="mt-2 text-[color:var(--vooki-app-text-soft)] max-w-sm mx-auto">
            We couldn't find any creators matching your current filters. Try adjusting your search or tab selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNetwork.map(influencer => (
            <div key={influencer.id} className="group relative flex flex-col rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-[color:var(--vooki-app-border-strong)]">
              
              {/* Header: Avatar, Name, Handle, Menu */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-[color:var(--vooki-app-surface-strong)] to-[color:var(--vooki-app-surface-card)] border border-[color:var(--vooki-app-border-strong)] text-xl font-black text-[color:var(--vooki-app-text-strong)] shadow-inner">
                    {influencer.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-[color:var(--vooki-app-text-strong)] leading-tight">{influencer.name}</h3>
                    <p className="text-sm font-medium text-[color:var(--vooki-app-text-subtle)]">{influencer.handle}</p>
                  </div>
                </div>
                <button className="text-[color:var(--vooki-app-text-subtle)] hover:text-[color:var(--vooki-app-text-strong)] transition-colors p-1 -mr-2">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              {/* Badges / Status */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-[10px] font-bold bg-[color:var(--vooki-app-surface-strong)] border-[color:var(--vooki-app-border)] uppercase tracking-wider">
                  {influencer.niche}
                </Badge>
                {influencer.status === "active" && (
                  <Badge className="rounded-lg px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 uppercase tracking-wider">
                    <Briefcase className="mr-1 h-3 w-3 inline" /> Active Campaign
                  </Badge>
                )}
                {influencer.status === "invited" && (
                  <Badge className="rounded-lg px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 uppercase tracking-wider">
                    <Send className="mr-1 h-3 w-3 inline" /> Pending Invite
                  </Badge>
                )}
                {influencer.status === "shortlisted" && (
                  <Badge className="rounded-lg px-2 py-0.5 text-[10px] font-bold bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 uppercase tracking-wider">
                    <Heart className="mr-1 h-3 w-3 inline" /> Shortlisted
                  </Badge>
                )}
              </div>

              {/* Optional: Campaign Context */}
              {influencer.campaignName && (
                <div className="mb-5 rounded-xl bg-[color:var(--vooki-app-surface-strong)]/30 px-3 py-2 border border-[color:var(--vooki-app-border)]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-subtle)] mb-0.5">Current Focus</p>
                  <p className="text-sm font-medium text-[color:var(--vooki-app-text-strong)] truncate">{influencer.campaignName}</p>
                </div>
              )}

              <div className="flex-1" /> {/* Spacer */}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)]/20 p-3">
                  <div className="flex items-center gap-1.5 mb-1 text-[color:var(--vooki-app-text-soft)]">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Followers</span>
                  </div>
                  <p className="text-lg font-black text-[color:var(--vooki-app-text-strong)]">{formatCompact(influencer.followers)}</p>
                </div>
                <div className="rounded-xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)]/20 p-3">
                  <div className="flex items-center gap-1.5 mb-1 text-[color:var(--vooki-app-text-soft)]">
                    <Activity className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Engagement</span>
                  </div>
                  <p className="text-lg font-black text-[color:var(--vooki-app-text-strong)]">{influencer.engagement}%</p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center gap-2 pt-4 border-t border-[color:var(--vooki-app-border)] mt-auto">
                <Button asChild variant="outline" className="flex-1 h-10 rounded-xl border-[color:var(--vooki-app-border-strong)] bg-transparent text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)] font-bold text-sm">
                  <Link href={`/brand/discover/${influencer.id}`}>
                    View Profile
                  </Link>
                </Button>
                <Button asChild className="h-10 w-10 p-0 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] shrink-0">
                  <Link href={`/brand/messages`}>
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
