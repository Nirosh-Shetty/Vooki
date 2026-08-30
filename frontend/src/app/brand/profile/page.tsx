"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Globe, Mail, Edit3, Loader2, ShieldCheck, Briefcase, Star, Target, CheckCircle2 } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

type BrandProfilePayload = {
  id: string
  role: "brand"
  name: string
  username?: string
  email?: string
  phone?: string
  profilePicture?: string
  rating?: number
  totalReviews?: number
  brandProfile?: {
    companyName?: string
    website?: string
    brandCategory?: string
    summary?: string
    totalCollaborations?: number
    activeCampaigns?: number
  }
}

const formatMetric = (value?: number) => {
  if (!value) return "0"
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return `${value}`
}

export default function BrandProfilePage() {
  const [profile, setProfile] = useState<BrandProfilePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const heroAvatar = profile?.profilePicture || "/images/defaults/brand.svg"

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/me`, {
          credentials: "include",
        })
        if (!response.ok) throw new Error("Cannot load profile")
        const data: BrandProfilePayload = await response.json()
        if (data.role !== "brand") throw new Error("Not a brand account")
        
        setProfile(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Profile unavailable")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const totalCollaborations = useMemo(() => profile?.brandProfile?.totalCollaborations ?? 0, [profile])
  const activeCampaigns = useMemo(() => profile?.brandProfile?.activeCampaigns ?? 0, [profile])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[color:var(--vooki-app-text-muted)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-sm font-medium text-rose-400">
          {error}
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="w-full min-h-screen bg-[color:var(--vooki-app-bg)] text-[color:var(--vooki-app-text)]">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-12 pb-32">
        
        <div className="flex flex-col sm:flex-row gap-8 lg:gap-12">
          
          {/* AVATAR COLUMN */}
          <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
            <Avatar className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] text-3xl font-bold uppercase text-[color:var(--vooki-app-text-strong)] overflow-hidden">
              <AvatarImage 
                src={heroAvatar} 
                alt={profile.name} 
                className="object-cover bg-white dark:bg-zinc-100 p-2" 
              />
              <AvatarFallback className="bg-[color:var(--vooki-app-surface-hover)]">
                {profile.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* CONTENT COLUMN */}
          <div className="flex-1 min-w-0">
            
            {/* Header Row: Name & Edit Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[color:var(--vooki-app-text-strong)] flex items-center gap-2">
                  <span className="truncate">{profile.brandProfile?.companyName || profile.name}</span>
                  <ShieldCheck className="h-6 w-6 text-[color:var(--vooki-accent)] flex-shrink-0" />
                </h1>
                <p className="text-base text-[color:var(--vooki-app-text-muted)] font-medium mt-1">@{profile.username}</p>
              </div>
              
              <Button asChild className="w-full sm:w-auto bg-[color:var(--vooki-app-surface)] hover:bg-[color:var(--vooki-app-surface-hover)] border border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-strong)] shadow-sm font-medium rounded-lg px-6 transition-colors">
                <Link href="/brand/profile/edit">
                  <Edit3 className="mr-2 h-4 w-4 opacity-70" />
                  Edit Profile
                </Link>
              </Button>
            </div>

            {/* Badges / Meta Info */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm font-medium text-[color:var(--vooki-app-text-soft)] mb-8">
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 opacity-70" />
                {profile.brandProfile?.brandCategory || "Brand"}
              </div>
              {profile.brandProfile?.website && (
                <a 
                  href={`https://${profile.brandProfile.website.replace(/^https?:\/\//, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 text-[color:var(--vooki-accent)] hover:underline"
                >
                  <Globe className="h-4 w-4 opacity-70" />
                  {profile.brandProfile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 sm:gap-8 mb-10 pb-10 border-b border-[color:var(--vooki-app-border)]">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)] flex items-center gap-1 mb-1">
                  <Star className="h-3 w-3" /> Rating
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[color:var(--vooki-app-text-strong)]">{profile.rating?.toFixed(1) || "0.0"}</span>
                  <span className="text-xs font-medium text-[color:var(--vooki-app-text-muted)]">({profile.totalReviews || 0})</span>
                </div>
              </div>

              <div className="w-px bg-[color:var(--vooki-app-border)] hidden sm:block"></div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)] flex items-center gap-1 mb-1">
                  <Target className="h-3 w-3" /> Active Campaigns
                </span>
                <span className="text-2xl font-extrabold text-[color:var(--vooki-app-text-strong)]">
                  {formatMetric(activeCampaigns)}
                </span>
              </div>

              <div className="w-px bg-[color:var(--vooki-app-border)] hidden sm:block"></div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)] flex items-center gap-1 mb-1">
                  <CheckCircle2 className="h-3 w-3" /> Total Collabs
                </span>
                <span className="text-2xl font-extrabold text-[color:var(--vooki-app-text-strong)]">
                  {formatMetric(totalCollaborations)}
                </span>
              </div>
            </div>

            {/* Bio Section */}
            <div className="mb-10">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[color:var(--vooki-app-text-muted)] mb-4">About the Brand</h2>
              {profile.brandProfile?.summary ? (
                <div className="text-base leading-relaxed text-[color:var(--vooki-app-text-soft)] whitespace-pre-wrap">
                  {profile.brandProfile.summary}
                </div>
              ) : (
                <div className="text-base text-[color:var(--vooki-app-text-muted)] italic">
                  No bio provided. Tell creators about your brand.
                </div>
              )}
            </div>

            {/* Contact Section */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-[color:var(--vooki-app-text-muted)] mb-4">Contact</h2>
              <div className="inline-flex items-center gap-3 bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border)] rounded-xl px-4 py-3">
                <Mail className="h-5 w-5 text-[color:var(--vooki-app-text-muted)]" />
                <span className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">{profile.email}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
