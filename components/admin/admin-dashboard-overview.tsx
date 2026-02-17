"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  ClipboardList,
  FileText,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"

interface AdminDashboardOverviewProps {
  stats: {
    totalUsers: number
    activeUsers: number
    adminUsers: number
    departments: number
    notesToday: number
    urgentNotesToday: number
    openComplaints: number
    urgentComplaints: number
    totalComplaints: number
    resolvedComplaints: number
    notifications: number
    resources: number
    resourceCategories: number
    openIssues: number
  }
  activity: {
    date: string
    fullDate: string
    notes: number
    complaints: number
    notifications: number
  }[]
}

const activityChartConfig = {
  notes: {
    label: "Notes",
    color: "hsl(165 34% 33%)",
  },
  complaints: {
    label: "Complaints",
    color: "hsl(350 52% 44%)",
  },
  notifications: {
    label: "Notifications",
    color: "hsl(204 38% 42%)",
  },
} satisfies ChartConfig

export function AdminDashboardOverview({ stats, activity }: AdminDashboardOverviewProps) {
  const complaintResolutionRate =
    stats.totalComplaints > 0
      ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100)
      : 100

  const activeStaffRate =
    stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0

  const leadershipCoverage =
    stats.totalUsers > 0 ? Math.round((stats.adminUsers / stats.totalUsers) * 100) : 0

  const operationsLoad = activity.reduce(
    (acc, day) => acc + day.notes + day.complaints + day.notifications,
    0,
  )

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-slate-500/10 via-transparent to-transparent">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr] lg:p-8">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Admin Dashboard</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  A modern operational snapshot of staffing, service workload, and critical items requiring attention.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-border bg-background text-muted-foreground">
                <TrendingUp className="mr-1 h-3 w-3" /> {operationsLoad} activities (7 days)
              </Badge>
              <Badge variant="outline" className="border-border bg-background text-muted-foreground">
                <ShieldCheck className="mr-1 h-3 w-3" /> {leadershipCoverage}% admin coverage
              </Badge>
            </div>
          </div>

          <Card className="gap-4 border-border bg-background/80 py-5 shadow-none">
            <CardHeader className="px-5">
              <CardDescription>Today at a glance</CardDescription>
              <CardTitle>Operational status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Urgent complaints</span>
                <span className="font-semibold text-destructive">{stats.urgentComplaints}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Urgent notes</span>
                <span className="font-semibold text-foreground">{stats.urgentNotesToday}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Open issues</span>
                <span className="font-semibold text-primary">{stats.openIssues}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/users" className="group block">
          <Card className="gap-4 border-border/70 bg-card py-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="px-5 pb-0">
              <CardDescription>Team members</CardDescription>
              <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-5">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                <UserCheck className="mr-1 h-3 w-3" /> {stats.activeUsers} active
              </Badge>
              <Users className="h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/departments" className="group block">
          <Card className="gap-4 border-border/70 bg-card py-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="px-5 pb-0">
              <CardDescription>Departments</CardDescription>
              <CardTitle className="text-3xl">{stats.departments}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-5">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Cross-team coverage</Badge>
              <Building2 className="h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/resources" className="group block">
          <Card className="gap-4 border-border/70 bg-card py-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="px-5 pb-0">
              <CardDescription>Knowledge base</CardDescription>
              <CardTitle className="text-3xl">{stats.resources}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-5">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{stats.resourceCategories} categories</Badge>
              <FileText className="h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/notifications" className="group block">
          <Card className="gap-4 border-border/70 bg-card py-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="px-5 pb-0">
              <CardDescription>Alerts sent</CardDescription>
              <CardTitle className="text-3xl">{stats.notifications}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-5">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Broadcast centre</Badge>
              <Bell className="h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <Card className="gap-0 overflow-hidden border-border/70 bg-card py-0">
          <CardHeader className="border-b py-5">
            <CardTitle className="text-lg">7-day operational trend</CardTitle>
            <CardDescription>
              Notes, complaints, and notifications activity over the last week
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <ChartContainer config={activityChartConfig} className="h-[320px] w-full">
              <LineChart data={activity} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={30} tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      labelFormatter={(_, payload) => {
                        const item = payload?.[0]
                        return item?.payload?.fullDate
                          ? new Date(`${item.payload.fullDate}T12:00:00`).toLocaleDateString("en-GB", {
                              weekday: "long",
                              day: "numeric",
                              month: "short",
                            })
                          : ""
                      }}
                    />
                  }
                />
                <Line type="monotone" dataKey="notes" stroke="var(--color-notes)" strokeWidth={2.5} dot={false} />
                <Line
                  type="monotone"
                  dataKey="complaints"
                  stroke="var(--color-complaints)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="notifications"
                  stroke="var(--color-notifications)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 bg-card py-5">
            <CardHeader className="px-5 pb-2">
              <CardTitle className="text-lg">Performance indicators</CardTitle>
              <CardDescription>Quick health signals for daily operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Complaint resolution rate</span>
                  <span className="font-semibold">{complaintResolutionRate}%</span>
                </div>
                <Progress value={complaintResolutionRate} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active staff ratio</span>
                  <span className="font-semibold">{activeStaffRate}%</span>
                </div>
                <Progress value={activeStaffRate} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Admin leadership coverage</span>
                  <span className="font-semibold">{leadershipCoverage}%</span>
                </div>
                <Progress value={leadershipCoverage} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card py-5">
            <CardHeader className="px-5 pb-2">
              <CardTitle className="text-lg">Priority queue</CardTitle>
              <CardDescription>Items needing immediate follow-up</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-5">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Urgent complaints
                </div>
                <Badge variant={stats.urgentComplaints > 0 ? "destructive" : "secondary"}>
                  {stats.urgentComplaints}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Urgent handover notes
                </div>
                <Badge variant={stats.urgentNotesToday > 0 ? "destructive" : "secondary"}>
                  {stats.urgentNotesToday}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Bell className="h-4 w-4 text-primary" />
                  Open issues
                </div>
                <Badge variant={stats.openIssues > 0 ? "outline" : "secondary"}>{stats.openIssues}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/70 bg-card py-5">
        <CardHeader className="px-5 pb-2">
          <CardTitle className="text-lg">Quick actions</CardTitle>
          <CardDescription>Fast navigation to your primary admin workflows</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-5 sm:grid-cols-2 xl:grid-cols-4">
          <Button asChild className="justify-between" variant="outline">
            <Link href="/admin/users">
              Manage users
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="justify-between" variant="outline">
            <Link href="/admin/departments">
              Configure departments
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="justify-between" variant="outline">
            <Link href="/admin/schedule">
              Plan schedules
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="justify-between" variant="outline">
            <Link href="/admin/notifications">
              Send update
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
