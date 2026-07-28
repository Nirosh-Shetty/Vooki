"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpRight,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const earningsData = [
  { month: "Jan", earnings: 2400, collaborations: 3 },
  { month: "Feb", earnings: 1800, collaborations: 2 },
  { month: "Mar", earnings: 3200, collaborations: 4 },
  { month: "Apr", earnings: 2800, collaborations: 3 },
  { month: "May", earnings: 4100, collaborations: 5 },
  { month: "Jun", earnings: 3600, collaborations: 4 },
];

const engagementData = [
  { date: "Jan 02", views: 12000, likes: 980, comments: 45 },
  { date: "Jan 09", views: 15000, likes: 1200, comments: 67 },
  { date: "Jan 16", views: 18000, likes: 1450, comments: 89 },
  { date: "Jan 23", views: 22000, likes: 1800, comments: 112 },
  { date: "Jan 30", views: 24600, likes: 2140, comments: 141 },
];

const platformData = [
  { name: "Instagram", value: 41, color: "var(--vooki-accent)" },
  { name: "TikTok", value: 28, color: "var(--vooki-violet)" },
  { name: "YouTube", value: 22, color: "var(--vooki-blue)" },
  { name: "Pinterest", value: 9, color: "var(--vooki-warm)" },
];

const summaryCards = [
  {
    title: "Total earnings",
    value: "$18,950",
    delta: "+12.5%",
    up: true,
    tone: "bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]",
  },
  {
    title: "Total reach",
    value: "2.4M",
    delta: "+8.2%",
    up: true,
    tone: "bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]",
  },
  {
    title: "Engagement rate",
    value: "4.8%",
    delta: "-0.3%",
    up: false,
    tone: "bg-[color:var(--vooki-warm-soft)] text-[color:var(--vooki-warm)]",
  },
  {
    title: "Active campaigns",
    value: "8",
    delta: "+2 this week",
    up: true,
    tone: "bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue)]",
  },
];

const topContent = [
  {
    title: "Desk Setup Reel",
    platform: "Instagram",
    views: "45.2K",
    likes: "3.8K",
    comments: "234",
    shares: "89",
    growth: "+13%",
  },
  {
    title: "Morning Wellness Routine",
    platform: "YouTube",
    views: "128K",
    likes: "5.2K",
    comments: "892",
    shares: "234",
    growth: "+9%",
  },
  {
    title: "Quick Meal Prep",
    platform: "TikTok",
    views: "89.3K",
    likes: "12.1K",
    comments: "456",
    shares: "1.2K",
    growth: "+17%",
  },
];

const tooltipStyle = {
  backgroundColor: "var(--vooki-app-surface-card)",
  border: "1px solid var(--vooki-app-border)",
  borderRadius: "16px",
  color: "var(--vooki-app-text-strong)",
};

export default function InfluencerAnalytics() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card
            key={item.title}
            className="rounded-[28px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app-soft)]"
          >
            <CardContent className="p-5">
              <div
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.tone}`}
              >
                {item.title}
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                {item.value}
              </p>
              <p
                className={`mt-1 inline-flex items-center text-xs ${
                  item.up
                    ? "text-[color:var(--vooki-accent-strong)]"
                    : "text-[color:var(--vooki-warm)]"
                }`}
              >
                {item.up ? (
                  <TrendingUp className="mr-1 h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="mr-1 h-3.5 w-3.5" />
                )}
                {item.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="engagement" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-[20px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-1">
          {["engagement", "earnings", "platforms"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-2xl text-xs capitalize text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-[color:var(--vooki-app-active-bg)] data-[state=active]:text-[color:var(--vooki-app-active-text)] sm:text-sm"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="engagement" className="mt-4">
          <ChartCard
            title="Engagement trends"
            description="Weekly performance across views, likes, and comments."
          >
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={engagementData}>
                <CartesianGrid stroke="var(--vooki-app-border)" strokeDasharray="4 4" />
                <XAxis dataKey="date" stroke="var(--vooki-app-text-muted)" />
                <YAxis stroke="var(--vooki-app-text-muted)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="var(--vooki-accent)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="likes"
                  stroke="var(--vooki-violet)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="comments"
                  stroke="var(--vooki-blue)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>

        <TabsContent value="earnings" className="mt-4">
          <ChartCard
            title="Monthly revenue"
            description="Income and collaborations trend over the last 6 months."
          >
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={earningsData}>
                <CartesianGrid stroke="var(--vooki-app-border)" strokeDasharray="4 4" />
                <XAxis dataKey="month" stroke="var(--vooki-app-text-muted)" />
                <YAxis stroke="var(--vooki-app-text-muted)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="earnings" fill="var(--vooki-accent)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>

        <TabsContent value="platforms" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Channel mix" description="Where your audience engagement comes from.">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="value"
                    label
                  >
                    {platformData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
              <CardContent className="p-6 sm:p-7">
                <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-app-text-muted)]">
                  Top content
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                  The posts carrying this month.
                </h2>
                <div className="mt-6 space-y-3">
                  {topContent.map((content) => (
                    <div
                      key={content.title}
                      className="rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[color:var(--vooki-app-text-strong)]">
                            {content.title}
                          </p>
                          <p className="text-sm text-[color:var(--vooki-app-text-soft)]">
                            {content.platform}
                          </p>
                        </div>
                        <Badge className="border-0 bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)] hover:bg-[color:var(--vooki-accent-soft)]">
                          <ArrowUpRight className="mr-1 h-3 w-3" /> {content.growth}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[color:var(--vooki-app-text-soft)] sm:grid-cols-4">
                        <Metric icon={<Eye className="h-3.5 w-3.5" />} value={content.views} />
                        <Metric icon={<Heart className="h-3.5 w-3.5" />} value={content.likes} />
                        <Metric
                          icon={<MessageCircle className="h-3.5 w-3.5" />}
                          value={content.comments}
                        />
                        <Metric icon={<Share2 className="h-3.5 w-3.5" />} value={content.shares} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]">
      <CardContent className="p-6 sm:p-7">
        <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-app-text-muted)]">
          {title}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
          {description}
        </h2>
        <div className="mt-6">{children}</div>
      </CardContent>
    </Card>
  );
}

function Metric({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-[color:var(--vooki-app-text-muted)]">{icon}</span>
      {value}
    </div>
  );
}
