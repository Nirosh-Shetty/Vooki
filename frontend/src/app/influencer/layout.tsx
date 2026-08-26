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
import { useAuth } from "@/context/auth-context";

const sidebarItems: WorkspaceNavItem[] = [
  { label: "Dashboard", href: "/influencer/dashboard", icon: HomeIcon },
  { label: "Opportunities", href: "/influencer/invites", icon: InboxIcon },
  {
    label: "Active Collabs",
    href: "/influencer/my-collabs",
    icon: HandshakeIcon,
    mobileLabel: "Collabs",
  },
  { label: "Messages", href: "/influencer/messages", icon: MessageSquareIcon },
  { label: "Analytics", href: "/influencer/analytics", icon: BarChart3Icon },
  { label: "Payouts", href: "/influencer/earnings", icon: DollarSignIcon },
  { label: "Media Kit", href: "/influencer/profile", icon: FileTextIcon },
];

const mobilePrimary: WorkspaceNavItem[] = [
  { label: "Dashboard", href: "/influencer/dashboard", icon: HomeIcon },
  { label: "Opportunities", href: "/influencer/invites", icon: InboxIcon },
  {
    label: "Active Collabs",
    href: "/influencer/my-collabs",
    icon: HandshakeIcon,
    mobileLabel: "Collabs",
  },
  { label: "Messages", href: "/influencer/messages", icon: MessageSquareIcon },
];

const routeTitle: Record<string, string> = {
  "/influencer/dashboard": "Dashboard",
  "/influencer/my-collabs": "Active Collabs",
  "/influencer/analytics": "Analytics",
  "/influencer/contracts": "Contracts",
  "/influencer/earnings": "Payouts",
  "/influencer/messages": "Messages",
  "/influencer/invites": "Opportunities",
  "/influencer/settings": "Settings",
  "/influencer/profile": "Media Kit",
};

export default function InfluencerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pageTitle = useRouteTitle(routeTitle, "Creator Workspace", [
    { prefix: "/influencer/my-collabs/", title: "Collaboration Detail" },
  ]);

  const name = user?.name || user?.username || "Creator";
  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  const meta = user?.username ? `@${user.username}` : user?.email || "@creator";

  return (
    <WorkspaceShell
      roleLabel="Creator"
      workspaceLabel="Creator workspace"
      pageTitle={pageTitle}
      brandIcon={Sparkles}
      brandIconAccent="var(--vooki-violet)"
      accountName={name}
      accountMeta={meta}
      accountInitials={initials || "CR"}
      accountAvatar={user?.avatar || "/images/defaults/creator.svg"}
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
