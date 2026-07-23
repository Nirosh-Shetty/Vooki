"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ArrowUpRight, Download, Eye, Heart, MessageCircle, Share2, TrendingDown, TrendingUp } from "lucide-react"

const earningsData = [
  { month: "Jan", earnings: 2400, collaborations: 3 },
  { month: "Feb", earnings: 1800, collaborations: 2 },
  { month: "Mar", earnings: 3200, collaborations: 4 },
  { month: "Apr", earnings: 2800, collaborations: 3 },
  { month: "May", earnings: 4100, collaborations: 5 },
  { month: "Jun", earnings: 3600, collaborations: 4 },
]

const engagementData = [
  { date: "Jan 02", views: 12000, likes: 980, comments: 45 },
  { date: "Jan 09", views: 15000, likes: 1200, comments: 67 },
  { date: "Jan 16", views: 18000, likes: 1450, comments: 89 },
  { date: "Jan 23", views: 22000, likes: 1800, comments: 112 },
  { date: "Jan 30", views: 24600, likes: 2140, comments: 141 },
]

const platformData = [
  { name: "Instagram", value: 41, color: "#06b6d4" },
  { name: "TikTok", value: 28, color: "#14b8a6" },
  { name: "YouTube", value: 22, color: "#f59e0b" },
  { name: "Pinterest", value: 9, color: "#f97316" },
]

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
}

export default function InfluencerAnalytics() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8">
      {/* <Card className="border-white/60 bg-white/85 shadow-lg shadow-cyan-100/40 backdrop-blur-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <Badge className="border-0 bg-cyan-100 text-cyan-900 hover:bg-cyan-100">Performance Summary</Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Analytics & Earnings</h1>
            <p className="mt-1 text-sm text-slate-600">Clear visibility into growth, revenue, and audience behavior.</p>
          </div>
          <Button variant="outline" className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Export report
          </Button>
        </CardContent>
      </Card> */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total Earnings", value: "$18,950", delta: "+12.5%", up: true },
          { title: "Total Reach", value: "2.4M", delta: "+8.2%", up: true },
          { title: "Engagement Rate", value: "4.8%", delta: "-0.3%", up: false },
          { title: "Active Campaigns", value: "8", delta: "+2 this week", up: true },
        ].map((item) => (
          <Card key={item.title} className="border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">{item.title}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
              <p className={`mt-1 inline-flex items-center text-xs ${item.up ? "text-emerald-600" : "text-rose-600"}`}>
                {item.up ? <TrendingUp className="mr-1 h-3.5 w-3.5" /> : <TrendingDown className="mr-1 h-3.5 w-3.5" />}
                {item.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="engagement" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl border border-slate-200 bg-white p-1">
          <TabsTrigger value="engagement" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            Engagement
          </TabsTrigger>
          <TabsTrigger value="earnings" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            Earnings
          </TabsTrigger>
          <TabsTrigger value="platforms" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            Platforms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="mt-4">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Engagement Trends</CardTitle>
              <CardDescription className="text-slate-600">Weekly performance across views, likes, and comments.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={engagementData}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="views" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="likes" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="comments" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="mt-4">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Monthly Revenue</CardTitle>
              <CardDescription className="text-slate-600">Income and collaborations trend over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={earningsData}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="earnings" fill="#0891b2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Channel Mix</CardTitle>
                <CardDescription className="text-slate-600">Where your audience engagement comes from.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={platformData} cx="50%" cy="50%" outerRadius={110} dataKey="value" label>
                      {platformData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Top Content</CardTitle>
                <CardDescription className="text-slate-600">Best performing posts in the last 30 days.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
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
                ].map((content) => (
                  <div key={content.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{content.title}</p>
                        <p className="text-sm text-slate-500">{content.platform}</p>
                      </div>
                      <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <ArrowUpRight className="mr-1 h-3 w-3" /> {content.growth}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
                      <div className="inline-flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> {content.views}
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5" /> {content.likes}
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5" /> {content.comments}
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <Share2 className="h-3.5 w-3.5" /> {content.shares}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
