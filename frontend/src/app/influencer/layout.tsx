"use client";

import type React from "react";
import {
  BarChart3Icon,
  DollarSignIcon,
  FileTextIcon,
  HandshakeIcon,
  HomeIcon,
  InboxIcon,
  MessageSquareIcon,
  SettingsIcon,
  Sparkles,
} from "lucide-react";

import { useRouteTitle } from "@/hooks/useRouteTitle";
import { WorkspaceShell, type WorkspaceNavItem } from "@/components/workspace/workspace-shell";

const sidebarItems: WorkspaceNavItem[] = [
  { label: "Dashboard", href: "/influencer/dashboard", icon: HomeIcon },
  {
    label: "Collaborations",
    href: "/influencer/my-collabs",
    icon: HandshakeIcon,
    mobileLabel: "Collabs",
  },
  { label: "Analytics", href: "/influencer/analytics", icon: BarChart3Icon },
  { label: "Contracts", href: "/influencer/contracts", icon: FileTextIcon },
  { label: "Earnings", href: "/influencer/earnings", icon: DollarSignIcon },
  { label: "Messages", href: "/influencer/messages", icon: MessageSquareIcon },
  { label: "Invites", href: "/influencer/invites", icon: InboxIcon },
];

const mobilePrimary: WorkspaceNavItem[] = [
  { label: "Dashboard", href: "/influencer/dashboard", icon: HomeIcon },
  {
    label: "Collaborations",
    href: "/influencer/my-collabs",
    icon: HandshakeIcon,
    mobileLabel: "Collabs",
  },
  { label: "Invites", href: "/influencer/invites", icon: InboxIcon },
  { label: "Messages", href: "/influencer/messages", icon: MessageSquareIcon },
];

const routeTitle: Record<string, string> = {
  "/influencer/dashboard": "Dashboard",
  "/influencer/my-collabs": "Collaborations",
  "/influencer/analytics": "Analytics",
  "/influencer/contracts": "Contracts",
  "/influencer/earnings": "Earnings",
  "/influencer/messages": "Messages",
  "/influencer/invites": "Invites",
  "/influencer/settings": "Settings",
};

export default function InfluencerLayout({ children }: { children: React.ReactNode }) {
  const pageTitle = useRouteTitle(routeTitle, "Creator Workspace", [
    { prefix: "/influencer/my-collabs/", title: "Collaboration Detail" },
  ]);

  return (
    <WorkspaceShell
      roleLabel="Creator"
      workspaceLabel="Creator workspace"
      pageTitle={pageTitle}
      brandIcon={Sparkles}
      brandIconAccent="var(--vooki-violet)"
      accountName="John Doe"
      accountMeta="@johndoe"
      accountInitials="JD"
      sidebarItems={sidebarItems}
      mobilePrimary={mobilePrimary}
      settingsHref="/influencer/settings"
      menuLinks={[
        { label: "Your profile", href: "/influencer/profile" },
        { label: "Account settings", href: "/influencer/settings" },
      ]}
    >
      {children}
    </WorkspaceShell>
  );
}
