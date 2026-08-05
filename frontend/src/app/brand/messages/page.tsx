"use client"

import { Suspense } from "react"
import { MessagesHubProvider } from "@/components/messaging/messages-hub-provider"

export const dynamic = 'force-dynamic';

export default function BrandMessagesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>Loading messages...</p></div>}>
      <MessagesHubProvider
        role="brand"
        composerPlaceholder="Message creator..."
      />
    </Suspense>
  )
}
