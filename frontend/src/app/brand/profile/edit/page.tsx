"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProfilePreviewCard } from "@/components/settings/ProfilePreviewCard"
import { useAuth } from "@/context/auth-context"
import { 
  Building2, 
  Save,
  Globe,
  Camera,
  Loader2
} from "lucide-react"

export default function BrandProfileEditPage() {
  const { user, refreshUser } = useAuth()
  
  const [profileData, setProfileData] = useState({
    brandName: "",
    industry: "",
    website: "",
    summary: "",
    logoUrl: ""
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null)

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileData({
        brandName: user.name || "",
        industry: (user as any).brandDetails?.brandCategory || "",
        website: (user as any).brandDetails?.website || "",
        summary: (user as any).brandDetails?.summary || "",
        logoUrl: user.profilePicture || user.avatar || ""
      })
    }
  }, [user])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/brand`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: profileData.brandName,
          brandDetails: {
            companyName: profileData.brandName,
            brandCategory: profileData.industry,
            website: profileData.website,
            summary: profileData.summary
          }
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to update profile")
      }

      await refreshUser()
      setMessage({ type: 'success', text: "Profile updated successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge className="mb-2 border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-muted)] hover:bg-[color:var(--vooki-app-surface-hover)]">
            <Building2 className="mr-1.5 h-3 w-3 inline-block" />
            Public Profile
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-[color:var(--vooki-app-text-strong)]">
            Edit Profile
          </h1>
          <p className="mt-1 text-sm font-medium text-[color:var(--vooki-app-text-soft)]">
            Manage how creators see your brand across Vooki.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {message && (
            <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {message.text}
            </span>
          )}
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 rounded-xl bg-[color:var(--vooki-app-brand)] px-6 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:bg-[color:var(--vooki-app-brand-hover)] transition-all"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] p-6 shadow-sm backdrop-blur-md">
            <h2 className="mb-4 text-lg font-bold text-[color:var(--vooki-app-text-strong)]">Brand Identity</h2>
            <div className="space-y-5">
              <div className="flex items-center gap-6">
                <div className="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] transition-colors hover:bg-[color:var(--vooki-app-border)]">
                  {profileData.logoUrl ? (
                    <img src={profileData.logoUrl} alt="Logo" className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    <Camera className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
                  )}
                  <div className="absolute -bottom-2 -right-2 rounded-lg bg-[color:var(--vooki-app-brand)] p-1.5 text-white shadow-sm">
                    <Camera className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">Brand Logo</h4>
                  <p className="text-xs text-[color:var(--vooki-app-text-soft)] mt-1">Recommended: 400x400px. JPG, PNG, or GIF.</p>
                  <Button variant="outline" size="sm" className="mt-2 h-8 rounded-lg border-[color:var(--vooki-app-border)] bg-transparent text-xs font-semibold text-[color:var(--vooki-app-text-strong)]">
                    Upload Image
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="brandName" className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Brand Name</Label>
                  <Input 
                    id="brandName" 
                    name="brandName"
                    value={profileData.brandName}
                    onChange={handleProfileChange}
                    className="h-11 rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] focus-visible:ring-[color:var(--vooki-app-brand)]" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="industry" className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Industry / Niche</Label>
                  <Input 
                    id="industry" 
                    name="industry"
                    value={profileData.industry}
                    onChange={handleProfileChange}
                    className="h-11 rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] focus-visible:ring-[color:var(--vooki-app-brand)]" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Website URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3 h-5 w-5 text-[color:var(--vooki-app-text-muted)]" />
                  <Input 
                    id="website" 
                    name="website"
                    value={profileData.website}
                    onChange={handleProfileChange}
                    className="h-11 rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] pl-11 focus-visible:ring-[color:var(--vooki-app-brand)]" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="summary" className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Brand Summary</Label>
                <Textarea 
                  id="summary" 
                  name="summary"
                  value={profileData.summary}
                  onChange={handleProfileChange}
                  rows={4}
                  className="rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] focus-visible:ring-[color:var(--vooki-app-brand)]"
                  placeholder="Tell creators about your brand..."
                />
                <p className="text-[10px] text-right text-[color:var(--vooki-app-text-muted)]">
                  {profileData.summary.length}/300 characters
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="sticky top-24">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">
              Live Preview
            </h3>
            <ProfilePreviewCard {...profileData} />
            <p className="mt-4 text-center text-xs text-[color:var(--vooki-app-text-soft)]">
              This is how creators see your brand on Vooki.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
