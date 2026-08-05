"use client";

import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessagesHubProvider } from "@/components/messaging/messages-hub-provider";

export const dynamic = "force-dynamic";

export default function InfluencerMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Card className="rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)]">
            <CardContent className="p-6 text-sm text-[color:var(--vooki-app-text-soft)]">
              Loading messages...
            </CardContent>
          </Card>
        </div>
      }
    >
      <MessagesHubProvider
        role="influencer"
        composerPlaceholder="Message brand..."
      />
    </Suspense>
  );
}
