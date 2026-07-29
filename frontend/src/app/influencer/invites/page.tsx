"use client";

import { useEffect, useMemo, useState } from "react";
import { Inbox, RefreshCw } from "lucide-react";

import { InviteCard } from "@/components/collaboration/InviteCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type InviteStatus = "pending" | "counter_offered" | "accepted" | "declined";

const tabs: { value: InviteStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "counter_offered", label: "Counters" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

export default function InfluencerInvitesPage() {
  const [activeTab, setActiveTab] = useState<InviteStatus | "all">("all");
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites/received`,
        { credentials: "include" }
      );

      if (!response.ok) throw new Error("Failed to load invites");

      const data = await response.json();
      setInvites(data.invites || []);
    } catch (error) {
      console.error(error);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvites();
  }, []);

  const filteredInvites =
    activeTab === "all" ? invites : invites.filter((invite) => invite.status === activeTab);

  const counts = useMemo(
    () => ({
      all: invites.length,
      pending: invites.filter((invite) => invite.status === "pending").length,
      counter_offered: invites.filter((invite) => invite.status === "counter_offered").length,
      accepted: invites.filter((invite) => invite.status === "accepted").length,
      declined: invites.filter((invite) => invite.status === "declined").length,
    }),
    [invites]
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Compact Header: Tabs and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Modern Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as InviteStatus | "all")}
          className="w-full sm:w-auto overflow-x-auto hide-scrollbar"
        >
          <TabsList className="flex h-auto w-max items-center justify-start gap-1 rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-1 shadow-inner">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-xl px-4 py-1.5 text-sm font-medium text-[color:var(--vooki-app-text-soft)] transition-all data-[state=active]:bg-[color:var(--vooki-app-active-bg)] data-[state=active]:text-[color:var(--vooki-app-active-text)] data-[state=active]:shadow-sm"
              >
                {tab.label}
                <span className="ml-2 rounded-full bg-[color:var(--vooki-app-bg)] px-2 py-0.5 text-xs opacity-70">
                  {counts[tab.value]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          onClick={loadInvites}
          disabled={loading}
          className="h-9 shrink-0 rounded-xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] px-4 text-xs font-semibold text-[color:var(--vooki-app-text-strong)] shadow-sm hover:bg-[color:var(--vooki-app-surface-hover)]"
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex h-32 items-center justify-center rounded-[32px] border border-dashed border-[color:var(--vooki-app-border)]">
          <div className="flex items-center gap-3 text-sm font-medium text-[color:var(--vooki-app-text-muted)]">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading your invites...
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredInvites.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)]/50 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--vooki-app-surface-strong)] shadow-inner">
            <Inbox className="h-8 w-8 text-[color:var(--vooki-app-text-muted)]" />
          </div>
          <h3 className="mt-6 text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">
            No {activeTab !== "all" ? activeTab.replace("_", " ") : ""} invites found
          </h3>
          <p className="mt-2 max-w-md text-sm text-[color:var(--vooki-app-text-soft)]">
            When brands reach out with new collaboration opportunities, they will appear here nicely formatted and ready for your decision.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {filteredInvites.map((invite) => (
          <InviteCard
            key={invite._id}
            invite={invite}
            brand={invite.brand}
            onAction={loadInvites}
          />
        ))}
      </div>
    </div>
  );
}
