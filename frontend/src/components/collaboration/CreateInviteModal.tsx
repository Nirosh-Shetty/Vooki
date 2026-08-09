"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
// import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, X } from "lucide-react"

type CollaborationType =
  | "sponsored_post"
  | "affiliate"
  | "ambassador"
  | "ugc"
  | "event"
  | "long_term"

type CompensationType = "fixed" | "range"

interface Deliverable {
  platform: string
  format: string
  quantity: number
  description?: string
}

const PLATFORM_FORMATS: Record<string, { label: string; value: string }[]> = {
  instagram: [
    { label: "Post", value: "post" },
    { label: "Reel", value: "reel" },
    { label: "Story", value: "story" },
  ],
  tiktok: [
    { label: "Video", value: "video" },
  ],
  youtube: [
    { label: "Video", value: "video" },
    { label: "Shorts", value: "shorts" },
  ],
}

interface CreateInviteModalProps {
  campaignId?: string
  campaignName?: string
  campaigns?: { id: string; name: string }[]
  preselectedInfluencerId?: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function CreateInviteModal({
  campaignId,
  campaignName,
  campaigns,
  preselectedInfluencerId,
  trigger,
  onSuccess,
}: CreateInviteModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignId || "")

  // Use a stable selected campaign based on the open state and campaigns prop
  useEffect(() => {
    if (open && !selectedCampaignId && campaigns && campaigns.length > 0) {
      setSelectedCampaignId(campaigns[0].id)
    }
  }, [open, selectedCampaignId, campaigns])

  // Form state
  const [influencerId, setInfluencerId] = useState(preselectedInfluencerId || "")
  const [collaborationType, setCollaborationType] = useState<CollaborationType>()
  const [deliverables, setDeliverables] = useState<Deliverable[]>([
    { platform: "instagram", format: "reel", quantity: 1 },
  ])
  const [compensationType, setCompensationType] = useState<CompensationType>("fixed")
  const [fixedAmount, setFixedAmount] = useState("")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [brandMessage, setBrandMessage] = useState("")

  // Timeline state
  const [postingStartDate, setPostingStartDate] = useState("")
  const [postingEndDate, setPostingEndDate] = useState("")
  const [draftDueDate, setDraftDueDate] = useState("")
  const [responseDeadline, setResponseDeadline] = useState("")


  const handleAddDeliverable = () => {
    setDeliverables([
      ...deliverables,
      { platform: "instagram", format: "post", quantity: 1 },
    ])
  }

  const handleRemoveDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index))
  }

  const handleUpdateDeliverable = (
    index: number,
    field: keyof Deliverable,
    value: any
  ) => {
    const updated = [...deliverables]
    
    if (field === "platform") {
      const platformFormats = PLATFORM_FORMATS[value] || PLATFORM_FORMATS.instagram
      const currentFormatValid = platformFormats.some(f => f.value === updated[index].format)
      
      updated[index] = { 
        ...updated[index], 
        platform: value,
        format: currentFormatValid ? updated[index].format : platformFormats[0].value 
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    
    setDeliverables(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!influencerId) {
      setError("Please select an influencer")
      return
    }
    if (!collaborationType) {
      setCollaborationType("sponsored_post")
    }
    if (
      compensationType === "fixed" &&
      (!fixedAmount || Number(fixedAmount) <= 0)
    ) {
      setError("Please enter a valid compensation amount")
      return
    }
    if (
      compensationType === "range" &&
      (!minAmount || !maxAmount || Number(minAmount) > Number(maxAmount))
    ) {
      setError("Please enter valid compensation range")
      return
    }

    setLoading(true)

    try {
      const now = new Date()
      const defaultStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      const defaultEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      const defaultDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const payload = {
        influencerId,
        campaignId: selectedCampaignId || campaignId,
        collaborationType: collaborationType || "sponsored_post",
        deliverables,
        timeline: {
          postingStartDate: postingStartDate ? new Date(postingStartDate) : defaultStart,
          postingEndDate: postingEndDate ? new Date(postingEndDate) : defaultEnd,
          draftDueDate: draftDueDate ? new Date(draftDueDate) : undefined,
          responseDeadline: responseDeadline ? new Date(responseDeadline) : defaultDeadline,
        },
        compensation: {
          type: compensationType,
          amount: compensationType === "fixed" ? Number(fixedAmount) : undefined,
          minAmount:
            compensationType === "range" ? Number(minAmount) : undefined,
          maxAmount:
            compensationType === "range" ? Number(maxAmount) : undefined,
          currency: "INR",
        },
        brandMessage,
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create invite")
      }

      setOpen(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Invite Creator
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-bg)] p-0 shadow-2xl rounded-xl">
        <div className="bg-gradient-to-br from-[color:var(--vooki-app-surface-card)] to-[color:var(--vooki-app-bg)] p-5">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-[color:var(--vooki-app-text-strong)]">
              Invite Creator to Collaborate
            </DialogTitle>
            {campaignName && (
              <DialogDescription className="text-[color:var(--vooki-app-text-soft)] font-medium mt-1">
                Proposing collaboration for <strong className="text-[color:var(--vooki-app-text-strong)]">{campaignName}</strong>
              </DialogDescription>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-400">
                {error}
              </div>
            )}

            {/* Campaign Selection */}
          {!campaignId && campaigns && campaigns.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Campaign</label>
              <Select
                value={selectedCampaignId}
                onValueChange={setSelectedCampaignId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!preselectedInfluencerId && (
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">Creator Identification</label>
              <Input
                type="text"
                placeholder="Enter creator ID or search"
                value={influencerId}
                onChange={(e) => setInfluencerId(e.target.value)}
                className="h-11 border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-bg)] rounded-xl text-sm font-medium text-[color:var(--vooki-app-text-strong)] focus-visible:ring-1 focus-visible:ring-[color:var(--vooki-accent)]"
              />
            </div>
          )}

          {/* Collaboration Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
              Collaboration Type
            </label>
            <Select
              value={collaborationType}
              onValueChange={(v) =>
                setCollaborationType(v as CollaborationType)
              }
            >
              <SelectTrigger className="h-11 border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-bg)] rounded-xl text-sm font-medium focus:ring-[color:var(--vooki-accent)]">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sponsored_post">Sponsored Post</SelectItem>
                <SelectItem value="affiliate">Affiliate</SelectItem>
                <SelectItem value="ambassador">Ambassador</SelectItem>
                <SelectItem value="ugc">UGC (User Generated)</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="long_term">Long-term</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deliverables */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[color:var(--vooki-app-text-strong)] mb-2">
              Deliverables
            </label>
            <div className="space-y-3">
              {deliverables.map((d, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-3 items-center bg-[color:var(--vooki-app-bg)] p-3 rounded-2xl border border-[color:var(--vooki-app-border)]">
                  <Select
                    value={d.platform}
                    onValueChange={(v) =>
                      handleUpdateDeliverable(idx, "platform", v)
                    }
                  >
                    <SelectTrigger className="flex-1 h-10 border-transparent bg-[color:var(--vooki-app-surface-card)] hover:bg-[color:var(--vooki-app-surface-strong)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={d.format}
                    onValueChange={(v) =>
                      handleUpdateDeliverable(idx, "format", v)
                    }
                  >
                    <SelectTrigger className="flex-1 h-10 border-transparent bg-[color:var(--vooki-app-surface-card)] hover:bg-[color:var(--vooki-app-surface-strong)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(PLATFORM_FORMATS[d.platform] || PLATFORM_FORMATS.instagram).map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    min="1"
                    value={d.quantity}
                    onChange={(e) =>
                      handleUpdateDeliverable(
                        idx,
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                    className="w-full sm:w-24 h-10 border-transparent bg-[color:var(--vooki-app-surface-card)] text-center font-bold"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 rounded-xl"
                    onClick={() => handleRemoveDeliverable(idx)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-dashed border-[color:var(--vooki-app-border-strong)] bg-transparent hover:bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] font-semibold rounded-2xl"
                onClick={handleAddDeliverable}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Deliverable
              </Button>
            </div>
          </div>

          {/* Timeline - Advanced Settings */}
          <div className="space-y-1.5 border-t border-[color:var(--vooki-app-border)] pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                Timeline (Optional)
              </label>
              <button
                type="button"
                className="text-xs font-bold text-[color:var(--vooki-accent)] hover:text-[color:var(--vooki-app-text-strong)] transition-colors"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? "Hide Details" : "Show Dates"}
              </button>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--vooki-app-text-soft)] mb-1.5">
                    Posting Start Date
                  </label>
                  <Input
                    type="date"
                    value={postingStartDate}
                    onChange={(e) => setPostingStartDate(e.target.value)}
                    className="h-11 border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-bg)] rounded-xl text-sm font-medium text-[color:var(--vooki-app-text-strong)] focus:ring-[color:var(--vooki-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--vooki-app-text-soft)] mb-1.5">
                    Posting End Date
                  </label>
                  <Input
                    type="date"
                    value={postingEndDate}
                    onChange={(e) => setPostingEndDate(e.target.value)}
                    className="h-11 border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-bg)] rounded-xl text-sm font-medium text-[color:var(--vooki-app-text-strong)] focus:ring-[color:var(--vooki-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--vooki-app-text-soft)] mb-1.5">
                    Draft Due Date
                  </label>
                  <Input
                    type="date"
                    value={draftDueDate}
                    onChange={(e) => setDraftDueDate(e.target.value)}
                    className="h-11 border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-bg)] rounded-xl text-sm font-medium text-[color:var(--vooki-app-text-strong)] focus:ring-[color:var(--vooki-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--vooki-app-text-soft)] mb-1.5">
                    Response Deadline
                  </label>
                  <Input
                    type="date"
                    value={responseDeadline}
                    onChange={(e) => setResponseDeadline(e.target.value)}
                    className="h-11 border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-bg)] rounded-xl text-sm font-medium text-[color:var(--vooki-app-text-strong)] focus:ring-[color:var(--vooki-accent)]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Compensation */}
          <div className="space-y-1.5 border-t border-[color:var(--vooki-app-border)] pt-4">
            <label className="block text-sm font-semibold text-[color:var(--vooki-app-text-strong)] mb-2">
              Compensation Structure
            </label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-[color:var(--vooki-app-text-strong)] text-sm">
                <input
                  type="radio"
                  value="fixed"
                  checked={compensationType === "fixed"}
                  onChange={(e) =>
                    setCompensationType(e.target.value as CompensationType)
                  }
                  className="text-[color:var(--vooki-accent)] focus:ring-[color:var(--vooki-accent)]"
                />
                Fixed Amount
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-[color:var(--vooki-app-text-strong)] text-sm">
                <input
                  type="radio"
                  value="range"
                  checked={compensationType === "range"}
                  onChange={(e) =>
                    setCompensationType(e.target.value as CompensationType)
                  }
                  className="text-[color:var(--vooki-accent)] focus:ring-[color:var(--vooki-accent)]"
                />
                Range
              </label>
            </div>

            {compensationType === "fixed" ? (
              <Input
                type="number"
                placeholder="Enter amount (₹)"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                className="h-11 border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-bg)] rounded-xl text-sm font-medium text-[color:var(--vooki-app-text-strong)] focus:ring-[color:var(--vooki-accent)] max-w-[200px]"
              />
            ) : (
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="Min (₹)"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="h-11 border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-bg)] rounded-xl text-sm font-medium text-[color:var(--vooki-app-text-strong)] focus:ring-[color:var(--vooki-accent)]"
                />
                <Input
                  type="number"
                  placeholder="Max (₹)"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="h-11 border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-bg)] rounded-xl text-sm font-medium text-[color:var(--vooki-app-text-strong)] focus:ring-[color:var(--vooki-accent)]"
                />
              </div>
            )}
          </div>

          {/* Brand Message */}
          <div className="space-y-1.5 border-t border-[color:var(--vooki-app-border)] pt-4">
            <label className="block text-sm font-semibold text-[color:var(--vooki-app-text-strong)] mb-2">
              Message to Creator
            </label>
            <Textarea
              placeholder="e.g., 'We love your storytelling style. Your audience aligns perfectly with our brand.'"
              value={brandMessage}
              onChange={(e) => setBrandMessage(e.target.value)}
              className="min-h-[100px] border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-bg)] rounded-xl text-sm font-medium text-[color:var(--vooki-app-text-strong)] focus-visible:ring-1 focus-visible:ring-[color:var(--vooki-accent)] resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-2xl font-bold border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)]"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="h-11 rounded-2xl font-bold bg-[color:var(--vooki-accent)] text-black hover:bg-[color:var(--vooki-accent-hover)] px-8 shadow-[var(--vooki-shadow-app-soft)]"
            >
              {loading ? "Creating Invite..." : "Send Invite"}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
