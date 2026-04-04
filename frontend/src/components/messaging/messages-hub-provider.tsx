"use client";

import { Suspense } from "react";
import { MessagesHubContent } from "./messages-hub-content";
import type { RoleVariant } from "./messages-hub";

interface MessagesHubProviderProps {
  role: RoleVariant;
  heading: string;
  subheading: string;
  composerPlaceholder: string;
}

export function MessagesHubProvider({
  role,
  heading,
  subheading,
  composerPlaceholder,
}: MessagesHubProviderProps) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>Loading messages...</p></div>}>
      <MessagesHubContent
        role={role}
        heading={heading}
        subheading={subheading}
        composerPlaceholder={composerPlaceholder}
      />
    </Suspense>
  );
}
