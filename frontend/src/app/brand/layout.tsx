"use client";

import type React from "react";
import {
  BarChart3,
  Building,
  Home,
  MessageSquare,
  Search,
  Settings,
  Target,
  Users,
  Wallet,
} from "lucide-react";

import { useRouteTitle } from "@/hooks/useRouteTitle";
import { WorkspaceShell, type WorkspaceNavItem } from "@/components/workspace/workspace-shell";
import { useAuth } from "@/context/auth-context";

const sidebarItems: WorkspaceNavItem[] = [
  { label: "Dashboard", href: "/brand/dashboard", icon: Home },
  { label: "Campaigns", href: "/brand/campaigns", icon: Target },
  { label: "Discover", href: "/brand/discover", icon: Search },
  { label: "My Network", href: "/brand/influencers", icon: Users, mobileLabel: "Network" },
  { label: "Messages", href: "/brand/messages", icon: MessageSquare },
  { label: "Reports", href: "/brand/analytics", icon: BarChart3 },
  { label: "Finance", href: "/brand/payments", icon: Wallet },
];

const mobilePrimary: WorkspaceNavItem[] = [
  { label: "Dashboard", href: "/brand/dashboard", icon: Home },
  { label: "Campaigns", href: "/brand/campaigns", icon: Target },
  { label: "Network", href: "/brand/influencers", icon: Users },
  { label: "Messages", href: "/brand/messages", icon: MessageSquare },
];

const routeTitle: Record<string, string> = {
  "/brand/dashboard": "Dashboard",
  "/brand/campaigns": "Campaigns",
  "/brand/campaigns/new": "New Campaign",
  "/brand/discover": "Discover",
  "/brand/influencers": "My Network",
  "/brand/analytics": "Reports",
  "/brand/messages": "Messages",
  "/brand/payments": "Finance",
  "/brand/settings": "Settings",
};

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pageTitle = useRouteTitle(routeTitle, "Brand Workspace", [
    { prefix: "/brand/campaigns/", title: "Campaign Detail" },
    { prefix: "/brand/discover/", title: "Creator Detail" },
    { prefix: "/brand/promotions/", title: "Collaboration Detail" },
  ]);

  const name = user?.brandName || user?.name || "Brand User";
  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <WorkspaceShell
      roleLabel="Brand"
      workspaceLabel="Brand workspace"
      pageTitle={pageTitle}
      brandIcon={Building}
      accountName={name}
      accountMeta={user?.email || "Brand account"}
      accountInitials={initials || "B"}
      accountAvatar={user?.profilePicture}
      sidebarItems={sidebarItems}
      mobilePrimary={mobilePrimary}
      settingsHref="/brand/settings"
      menuLinks={[
        { label: "Brand profile", href: "/brand/profile" },
        { label: "Account settings", href: "/brand/settings" },
      ]}
    >
      {children}
    </WorkspaceShell>
  );
}
