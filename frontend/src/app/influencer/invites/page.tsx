"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { InviteCard } from "@/components/collaboration/InviteCard"

type InviteStatus = "pending" | "counter_offered" | "accepted" | "declined"

export default function InfluencerInvitesPage() {
  const [activeTab, setActiveTab] = useState<InviteStatus | "all">("all")
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadInvites = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites/received`,
        { credentials: "include" }
      )

      if (!response.ok) throw new Error("Failed to load invites")

      const data = await response.json()
      setInvites(data.invites || [])
    } catch (error) {
      console.error(error)
      setInvites([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvites()
  }, [])

  const filteredInvites =
    activeTab === "all"
      ? invites
      : invites.filter((i) => i.status === activeTab)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collaboration Invites</h1>
          <p className="text-gray-600 mt-1">
            {filteredInvites.length} {activeTab === "all" ? "total" : activeTab} invite
            {filteredInvites.length !== 1 ? "s" : ""}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadInvites}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="counter_offered">Counters</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading invites...</div>
      ) : filteredInvites.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No {activeTab === "all" ? "" : activeTab} invites yet
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInvites.map((invite) => (
            <InviteCard
              key={invite._id}
              invite={invite}
              brand={invite.brand}
              onAction={loadInvites}
            />
          ))}
        </div>
      )}
    </div>
  )
}
