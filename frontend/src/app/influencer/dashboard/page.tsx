"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Compass,
  Heart,
  MessageCircle,
  MessageSquare,
  Sparkles,
  Wallet,
} from "lucide-react";

import { ProtectedRoute } from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const overviewStats = [
  {
    label: "Active collaborations",
    value: "6",
    note: "3 need attention this week",
    tone: "bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]",
  },
  {
    label: "Expected payout",
    value: "$9.8K",
    note: "Across current live deals",
    tone: "bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]",
  },
  {
    label: "Reply time",
    value: "2.1h",
    note: "Faster than last month",
    tone: "bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue)]",
  },
];

const todayRhythm = [
  {
    title: "Reply to feedback on the Nimbus reel",
    detail: "The brand is waiting on the final caption direction.",
    time: "Next best time: this morning",
    tone: "bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]",
  },
  {
    title: "Lock the story sequence for AeroFit",
    detail: "You already have the concept, this just needs sign-off.",
    time: "Estimated 20 minutes",
    tone: "bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]",
  },
  {
    title: "Send the weekly metrics snapshot",
    detail: "Northbeam wants a quick read on reach, saves, and replies.",
    time: "Due by tonight",
    tone: "bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue)]",
  },
];

const activeCollaborations = [
  {
    brand: "Nimbus Skincare",
    campaign: "Glow Reset Weekend",
    stage: "Draft review",
    deliverable: "Instagram reel + 2 story frames",
    due: "Due tomorrow",
    payout: "$3,400",
    progress: 82,
    tone: "bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]",
  },
  {
    brand: "AeroFit Studio",
    campaign: "Morning Mobility",
    stage: "Storyboards pending",
    deliverable: "TikTok post + usage rights review",
    due: "Due in 3 days",
    payout: "$2,150",
    progress: 64,
    tone: "bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]",
  },
  {
    brand: "Northbeam Audio",
    campaign: "Desk Setup Series",
    stage: "Ready to submit",
    deliverable: "YouTube short with caption handoff",
    due: "Final check today",
    payout: "$1,800",
    progress: 95,
    tone: "bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue)]",
  },
];

const audiencePulse = [
  {
    platform: "Instagram",
    audience: "72.4K",
    signal: "+4.6% this month",
    note: "Reels about routines and skincare are pulling the strongest saves.",
    tone: "bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]",
  },
  {
    platform: "TikTok",
    audience: "118K",
    signal: "+6.2% this month",
    note: "Short, casual voiceovers are getting the best completion rate.",
    tone: "bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]",
  },
  {
    platform: "YouTube",
    audience: "41.8K",
    signal: "+2.4% this month",
    note: "Desk setup and creator workflow clips are still performing steadily.",
    tone: "bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue)]",
  },
];

const recentWins = [
  {
    title: "Glow Reset Weekend",
    meta: "Nimbus Skincare - 2 days ago",
    result: "1.2M impressions",
  },
  {
    title: "Desk Setup Series",
    meta: "Northbeam Audio - 5 days ago",
    result: "8.1% engagement",
  },
  {
    title: "Morning Mobility",
    meta: "AeroFit Studio - 1 week ago",
    result: "34K saves",
  },
];

const quickLinks = [
  {
    title: "Review invites",
    description: "Check new opportunities and respond while interest is warm.",
    href: "/influencer/invites",
  },
  {
    title: "Open collaborations",
    description: "See current deal stages, delivery notes, and what needs attention.",
    href: "/influencer/my-collabs",
  },
  {
    title: "Check messages",
    description: "Stay close to brand conversations without losing the campaign context.",
    href: "/influencer/messages",
  },
  {
    title: "View earnings",
    description: "Keep payout visibility simple and know what is coming next.",
    href: "/influencer/earnings",
  },
];

export default function InfluencerDashboard() {
  return (
    <ProtectedRoute requiredRole="influencer">
      <InfluencerDashboardContent />
    </ProtectedRoute>
  );
}

function InfluencerDashboardContent() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "Creator";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
          <CardContent className="p-6 sm:p-8">
            {/* <div
              className="rounded-[28px] border border-[color:var(--vooki-app-border)] p-6 sm:p-7"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--vooki-accent-soft) 100%, transparent), color-mix(in srgb, var(--vooki-violet-soft) 100%, transparent) 58%, color-mix(in srgb, var(--vooki-blue-soft) 100%, transparent))",
              }}
            >
              <Badge className="w-fit border-0 bg-[color:var(--vooki-app-inverse-surface)] text-[color:var(--vooki-app-inverse-text)] hover:bg-[color:var(--vooki-app-inverse-surface)]">
                <Sparkles className="mr-1 h-3.5 w-3.5 text-[color:var(--vooki-accent-strong)]" />
                Creator dashboard
              </Badge>

              <div className="mt-5 max-w-2xl space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)] sm:text-4xl">
                  Hi {firstName}, your creator week feels focused and in motion.
                </h1>
                <p className="text-base leading-7 text-[color:var(--vooki-app-text-soft)] sm:text-lg">
                  Keep the important work visible, protect your creative energy, and move through
                  brand deals without the dashboard feeling heavy.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] px-5 text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] hover:bg-[color:var(--vooki-accent-strong)]"
                >
                  <Link href="/influencer/my-collabs">
                    Open collaborations
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-5 text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
                >
                  <Link href="/influencer/invites">
                    Review invites
                    <Compass className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div> */}

            <div className="grid gap-3 sm:grid-cols-3">
              {overviewStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 shadow-[var(--vooki-shadow-app-soft)]"
                >
                  <div
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${stat.tone}`}
                  >
                    {stat.label}
                  </div>
                  <p className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                    {stat.note}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                    This week&apos;s rhythm
                  </p>
                  <p className="text-sm text-[color:var(--vooki-app-text-soft)]">
                    2 approvals, 1 metrics handoff, 3 active brand threads.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--vooki-app-text-muted)]">
                    Closest deadline
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
                    Nimbus reel draft tomorrow
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                    A quick response today will probably keep the whole collaboration moving
                    smoothly.
                  </p>
                </div>
                <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--vooki-app-text-muted)]">
                    Energy saver
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
                    Your messages are grouped well
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                    You can clear today&apos;s collaboration replies in one short session instead of
                    bouncing between tabs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                    Brand conversations
                  </p>
                  <p className="text-sm text-[color:var(--vooki-app-text-soft)]">
                    Keep negotiation, delivery, and follow-ups close.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
                  <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                    Unread brand replies
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--vooki-app-text-strong)]">
                    4
                  </p>
                </div>
                <div className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
                  <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                    Invites waiting
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--vooki-app-text-strong)]">
                    2
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
          <CardContent className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-app-text-muted)]">
                  Today&apos;s focus
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                  Keep the day light, but intentional.
                </h2>
              </div>
              <Badge className="border-0 bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)] hover:bg-[color:var(--vooki-accent-soft)]">
                3 priority loops
              </Badge>
            </div>

            <div className="mt-6 space-y-3">
              {todayRhythm.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-base font-medium text-[color:var(--vooki-app-text-strong)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                        {item.detail}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.tone}`}
                    >
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
          <CardContent className="p-6 sm:p-7">
            <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-app-text-muted)]">
              Audience pulse
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
              Your audience is giving you clear signals.
            </h2>

            <div className="mt-6 space-y-3">
              {audiencePulse.map((platform) => (
                <div
                  key={platform.platform}
                  className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-medium text-[color:var(--vooki-app-text-strong)]">
                        {platform.platform}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)]">
                        {platform.audience} followers
                      </p>
                    </div>
                    <Badge className={`border-0 hover:opacity-100 ${platform.tone}`}>
                      {platform.signal}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                    {platform.note}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-[color:var(--vooki-app-text-soft)]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] px-3 py-2">
                <Heart className="h-3.5 w-3.5 text-[color:var(--vooki-violet)]" /> Saves are
                strongest on routine content
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] px-3 py-2">
                <MessageCircle className="h-3.5 w-3.5 text-[color:var(--vooki-blue)]" /> Replies
                rise when the tone stays casual
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
          <CardContent className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-app-text-muted)]">
                  Active collaborations
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                  See what is moving without opening six tabs.
                </h2>
              </div>
              <Button
                asChild
                variant="ghost"
                className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
              >
                <Link href="/influencer/my-collabs">View all</Link>
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {activeCollaborations.map((collab) => (
                <div
                  key={collab.campaign}
                  className="rounded-[26px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-medium text-[color:var(--vooki-app-text-strong)]">
                        {collab.campaign}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)]">
                        {collab.brand}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                        {collab.deliverable}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <Badge className={`border-0 hover:opacity-100 ${collab.tone}`}>
                        {collab.stage}
                      </Badge>
                      <p className="mt-3 text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
                        {collab.payout}
                      </p>
                      <p className="text-sm text-[color:var(--vooki-app-text-soft)]">
                        {collab.due}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 rounded-full bg-[color:var(--vooki-app-border)]">
                    <div
                      className="h-2 rounded-full bg-[color:var(--vooki-accent)]"
                      style={{ width: `${collab.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[color:var(--vooki-app-text-muted)]">
                    {collab.progress}% complete
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
            <CardContent className="p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-app-text-muted)]">
                Recent wins
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                Proof that the work is landing.
              </h2>

              <div className="mt-6 space-y-3">
                {recentWins.map((win) => (
                  <div
                    key={win.title}
                    className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4"
                  >
                    <p className="text-base font-medium text-[color:var(--vooki-app-text-strong)]">
                      {win.title}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)]">
                      {win.meta}
                    </p>
                    <p className="mt-3 text-sm font-medium text-[color:var(--vooki-accent-text)]">
                      {win.result}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
            <CardContent className="p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-app-text-muted)]">
                Quick actions
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                Start with the workflow you actually need.
              </h2>

              <div className="mt-6 space-y-3">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 transition-colors hover:bg-[color:var(--vooki-app-surface-hover)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-medium text-[color:var(--vooki-app-text-strong)]">
                          {link.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
                          {link.description}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-[color:var(--vooki-app-text-muted)]" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card> */}
        </div>
      </section>

      {/* <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-app-text-muted)]">
              A soft next step
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
              If you have 15 minutes, the best move is clearing your collaboration replies.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
              It will unblock one draft, one payment conversation, and one brand decision.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              variant="ghost"
              className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
            >
              <Link href="/influencer/messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                Open messages
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] hover:bg-[color:var(--vooki-accent-strong)]"
            >
              <Link href="/influencer/earnings">
                <Wallet className="mr-2 h-4 w-4" />
                Check payouts
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
