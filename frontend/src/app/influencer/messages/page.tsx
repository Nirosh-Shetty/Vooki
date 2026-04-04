"use client"

import { Suspense } from "react"
import { MessagesHubProvider } from "@/components/messaging/messages-hub-provider"

export const dynamic = 'force-dynamic';

export default function InfluencerMessagesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>Loading messages...</p></div>}>
      <MessagesHubProvider
        role="influencer"
        heading="Messages"
        subheading="Manage brand communication, approvals, and delivery updates from one inbox."
        composerPlaceholder="Reply to brand..."
      />
    </Suspense>
  )
}
