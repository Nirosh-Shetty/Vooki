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
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8">
      <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-app-text-muted)]">
                Collaboration invites
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                Decide what enters your creator pipeline.
              </h2>
              <p className="mt-1 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                {filteredInvites.length}{" "}
                {activeTab === "all" ? "total" : activeTab.replace("_", " ")} invite
                {filteredInvites.length !== 1 ? "s" : ""}
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={loadInvites}
              disabled={loading}
              className="h-11 rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-4 text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as InviteStatus | "all")}
          >
            <TabsList className="grid h-auto w-full grid-cols-5 rounded-[20px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-2xl text-xs text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-[color:var(--vooki-app-active-bg)] data-[state=active]:text-[color:var(--vooki-app-active-text)] sm:text-sm"
                >
                  {tab.label} ({counts[tab.value]})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)]">
          <CardContent className="p-6 text-sm text-[color:var(--vooki-app-text-soft)]">
            Loading invites...
          </CardContent>
        </Card>
      ) : null}

      {!loading && filteredInvites.length === 0 ? (
        <Card className="rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)]">
          <CardContent className="flex flex-col items-center px-4 py-14 text-center">
            <div className="rounded-full bg-[color:var(--vooki-app-surface-strong)] p-3 text-[color:var(--vooki-app-text-soft)]">
              <Inbox className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
              No invites here yet
            </h3>
            <p className="mt-1 max-w-md text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
              New brand opportunities will appear here with clear terms, response deadlines, and a
              simple next step.
            </p>
            <Badge className="mt-4 border-0 bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)] hover:bg-[color:var(--vooki-violet-soft)]">
              Structured before chat gets messy
            </Badge>
          </CardContent>
        </Card>
      ) : null}

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
