"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CounterOfferModalProps {
  inviteId: string
  currentTerms: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CounterOfferModal({
  inviteId,
  currentTerms,
  open,
  onOpenChange,
  onSuccess,
}: CounterOfferModalProps) {
  const [tab, setTab] = useState("compensation")
  const [message, setMessage] = useState("")
  const [compensation, setCompensation] = useState(
    currentTerms.compensation || {}
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites/${inviteId}/counter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            compensation,
            message,
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to send counter offer")

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Counter Offer</DialogTitle>
          <DialogDescription>
            Suggest modified terms for this collaboration
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded">
            {error}
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compensation">Compensation</TabsTrigger>
            <TabsTrigger value="message">Message</TabsTrigger>
          </TabsList>

          <TabsContent value="compensation" className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Current: ₹
                {currentTerms.compensation.type === "fixed"
                  ? currentTerms.compensation.amount
                  : `${currentTerms.compensation.minAmount} - ${currentTerms.compensation.maxAmount}`}
              </label>
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="radio"
                  checked={compensation.type === "fixed"}
                  onChange={() =>
                    setCompensation({ ...compensation, type: "fixed" })
                  }
                />
                Fixed Amount
              </label>
              {compensation.type === "fixed" && (
                <Input
                  type="number"
                  placeholder="Enter amount (₹)"
                  value={compensation.amount || ""}
                  onChange={(e) =>
                    setCompensation({
                      ...compensation,
                      amount: Number(e.target.value),
                    })
                  }
                />
              )}

              <label className="flex items-center gap-2 mt-3 mb-3 cursor-pointer">
                <input
                  type="radio"
                  checked={compensation.type === "range"}
                  onChange={() =>
                    setCompensation({ ...compensation, type: "range" })
                  }
                />
                Range
              </label>
              {compensation.type === "range" && (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min (₹)"
                    value={compensation.minAmount || ""}
                    onChange={(e) =>
                      setCompensation({
                        ...compensation,
                        minAmount: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max (₹)"
                    value={compensation.maxAmount || ""}
                    onChange={(e) =>
                      setCompensation({
                        ...compensation,
                        maxAmount: Number(e.target.value),
                      })
                    }
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="message" className="space-y-4 mt-4">
            <Textarea
              placeholder="Explain your counter offer. What's important to you?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-24"
            />
            <p className="text-xs text-gray-500">
              Be clear about why you're suggesting these changes.
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Sending..." : "Send Counter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}