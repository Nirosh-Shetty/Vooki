"use client"

import { MessagesHubProvider } from "@/components/messaging/messages-hub-provider"

export const dynamic = 'force-dynamic';

export default function BrandMessagesPage() {
  return (
    <MessagesHubProvider
      role="brand"
      heading="Messages"
      subheading="Coordinate with creators clearly and keep campaign operations inside Vooki."
      composerPlaceholder="Message creator..."
    />
  )
}
