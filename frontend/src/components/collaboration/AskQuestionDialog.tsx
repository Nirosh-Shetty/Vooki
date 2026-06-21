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

interface AskQuestionDialogProps {
  inviteId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AskQuestionDialog({
  inviteId,
  open,
  onOpenChange,
  onSuccess,
}: AskQuestionDialogProps) {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAsk = async () => {
    if (!question.trim()) return

    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites/${inviteId}/ask-question`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ question }),
        }
      )

      if (!response.ok) throw new Error("Failed to send question")

      onOpenChange(false)
      setQuestion("")
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
          <AlertDialogTitle>Ask a Question</AlertDialogTitle>
          <AlertDialogDescription>
            Message the brand with your question. Chat will open for discussion.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Textarea
          placeholder="e.g., Can you clarify the usage rights? Can the timeline be adjusted?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="h-24"
        />

        <div className="flex gap-2 justify-end">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAsk}
            disabled={!question.trim() || loading}
          >
            {loading ? "Sending..." : "Ask Question"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}