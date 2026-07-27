"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
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

interface CreateInviteModalProps {
  campaignId: string
  campaignName: string
  preselectedInfluencerId?: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function CreateInviteModal({
  campaignId,
  campaignName,
  preselectedInfluencerId,
  trigger,
  onSuccess,
}: CreateInviteModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

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
    updated[index] = { ...updated[index], [field]: value }
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
      setError("Please select collaboration type")
      return
    }
    if (!postingStartDate || !postingEndDate || !responseDeadline) {
      setError("Please set all required dates")
      return
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
      const payload = {
        influencerId,
        campaignId,
        collaborationType,
        deliverables,
        timeline: {
          postingStartDate: new Date(postingStartDate),
          postingEndDate: new Date(postingEndDate),
          draftDueDate: draftDueDate ? new Date(draftDueDate) : undefined,
          responseDeadline: new Date(responseDeadline),
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

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Creator to Collaborate</DialogTitle>
          <DialogDescription>
            Campaign: <strong>{campaignName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {/* Creator Selection */}
          {!preselectedInfluencerId && (
            <div>
              <label className="block text-sm font-medium mb-2">Creator</label>
              <input
                type="text"
                placeholder="Enter creator ID or search"
                value={influencerId}
                onChange={(e) => setInfluencerId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}

          {/* Collaboration Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Collaboration Type
            </label>
            <Select
              value={collaborationType}
              onValueChange={(v) =>
                setCollaborationType(v as CollaborationType)
              }
            >
              <SelectTrigger>
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
          <div>
            <label className="block text-sm font-medium mb-2">
              Deliverables
            </label>
            <div className="space-y-3">
              {deliverables.map((d, idx) => (
                <div key={idx} className="flex gap-2">
                  <Select
                    value={d.platform}
                    onValueChange={(v) =>
                      handleUpdateDeliverable(idx, "platform", v)
                    }
                  >
                    <SelectTrigger className="flex-1">
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
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
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
                    className="w-20"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDeliverable(idx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDeliverable}
              >
                + Add Deliverable
              </Button>
            </div>
          </div>

          {/* Timeline - Advanced Settings */}
          <div className="border-t pt-4">
            <button
              type="button"
              className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings (Optional Timeline)"}
            </button>
            
            {showAdvanced && (
              <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Posting Start Date
              </label>
              <Input
                type="date"
                value={postingStartDate}
                onChange={(e) => setPostingStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Posting End Date
              </label>
              <Input
                type="date"
                value={postingEndDate}
                onChange={(e) => setPostingEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Draft Due Date (Optional)
              </label>
              <Input
                type="date"
                value={draftDueDate}
                onChange={(e) => setDraftDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Response Deadline
              </label>
              <Input
                type="date"
                value={responseDeadline}
                onChange={(e) => setResponseDeadline(e.target.value)}
              />
            </div>
              </div>
            )}
          </div>

          {/* Compensation */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Compensation Structure
            </label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="fixed"
                  checked={compensationType === "fixed"}
                  onChange={(e) =>
                    setCompensationType(e.target.value as CompensationType)
                  }
                />
                Fixed Amount
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="range"
                  checked={compensationType === "range"}
                  onChange={(e) =>
                    setCompensationType(e.target.value as CompensationType)
                  }
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
              />
            ) : (
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min (₹)"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max (₹)"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Brand Message */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Message to Creator
            </label>
            <Textarea
              placeholder="e.g., 'We love your storytelling style. Your audience aligns perfectly with our brand.'"
              value={brandMessage}
              onChange={(e) => setBrandMessage(e.target.value)}
              className="h-20"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Send Invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}