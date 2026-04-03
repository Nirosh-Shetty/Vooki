"use client"

import { MessagesHubProvider } from "@/components/messaging/messages-hub-provider"

export const dynamic = 'force-dynamic';

export default function InfluencerMessagesPage() {
  return (
    <MessagesHubProvider
      role="influencer"
      heading="Messages"
      subheading="Manage brand communication, approvals, and delivery updates from one inbox."
      composerPlaceholder="Reply to brand..."
    />
  )
}
