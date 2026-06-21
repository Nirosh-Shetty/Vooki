"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"

interface DeclineConfirmDialogProps {
  inviteId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeclineConfirmDialog({
  inviteId,
  open,
  onOpenChange,
  onSuccess,
}: DeclineConfirmDialogProps) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDecline = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites/${inviteId}/decline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason }),
        }
      )

      if (!response.ok) throw new Error("Failed to decline invite")

      onOpenChange(false)
      setReason("")
      onSuccess?.()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Decline Invite?</AlertDialogTitle>
          <AlertDialogDescription>
            You can provide a reason (optional). The brand will see this.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Textarea
          placeholder="e.g., Budget doesn't align, not enough time available, different niche focus..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-20"
        />

        <div className="flex gap-2 justify-end">
          <AlertDialogCancel>Keep Invite</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDecline}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Declining..." : "Decline"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}