"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Plus,
  Star,
  Users,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

const managedCreators = [
  { name: "John Doe", handle: "@johndoe", followers: "45.2K", campaigns: 3, rating: 4.8 },
  { name: "Sarah Gaming", handle: "@sarahgames", followers: "89.1K", campaigns: 2, rating: 4.9 },
  { name: "Alex Photo", handle: "@alexphotos", followers: "32.5K", campaigns: 1, rating: 4.6 },
]

export default function ManagerDashboard() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8">
      {/* Header Banner */}
      <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)] backdrop-blur-md">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="rounded-full border-0 bg-[color:var(--vooki-blue-soft)] px-3 py-1 text-xs font-medium text-[color:var(--vooki-blue)]">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                Manager Workspace
              </Badge>
              <Badge className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] px-3 py-1 text-xs font-medium text-[color:var(--vooki-app-text-muted)]">
                Multi-Creator Roster
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)] sm:text-3xl">
              Talent Roster Control Center
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--vooki-app-text-soft)]">
              Coordinate creator partnerships, review incoming brand offers, and track payouts seamlessly.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button className="h-11 rounded-full bg-[color:var(--vooki-app-inverse-surface)] px-5 font-medium text-[color:var(--vooki-app-inverse-text)] shadow-sm hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" /> Add creator
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Portfolio Revenue", value: "₹8,94,500", delta: "+18% this month", icon: TrendingUp },
          { title: "Active Creators", value: "24", delta: "+3 onboarded recently", icon: Users },
          { title: "Active Collaborations", value: "16", delta: "5 launching this week", icon: Sparkles },
          { title: "Delivery Health", value: "96%", delta: "On-time delivery rate", icon: CheckCircle },
        ].map((metric) => (
          <Card
            key={metric.title}
            className="rounded-[24px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-5 shadow-[var(--vooki-shadow-app)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">
                {metric.title}
              </p>
              <metric.icon className="h-4 w-4 text-[color:var(--vooki-accent-strong)]" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
              {metric.value}
            </p>
            <p className="mt-1 text-xs text-[color:var(--vooki-accent-strong)] font-medium">
              {metric.delta}
            </p>
          </Card>
        ))}
      </div>

      {/* Roster Queue */}
      <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
        <CardHeader className="p-6 pb-4 sm:p-8 sm:pb-4">
          <CardTitle className="text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">
            Roster & Operations Queue
          </CardTitle>
          <CardDescription className="text-sm text-[color:var(--vooki-app-text-soft)]">
            Manage creator profiles, monitor active brand campaigns, and clear pending actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
          <Tabs defaultValue="creators" className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-[20px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-1">
              <TabsTrigger
                value="creators"
                className="rounded-[14px] py-2.5 text-sm font-medium text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-[color:var(--vooki-app-surface-card)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] data-[state=active]:shadow-xs"
              >
                Managed Creators
              </TabsTrigger>
              <TabsTrigger
                value="campaigns"
                className="rounded-[14px] py-2.5 text-sm font-medium text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-[color:var(--vooki-app-surface-card)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] data-[state=active]:shadow-xs"
              >
                Active Campaigns
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="rounded-[14px] py-2.5 text-sm font-medium text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-[color:var(--vooki-app-surface-card)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] data-[state=active]:shadow-xs"
              >
                Pending Actions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="creators" className="mt-5 space-y-3">
              {managedCreators.map((creator) => (
                <div
                  key={creator.handle}
                  className="rounded-[20px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-4 transition-all hover:border-[color:var(--vooki-app-border-strong)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-[color:var(--vooki-app-text-strong)]">
                        {creator.name}
                      </p>
                      <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                        {creator.handle}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs sm:text-right">
                      <div>
                        <p className="text-[color:var(--vooki-app-text-muted)]">Followers</p>
                        <p className="font-semibold text-[color:var(--vooki-app-text-strong)]">
                          {creator.followers}
                        </p>
                      </div>
                      <div>
                        <p className="text-[color:var(--vooki-app-text-muted)]">Campaigns</p>
                        <p className="font-semibold text-[color:var(--vooki-app-text-strong)]">
                          {creator.campaigns}
                        </p>
                      </div>
                      <div className="inline-flex items-center justify-end gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        <span className="font-semibold text-[color:var(--vooki-app-text-strong)]">
                          {creator.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="campaigns" className="mt-5 space-y-3">
              {[
                { title: "Spring Collection Launch", owner: "John Doe", progress: "2/3 deliverables", budget: "₹42,000" },
                { title: "Tech Unboxing Series", owner: "Sarah Gaming", progress: "3/4 deliverables", budget: "₹36,000" },
              ].map((campaign) => (
                <div
                  key={campaign.title}
                  className="flex items-center justify-between rounded-[20px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-4"
                >
                  <div>
                    <p className="font-semibold text-[color:var(--vooki-app-text-strong)]">
                      {campaign.title}
                    </p>
                    <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                      {campaign.owner} • {campaign.progress}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                    {campaign.budget}
                  </span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="pending" className="mt-5 space-y-3">
              {[
                { icon: AlertTriangle, text: "Brand counter offer review required", time: "2h ago" },
                { icon: Clock, text: "Deliverable draft ready for client approval", time: "5h ago" },
                { icon: CheckCircle, text: "Direct payment mark confirmed by Brand", time: "1d ago" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center justify-between rounded-[20px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-[color:var(--vooki-accent-strong)]" />
                    <p className="text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                      {item.text}
                    </p>
                  </div>
                  <span className="text-xs text-[color:var(--vooki-app-text-muted)]">
                    {item.time}
                  </span>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions & Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app)]">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
              Manager Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 p-0">
            <Button
              variant="outline"
              className="h-12 justify-start rounded-[16px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-sm font-medium text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
            >
              <Users className="mr-2 h-4 w-4 text-[color:var(--vooki-app-text-muted)]" /> Add creator
            </Button>
            <Button
              variant="outline"
              className="h-12 justify-start rounded-[16px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-sm font-medium text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
            >
              <Calendar className="mr-2 h-4 w-4 text-[color:var(--vooki-app-text-muted)]" /> Schedule review
            </Button>
            <Button
              variant="outline"
              className="h-12 justify-start rounded-[16px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-sm font-medium text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
              asChild
            >
              <Link href="/manager/reports">
                <Eye className="mr-2 h-4 w-4 text-[color:var(--vooki-app-text-muted)]" /> Open reports
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-12 justify-start rounded-[16px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-sm font-medium text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
              asChild
            >
              <Link href="/manager/messages">
                <MessageSquare className="mr-2 h-4 w-4 text-[color:var(--vooki-app-text-muted)]" /> Team messages
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] p-6 shadow-[var(--vooki-shadow-app)]">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
              Recent Roster Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            {[
              "John Doe uploaded final draft for review",
              "New creator media kit updated",
              "Direct payment confirmed for Sarah Gaming",
              "New brand invite received for Alex Photo",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[16px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-3 text-xs font-medium text-[color:var(--vooki-app-text-soft)]"
              >
                {item}
              </div>
            ))}
            <Button
              className="mt-2 h-11 w-full rounded-full bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border)] text-xs font-semibold text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
              asChild
            >
              <Link href="/manager/reports">
                View detailed roster activity <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}