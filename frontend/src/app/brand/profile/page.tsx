"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type BrandProfilePayload = {
  id: string
  role: "brand"
  name: string
  username?: string
  email?: string
  profilePicture?: string
  rating?: number
  totalReviews?: number
  brandProfile?: {
    companyName?: string
    website?: string
    brandCategory?: string
    collaborations?: number
    activeCampaigns?: number
    pointsOfContact?: number
  }
}

const formatMetric = (value?: number) => {
  if (!value) return "—"
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
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/me`, {
          credentials: "include",
          signal: controller.signal,
        })
        if (!response.ok) throw new Error("Cannot load profile")
        const data: BrandProfilePayload = await response.json()
        if (data.role !== "brand") throw new Error("Not a brand account")
        setProfile(data)
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "Profile unavailable")
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  const totalCollaborations = useMemo(() => profile?.brandProfile?.collaborations ?? 0, [profile])
  const activeCampaigns = useMemo(() => profile?.brandProfile?.activeCampaigns ?? 0, [profile])
  const invites = Math.max(0, (profile?.brandProfile?.collaborations ?? 0) * 2)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {loading && (
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardContent className="p-6 text-sm text-slate-600">Loading brand profile…</CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardContent className="p-6 text-sm text-rose-600">{error}</CardContent>
        </Card>
      )}

      {profile && (
        <>
          <section className="rounded-[32px] border border-slate-200 bg-gradient-to-r from-amber-500 via-orange-500 to-cyan-500 p-6 shadow-2xl shadow-amber-300/40 text-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20 border border-white/60 bg-slate-900/60 text-xl font-semibold uppercase text-white">
                <AvatarImage src={heroAvatar} alt={profile.name} />
                <AvatarFallback className="bg-slate-900/10 text-slate-900">
                  {profile.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight">{profile.name}</h1>
                  <Badge className="border-0 bg-white/80 text-slate-900">Brand account</Badge>
                  {profile.brandProfile?.brandCategory && (
                    <Badge className="border-0 bg-slate-900/10 text-slate-900">
                      {profile.brandProfile.brandCategory}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-900/70">@{profile.username || "brand"}</p>
                <p className="mt-2 max-w-2xl text-sm text-slate-900/80">
                  Brand-ready collaboration flows, transparent milestones, and trust metrics built for modern campaigns.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="ghost" className="border border-slate-900/30 bg-white/80 text-slate-900 hover:bg-white">
                  <Link href="/brand/campaigns">Create campaign</Link>
                </Button>
                <Button variant="outline" className="border-white/70 text-slate-900">
                  Invite creator
                </Button>
                <Button asChild variant="secondary" className="text-slate-900/90">
                  <Link href="/brand/profile/edit">Edit profile</Link>
                </Button>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/60 bg-white/50 px-4 py-3 text-sm text-slate-900">
                <p className="text-xs uppercase tracking-widest text-slate-600">Collaborations</p>
                <p className="text-2xl font-semibold">{formatMetric(totalCollaborations)}</p>
                <p className="text-xs text-slate-600">Deals across the platform</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/50 px-4 py-3 text-sm text-slate-900">
                <p className="text-xs uppercase tracking-widest text-slate-600">Active campaigns</p>
                <p className="text-2xl font-semibold">{formatMetric(activeCampaigns)}</p>
                <p className="text-xs text-slate-600">Currently tracked</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/50 px-4 py-3 text-sm text-slate-900">
                <p className="text-xs uppercase tracking-widest text-slate-600">Pending invites</p>
                <p className="text-2xl font-semibold">{formatMetric(invites)}</p>
                <p className="text-xs text-slate-600">Recently sent</p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <Card className="border-slate-200 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle>Brand identity</CardTitle>
                  <CardDescription>How you show up when a creator opens your profile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-700">
                      <p className="text-xs text-slate-500">Company</p>
                      <p className="text-base font-semibold text-slate-900">{profile.brandProfile?.companyName || "Not set"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-700">
                      <p className="text-xs text-slate-500">Website</p>
                      <p className="text-base font-semibold text-slate-900">{profile.brandProfile?.website || "Not set"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-700">
                      <p className="text-xs text-slate-500">Category</p>
                      <p className="text-base font-semibold text-slate-900">{profile.brandProfile?.brandCategory || "General"}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Trust signals</p>
                    <p>A clear profile, vetted agreements, and fast payments make your invites feel professional.</p>
                    <p className="text-xs text-slate-500">Pro tip: keep your website link and brand story filled to stand out.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle>Campaign rhythm</CardTitle>
                  <CardDescription>Snapshot of where most energy is right now.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <p>Live campaigns</p>
                    <span className="font-semibold text-slate-900">{formatMetric(activeCampaigns)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p>Negotiations</p>
                    <span className="font-semibold text-slate-900">{formatMetric(totalCollaborations)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p>Payments pending</p>
                    <span className="font-semibold text-slate-900">3</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-slate-200 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle>Contact stack</CardTitle>
                  <CardDescription>What creators see before accepting invites.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <p>Email</p>
                      <span className="text-slate-900">{profile.email ?? "Not shared yet"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p>Handle</p>
                      <span className="text-slate-900">@{profile.username || "brand"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p>Response time</p>
                      <span className="text-slate-900">Within 24 hrs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p>Decision-maker</p>
                      <span className="text-slate-900">In-house marketing</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle>Next actions</CardTitle>
                  <CardDescription>Keep the profile fresh.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <Button asChild variant="ghost" className="w-full justify-between border border-slate-200 text-slate-900">
                    <Link href="/brand/influencers">Show active collabs</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full border border-slate-900 text-slate-900">
                    <Link href="/brand/campaigns/new">Launch campaign</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
