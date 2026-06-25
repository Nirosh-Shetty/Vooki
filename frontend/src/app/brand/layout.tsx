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

const sidebarItems: WorkspaceNavItem[] = [
  { label: "Dashboard", href: "/brand/dashboard", icon: Home },
  { label: "Campaigns", href: "/brand/campaigns", icon: Target },
  { label: "Discover", href: "/brand/discover", icon: Search },
  { label: "Collaborations", href: "/brand/influencers", icon: Users, mobileLabel: "Collabs" },
  { label: "Analytics", href: "/brand/analytics", icon: BarChart3 },
  { label: "Messages", href: "/brand/messages", icon: MessageSquare },
  { label: "Payments", href: "/brand/payments", icon: Wallet },
];

const mobilePrimary: WorkspaceNavItem[] = [
  { label: "Dashboard", href: "/brand/dashboard", icon: Home },
  { label: "Campaigns", href: "/brand/campaigns", icon: Target },
  { label: "Discover", href: "/brand/discover", icon: Search },
  { label: "Messages", href: "/brand/messages", icon: MessageSquare },
];

const routeTitle: Record<string, string> = {
  "/brand/dashboard": "Dashboard",
  "/brand/campaigns": "Campaigns",
  "/brand/campaigns/new": "New Campaign",
  "/brand/discover": "Discover",
  "/brand/influencers": "Collaborations",
  "/brand/analytics": "Analytics",
  "/brand/messages": "Messages",
  "/brand/payments": "Payments",
  "/brand/settings": "Settings",
};

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  const pageTitle = useRouteTitle(routeTitle, "Brand Workspace", [
    { prefix: "/brand/campaigns/", title: "Campaign Detail" },
    { prefix: "/brand/discover/", title: "Creator Detail" },
    { prefix: "/brand/promotions/", title: "Collaboration Detail" },
  ]);

  return (
    <WorkspaceShell
      roleLabel="Brand"
      workspaceLabel="Brand workspace"
      pageTitle={pageTitle}
      brandIcon={Building}
      accountName="TechCorp"
      accountMeta="Brand account"
      accountInitials="TC"
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
