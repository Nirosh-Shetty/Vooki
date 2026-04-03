"use client"

import { MessagesHubProvider } from "@/components/messaging/messages-hub-provider"

export const dynamic = 'force-dynamic';

export default function ManagerMessagesPage() {
  return (
    <MessagesHubProvider
      role="manager"
      heading="Messages"
      subheading="Handle brand and creator threads in one operational inbox."
      composerPlaceholder="Send update..."
    />
  )
}
