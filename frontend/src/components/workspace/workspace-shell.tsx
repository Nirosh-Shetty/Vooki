"use client";

import type React from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Bell, ChevronRight, LogOut, MenuIcon, MoreHorizontal, Settings } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { isPathActive } from "@/hooks/useRouteTitle";

export type WorkspaceNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  mobileLabel?: string;
};

type WorkspaceMenuLink = {
  label: string;
  href: string;
};

type WorkspaceShellProps = {
  roleLabel: string;
  workspaceLabel: string;
  pageTitle: string;
  brandIcon: LucideIcon;
  brandIconAccent?: string;
  accountName: string;
  accountMeta: string;
  accountInitials: string;
  accountAvatar?: string;
  sidebarItems: WorkspaceNavItem[];
  mobilePrimary: WorkspaceNavItem[];
  settingsHref: string;
  menuLinks?: WorkspaceMenuLink[];
  children: React.ReactNode;
};

function WorkspaceSidebarItem({
  item,
  collapsed,
  pathname,
}: {
  item: WorkspaceNavItem;
  collapsed: boolean;
  pathname: string | null;
}) {
  const active = isPathActive(pathname, item.href);

  const content = (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center rounded-2xl border px-3 py-3 text-sm font-medium transition-all",
        collapsed ? "justify-center" : "justify-between gap-3",
        active
          ? "border-[color:var(--vooki-app-active-border)] bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] shadow-[var(--vooki-shadow-accent)]"
          : "border-transparent text-[color:var(--vooki-app-text-subtle)] hover:border-[color:var(--vooki-app-border-strong)] hover:bg-[color:var(--vooki-app-surface-strong)] hover:text-[color:var(--vooki-app-text-strong)]"
      )}
    >
      <div className={cn("flex items-center", collapsed ? "" : "gap-3")}>
        <item.icon className={cn("h-4 w-4", active ? "" : "opacity-80")} />
        {!collapsed && <span>{item.label}</span>}
      </div>
      {!collapsed && (
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform",
            active
              ? "text-[color:var(--vooki-app-active-icon)]"
              : "text-[color:var(--vooki-app-text-muted)] group-hover:translate-x-0.5"
          )}
        />
      )}
    </Link>
  );

  if (!collapsed) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">
        <p>{item.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function WorkspaceShell({
  roleLabel,
  workspaceLabel,
  pageTitle,
  brandIcon: BrandIcon,
  brandIconAccent = "var(--vooki-accent-strong)",
  accountName,
  accountMeta,
  accountInitials,
  accountAvatar,
  sidebarItems,
  mobilePrimary,
  settingsHref,
  menuLinks = [],
  children,
}: WorkspaceShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const mobileMoreItems = useMemo(() => {
    const mobileHrefs = new Set(mobilePrimary.map((item) => item.href));
    return [
      ...sidebarItems.filter((item) => !mobileHrefs.has(item.href)),
      { label: "Settings", href: settingsHref, icon: Settings },
    ];
  }, [mobilePrimary, settingsHref, sidebarItems]);

  const handleSignOut = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/signout`,
        {},
        { withCredentials: true }
      );
      router.push("/signin");
    } catch (error) {
      console.error("signout error:", error);
    }
  };

  return (
    <TooltipProvider>
      <div className="relative h-screen w-full overflow-hidden bg-[color:var(--vooki-app-bg)] text-[color:var(--vooki-app-text)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[color:var(--vooki-app-glow-green)] blur-3xl" />
          <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-[color:var(--vooki-app-glow-violet)] blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[color:var(--vooki-app-glow-blue)] blur-3xl" />
        </div>

        <div className="relative flex h-full">
          <aside
            className={cn(
              "hidden border-r border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] backdrop-blur-xl lg:flex lg:flex-col",
              collapsed ? "w-24" : "w-72"
            )}
          >
            <div className="flex items-center gap-3 border-b border-[color:var(--vooki-app-border)] px-5 py-5">
              <div className="flex h-11 w-11 overflow-hidden items-center justify-center rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-inverse-surface)] shadow-[var(--vooki-shadow-app-soft)] p-2">
                <img src="/images/company_logo/Vooki_logo_bgRemovedSvg.svg" alt="Vooki" className="h-full w-full object-contain" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-base font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                    Vooki
                  </p>
                  <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                    {workspaceLabel}
                  </p>
                </div>
              )}
            </div>

            {/* <div className="px-4 pt-5">
              {!collapsed && (
                <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-card)] p-4 shadow-[var(--vooki-shadow-app-soft)]">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--vooki-app-text-muted)]">
                    {roleLabel}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                    Keep outreach, conversations, delivery, and payout in one calmer workspace.
                  </p>
                </div>
              )}
            </div> */}

            <nav className="flex-1 space-y-2 px-4 py-5">
              {sidebarItems.map((item) => (
                <WorkspaceSidebarItem
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  pathname={pathname}
                />
              ))}
            </nav>

            <div className="border-t border-[color:var(--vooki-app-border)] p-4">
              <WorkspaceSidebarItem
                item={{ label: "Settings", href: settingsHref, icon: Settings }}
                collapsed={collapsed}
                pathname={pathname}
              />
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-40 border-b border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] backdrop-blur-xl">
              <div className="flex h-[4.5rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden rounded-full text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)] lg:inline-flex"
                    onClick={() => setCollapsed((value) => !value)}
                  >
                    <MenuIcon className="h-5 w-5" />
                  </Button>

                  <div className="flex items-center gap-3 lg:hidden">
                    <div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-inverse-surface)] shadow-[var(--vooki-shadow-app-soft)] p-2">
                      <img src="/images/company_logo/Vooki_logo_bgRemovedSvg.svg" alt="Vooki" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                        Vooki
                      </p>
                      <p className="text-[11px] text-[color:var(--vooki-app-text-muted)]">
                        {roleLabel}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-[color:var(--vooki-app-text-muted)]">{roleLabel}</p>
                    <p className="truncate text-lg font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                      {pageTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ThemeToggle className="rounded-full text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)]" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)]"
                  >
                    <Bell className="h-5 w-5" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-auto rounded-full border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-card)] px-2 py-1.5 text-[color:var(--vooki-app-text-strong)] shadow-[var(--vooki-shadow-app-soft)] hover:bg-[color:var(--vooki-app-surface-strong)]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--vooki-app-active-bg)] text-sm font-semibold text-[color:var(--vooki-app-active-text)] overflow-hidden shrink-0">
                            {accountAvatar ? (
                              <img src={accountAvatar} alt={accountName} className="h-full w-full object-cover" />
                            ) : (
                              accountInitials
                            )}
                          </div>
                          <div className="hidden text-left md:block">
                            <p className="text-sm font-medium">{accountName}</p>
                            <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                              {accountMeta}
                            </p>
                          </div>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-60 rounded-2xl border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)]"
                    >
                      <DropdownMenuLabel className="px-3 py-2 text-[color:var(--vooki-app-text-subtle)]">
                        Account
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {menuLinks.map((link) => (
                        <DropdownMenuItem key={link.href} asChild>
                          <Link href={link.href}>{link.label}</Link>
                        </DropdownMenuItem>
                      ))}
                      {menuLinks.length > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem onClick={handleSignOut} className="gap-2">
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            <main className="min-h-0 flex-1 overflow-auto pb-28 lg:pb-0">{children}</main>
          </div>
        </div>

        <div className="lg:hidden">
          <nav className="fixed bottom-4 left-3 right-3 z-50 rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-2 shadow-[var(--vooki-shadow-app)] backdrop-blur-xl sm:left-4 sm:right-4">
            <div className="mx-auto flex w-full max-w-md items-center justify-between gap-1">
              {mobilePrimary.map((item) => {
                const active = isPathActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-1 flex-col items-center rounded-2xl px-1 py-2.5 text-[11px] font-medium transition-colors",
                      active
                        ? "bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)]"
                        : "text-[color:var(--vooki-app-text-subtle)] hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)]"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="mt-1">{item.mobileLabel ?? item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => setShowMobileMore((value) => !value)}
                className="flex flex-1 flex-col items-center rounded-2xl px-1 py-2.5 text-[11px] font-medium text-[color:var(--vooki-app-text-subtle)] transition-colors hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)]"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="mt-1">More</span>
              </button>
            </div>
          </nav>

          {showMobileMore && (
            <>
              <div
                className="fixed inset-0 z-40 bg-[color:var(--vooki-app-overlay)]"
                onClick={() => setShowMobileMore(false)}
              />
              <div className="fixed bottom-20 left-3 right-3 z-50 rounded-[28px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-3 shadow-[var(--vooki-shadow-app)] backdrop-blur-xl sm:bottom-24 sm:left-4 sm:right-4">
                <div className="space-y-1">
                  {mobileMoreItems.map((item) => {
                    const active = isPathActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMobileMore(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors",
                          active
                            ? "bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)]"
                            : "text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-hover)]"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
