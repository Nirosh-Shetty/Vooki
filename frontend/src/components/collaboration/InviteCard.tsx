"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  CheckCircle2,
  MessageCircle,
  ThumbsUp,
  XCircle,
  ChevronDown,
} from "lucide-react"
import { CounterOfferModal } from "./CounterOfferModal"
import { AskQuestionDialog } from "./AskQuestionDialog"
import { DeclineConfirmDialog } from "./DeclineConfirmDialog"

interface InviteCardProps {
  invite: any
  brand: {
    id: string
    name: string
    profilePicture?: string
    brandName?: string
  }
  onAction?: () => void
}

export function InviteCard({ invite, brand, onAction }: InviteCardProps) {
  const [loading, setLoading] = useState(false)
  const [showCounter, setShowCounter] = useState(false)
  const [showQuestion, setShowQuestion] = useState(false)
  const [showDecline, setShowDecline] = useState(false)
  const [expandedDetails, setExpandedDetails] = useState(false)

  const handleAccept = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites/${invite._id}/accept`,
        {
          method: "POST",
          credentials: "include",
        }
      )

      if (!response.ok) throw new Error("Failed to accept invite")

      onAction?.()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const statusMap: { [k in string]: string } = {
    pending: "bg-amber-100 text-amber-800",
    counter_offered: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
  }

  const statusBadgeStyle = statusMap[invite.status as string] || "bg-gray-100 text-gray-800"

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Avatar className="w-10 h-10">
                <AvatarImage src={brand.profilePicture} />
                <AvatarFallback>{brand.name?.[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">
                    {brand.brandName || brand.name}
                  </p>
                  <Badge variant="outline" className={statusBadgeStyle}>
                    {invite.status === "counter_offered"
                      ? "Counter Pending"
                      : invite.status.charAt(0).toUpperCase() +
                        invite.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {invite.campaignTitle}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold text-sm">
                {invite.compensation.type === "fixed"
                  ? `₹${invite.compensation.amount?.toLocaleString()}`
                  : `₹${invite.compensation.minAmount?.toLocaleString()} - ${invite.compensation.maxAmount?.toLocaleString()}`}
              </p>
              <p className="text-xs text-gray-500">
                {invite.collaborationType
                  .replace(/_/g, " ")
                  .charAt(0)
                  .toUpperCase() + invite.collaborationType.slice(1)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Brand Message */}
          {invite.brandMessage && (
            <div className="p-3 bg-blue-50 rounded italic text-sm text-gray-700 border-l-4 border-blue-300">
              "{invite.brandMessage}"
            </div>
          )}

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Deliverables</p>
              <p className="font-medium">
                {invite.deliverables
                  .reduce((sum: number, d: any) => sum + d.quantity, 0)}
                {" items"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Response Deadline</p>
              <p className="font-medium">
                {new Date(invite.timeline.responseDeadline).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Expandable Details */}
          {expandedDetails && (
            <div className="space-y-3 border-t pt-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Deliverables</p>
                <div className="space-y-1">
                  {invite.deliverables.map((d: any, i: number) => (
                    <div key={i} className="text-sm text-gray-700">
                      {d.quantity}x {d.format} ({d.platform})
                      {d.description && (
                        <span className="text-gray-500"> - {d.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Timeline</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    Post by:{" "}
                    {new Date(invite.timeline.postingEndDate).toLocaleDateString()}
                  </p>
                  {invite.timeline.draftDueDate && (
                    <p>
                      Draft due:{" "}
                      {new Date(
                        invite.timeline.draftDueDate
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-gray-600"
            onClick={() => setExpandedDetails(!expandedDetails)}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedDetails ? "rotate-180" : ""
              }`}
            />
          </Button>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {invite.status === "pending" || invite.status === "counter_offered" ? (
              <>
                <Button
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={handleAccept}
                  disabled={loading}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Accept
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setShowCounter(true)}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Counter
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setShowQuestion(true)}
                >
                  <MessageCircle className="w-4 h-4" />
                  Ask
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 gap-2 text-red-600 hover:text-red-700"
                  onClick={() => setShowDecline(true)}
                >
                  <XCircle className="w-4 h-4" />
                  Decline
                </Button>
              </>
            ) : (
              <p className="text-sm text-gray-600 py-2 text-center w-full">
                {invite.status === "accepted" && "✓ You accepted this invite"}
                {invite.status === "declined" && "✗ You declined this invite"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CounterOfferModal
        inviteId={invite._id}
        currentTerms={invite}
        open={showCounter}
        onOpenChange={setShowCounter}
        onSuccess={onAction}
      />

      <AskQuestionDialog
        inviteId={invite._id}
        open={showQuestion}
        onOpenChange={setShowQuestion}
        onSuccess={onAction}
      />

      <DeclineConfirmDialog
        inviteId={invite._id}
        open={showDecline}
        onOpenChange={setShowDecline}
        onSuccess={onAction}
      />
    </>
  )
}