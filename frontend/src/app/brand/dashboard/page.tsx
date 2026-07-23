"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/hooks/useAuth"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Plus,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"

const campaignRows = [
  {
    title: "Spring Launch Burst",
    creator: "John Doe",
    budget: "$4,200",
    reach: "121K",
    status: "In Progress",
    due: "Feb 26",
  },
  {
    title: "Creator Testimonial Series",
    creator: "Mina Styles",
    budget: "$3,600",
    reach: "89K",
    status: "Content Review",
    due: "Mar 02",
  },
  {
    title: "Feature Deep-Dive Reels",
    creator: "Alex Motion",
    budget: "$2,900",
    reach: "74K",
    status: "In Progress",
    due: "Mar 05",
  },
]

function BrandDashboardContent() {
  const { user } = useAuth();
  const brandName = user?.brandName || "Campaign Operations";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8">
      {/* <Card className="border-white/60 bg-white/85 shadow-xl shadow-cyan-100/40 backdrop-blur-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <Badge className="border-0 bg-cyan-100 text-cyan-900 hover:bg-cyan-100">Brand Command Center</Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{brandName}</h1>
            <p className="mt-1 text-sm text-slate-600">Monitor spend, creator output, and campaign momentum in one place.</p>
          </div>
          <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> New campaign
          </Button>
        </CardContent>
      </Card> */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total Spend", value: "$45,230", delta: "+12%" },
          { title: "Active Campaigns", value: "12", delta: "3 launching soon" },
          { title: "Partner Creators", value: "89", delta: "+15 this month" },
          { title: "Average ROI", value: "4.2x", delta: "+0.3x QoQ" },
        ].map((metric) => (
          <Card key={metric.title} className="border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">{metric.title}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
              <p className="mt-1 text-xs text-emerald-600">{metric.delta}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Campaign Flow</CardTitle>
          <CardDescription className="text-slate-600">Operational view for active and pending collaborations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl border border-slate-200 bg-white p-1">
              <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-slate-100">Active</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-slate-100">Pending</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-slate-100">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4 space-y-3">
              {campaignRows.map((campaign) => (
                <div key={campaign.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{campaign.title}</p>
                      <p className="text-sm text-slate-500">Creator: {campaign.creator}</p>
                      <Badge className="mt-2 border-0 bg-cyan-100 text-cyan-700 hover:bg-cyan-100">{campaign.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm sm:text-right">
                      <div>
                        <p className="text-slate-500">Budget</p>
                        <p className="font-semibold text-slate-900">{campaign.budget}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Reach</p>
                        <p className="font-semibold text-slate-900">{campaign.reach}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Due</p>
                        <p className="font-semibold text-slate-900">{campaign.due}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="pending" className="mt-4 space-y-3">
              {[
                { title: "Creator whitelisting request", owner: "Partnership Team", eta: "Today" },
                { title: "Contract revision approval", owner: "Legal", eta: "Tomorrow" },
              ].map((task) => (
                <div key={task.title} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <p className="text-sm text-slate-500">Owner: {task.owner}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{task.eta}</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="mt-4 space-y-3">
              {[
                { title: "Holiday creator bundle", roi: "5.1x", result: "234K total reach" },
                { title: "Weekend challenge sprint", roi: "4.8x", result: "9.2% engagement" },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.result}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{item.roi}</span>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

    </div>
  )
}

export default function BrandDashboard() {
  return (
    <ProtectedRoute requiredRole="brand">
      <BrandDashboardContent />
    </ProtectedRoute>
  )
}