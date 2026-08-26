import React from "react"
import { Badge } from "@/components/ui/badge"
import { Building2, Globe, Users, Target } from "lucide-react"

interface ProfilePreviewCardProps {
  brandName: string
  industry: string
  website: string
  summary: string
  logoUrl?: string
}

export function ProfilePreviewCard({
  brandName,
  industry,
  website,
  summary,
  logoUrl,
}: ProfilePreviewCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] shadow-lg backdrop-blur-xl transition-all duration-300">
      {/* Glow Effect */}
      <div className="pointer-events-none absolute -inset-px opacity-50 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[color:var(--vooki-app-glow-brand)] opacity-20 blur-3xl" />
      
      <div className="relative p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[color:var(--vooki-app-border)] bg-black/20 text-[color:var(--vooki-app-text-strong)] shadow-sm overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-8 w-8 opacity-50" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)] line-clamp-1">
              {brandName || "Brand Name"}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--vooki-app-text-soft)]">
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                {industry || "Industry"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                {website ? new URL(website.startsWith('http') ? website : `https://${website}`).hostname : "website.com"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">
              About the Brand
            </h4>
            <p className="text-sm text-[color:var(--vooki-app-text-soft)] line-clamp-3">
              {summary || "This is how creators will see your brand's summary on your public profile and collaboration invites. Make it compelling and highlight what makes collaborating with you special."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary" className="bg-[color:var(--vooki-app-surface-hover)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)] border-[color:var(--vooki-app-border)]">
              Verified Brand
            </Badge>
            <Badge variant="secondary" className="bg-[color:var(--vooki-app-surface-hover)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)] border-[color:var(--vooki-app-border)]">
              <Users className="mr-1 h-3 w-3" />
              Active Campaigns
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
