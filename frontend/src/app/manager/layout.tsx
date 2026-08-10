"use client";

import type React from "react";
import {
  BarChart3,
  Briefcase,
  Calendar,
  FileText,
  Home,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";

import { useRouteTitle } from "@/hooks/useRouteTitle";
import { WorkspaceShell, type WorkspaceNavItem } from "@/components/workspace/workspace-shell";
import { useAuth } from "@/context/auth-context";

const sidebarItems: WorkspaceNavItem[] = [
  { label: "Dashboard", href: "/manager/dashboard", icon: Home },
  { label: "Influencers", href: "/manager/influencers", icon: Users },
  { label: "Campaigns", href: "/manager/campaigns", icon: TrendingUp },
  { label: "Analytics", href: "/manager/analytics", icon: BarChart3 },
  { label: "Messages", href: "/manager/messages", icon: MessageSquare },
  { label: "Contracts", href: "/manager/contracts", icon: FileText },
  { label: "Schedule", href: "/manager/schedule", icon: Calendar },
  { label: "Reports", href: "/manager/reports", icon: BarChart3 },
];

const mobilePrimary: WorkspaceNavItem[] = [
  { label: "Dashboard", href: "/manager/dashboard", icon: Home },
  { label: "Influencers", href: "/manager/influencers", icon: Users },
  { label: "Campaigns", href: "/manager/campaigns", icon: TrendingUp },
  { label: "Messages", href: "/manager/messages", icon: MessageSquare },
];

const routeTitle: Record<string, string> = {
  "/manager/dashboard": "Dashboard",
  "/manager/influencers": "Influencers",
  "/manager/campaigns": "Campaigns",
  "/manager/analytics": "Analytics",
  "/manager/messages": "Messages",
  "/manager/contracts": "Contracts",
  "/manager/schedule": "Schedule",
  "/manager/reports": "Reports",
  "/manager/settings": "Settings",
};

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pageTitle = useRouteTitle(routeTitle, "Manager Workspace");

  const name = user?.name || "Manager User";
  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <WorkspaceShell
      roleLabel="Manager"
      workspaceLabel="Manager workspace"
      pageTitle={pageTitle}
      brandIcon={Briefcase}
      brandIconAccent="var(--vooki-blue)"
      accountName={name}
      accountMeta={user?.email || "Manager account"}
      accountInitials={initials || "MG"}
      accountAvatar={user?.profilePicture}
      sidebarItems={sidebarItems}
      mobilePrimary={mobilePrimary}
      settingsHref="/manager/settings"
      menuLinks={[{ label: "Account settings", href: "/manager/settings" }]}
    >
      {children}
    </WorkspaceShell>
  );
}
