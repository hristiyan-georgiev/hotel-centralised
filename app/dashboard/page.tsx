import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  MessageSquareWarning,
  type LucideIcon,
} from "lucide-react"

interface DashboardMetric {
  label: string
  value: string
  helper: string
  href: string
  icon: LucideIcon
}

interface QuickLink {
  href: string
  title: string
  description: string
  icon: LucideIcon
}

interface TodaySignal {
  title: string
  count: number
  helper: string
  href: string
  icon: LucideIcon
  highlight?: "critical" | "attention"
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, department:departments(*)")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  const today = new Date().toISOString().split("T")[0]

  // Get today's notes for user's department
  const { data: todayNotes } = await supabase
    .from("handover_notes")
    .select("*, author:profiles(*), category:categories(*), department:departments(*)")
    .eq("note_date", today)
    .order("created_at", { ascending: false })

  // Get all complaints with full data
  const { data: complaints } = await supabase
    .from("complaints")
    .select(`
      *,
      assignee:profiles!complaints_assigned_to_fkey(*),
      department:departments(*)
    `)
    .order("created_at", { ascending: false })

  const openComplaints = complaints?.filter((c) => c.status === "open") || []
  const urgentComplaints = openComplaints.filter((c) => c.priority === "urgent").length

  // Get recent notifications (past 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data: allNotifications } = await supabase
    .from("notifications")
    .select("*, creator:profiles!notifications_created_by_fkey(*)")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })

  const { data: reads } = await supabase
    .from("notification_reads")
    .select("notification_id")
    .eq("user_id", user.id)

  const readIds = new Set(reads?.map((r) => r.notification_id) || [])
  const recentNotifications = (allNotifications || []).map((n) => ({
    ...n,
    is_read: readIds.has(n.id),
  }))

  const unreadNotifications = recentNotifications.filter((n) => !n.is_read).length

  // Stats
  const urgentCount = todayNotes?.filter((n) => n.priority === "urgent").length || 0
  const totalToday = todayNotes?.length || 0
  const urgentNotes = (todayNotes || []).filter((note) => note.priority === "urgent").slice(0, 4)
  const complaintQueue = openComplaints.slice(0, 4)
  const unreadQueue = recentNotifications.filter((notification) => !notification.is_read).slice(0, 4)
  const unreadUrgentNotifications = recentNotifications.filter(
    (notification) => !notification.is_read && notification.priority === "urgent",
  ).length
  const criticalItems = urgentCount + urgentComplaints + unreadUrgentNotifications
  const departmentName = profile.department?.name || "Not assigned"
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const metrics: DashboardMetric[] = [
    {
      label: "Today's notes",
      value: `${totalToday}`,
      helper: `${urgentCount} urgent`,
      href: "/dashboard/notes",
      icon: ClipboardList,
    },
    {
      label: "Open complaints",
      value: `${openComplaints.length}`,
      helper: `${urgentComplaints} urgent`,
      href: "/dashboard/complaints",
      icon: MessageSquareWarning,
    },
    {
      label: "Unread alerts",
      value: `${unreadNotifications}`,
      helper: `${recentNotifications.length} in last 7 days`,
      href: "/dashboard/notifications",
      icon: Bell,
    },
    {
      label: "Department",
      value: departmentName,
      helper: "View your profile",
      href: "/dashboard/profile",
      icon: Building2,
    },
  ]

  const quickLinks: QuickLink[] = [
    {
      href: "/dashboard/notes",
      title: "Handover Notes",
      description: "Capture and review shift updates",
      icon: ClipboardList,
    },
    {
      href: "/dashboard/notifications",
      title: "Notifications",
      description: "Track announcements and read status",
      icon: Bell,
    },
    {
      href: "/dashboard/complaints",
      title: "Complaints",
      description: "Resolve active guest complaints",
      icon: MessageSquareWarning,
    },
    {
      href: "/dashboard/calendar",
      title: "Calendar View",
      description: "Navigate notes by date",
      icon: CalendarDays,
    },
    {
      href: "/dashboard/schedule",
      title: "Schedule",
      description: "Review rota coverage",
      icon: CalendarClock,
    },
    {
      href: "/dashboard/tasks",
      title: "Tasks",
      description: "Check assignments and progress",
      icon: Briefcase,
    },
    {
      href: "/dashboard/resources",
      title: "Resources",
      description: "Open SOPs and team guides",
      icon: BookOpen,
    },
  ]

  const primaryActions: QuickLink[] = [
    {
      href: "/dashboard/notes",
      title: "Handover Notes",
      description: "Capture today’s shift updates",
      icon: ClipboardList,
    },
    {
      href: "/dashboard/complaints",
      title: "Complaints",
      description: "Review and resolve active cases",
      icon: MessageSquareWarning,
    },
    {
      href: "/dashboard/notifications",
      title: "Notifications",
      description: "Stay on top of unread alerts",
      icon: Bell,
    },
  ]

  const todaySignals: TodaySignal[] = [
    {
      title: "Urgent notes",
      count: urgentCount,
      helper: urgentCount > 0 ? "Review now in handover notes" : "No urgent notes logged",
      href: "/dashboard/notes",
      icon: AlertTriangle,
      highlight: "critical",
    },
    {
      title: "Open complaints",
      count: openComplaints.length,
      helper: `${urgentComplaints} marked urgent`,
      href: "/dashboard/complaints",
      icon: MessageSquareWarning,
      highlight: urgentComplaints > 0 ? "attention" : undefined,
    },
    {
      title: "Unread notifications",
      count: unreadNotifications,
      helper: `${unreadUrgentNotifications} urgent unread`,
      href: "/dashboard/notifications",
      icon: Bell,
      highlight: unreadUrgentNotifications > 0 ? "attention" : undefined,
    },
  ]

  const resolvedComplaints = complaints?.filter((complaint) => complaint.status === "resolved").length || 0

  return (
    <div className="min-h-full bg-background p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <Card className="border-border/70 bg-gradient-to-r from-slate-500/10 via-background to-background">
          <CardContent className="space-y-6 p-6 lg:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-3">
                  <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    A clear live overview of today&apos;s activity, complaints, and alerts.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {profile.role}
                    </Badge>
                    <Badge variant="secondary" className="font-normal">
                      {departmentName}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Today</p>
                  <p className="mt-1 text-sm font-medium">{todayLabel}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{totalToday} notes logged for handover</p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Shift status</p>
                  <p className="mt-1 text-sm font-medium">
                    {criticalItems > 0 ? `${criticalItems} priority items` : "Stable operations"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {criticalItems > 0 ? "Focus urgent queues before handover." : "No critical backlog right now."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {primaryActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {todaySignals.map((signal) => (
            <Link key={signal.title} href={signal.href} className="group">
              <Card
                className={`h-full border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                  signal.highlight === "critical"
                    ? "border-destructive/30 bg-destructive/5 hover:border-destructive/45"
                    : signal.highlight === "attention"
                      ? "border-primary/30 bg-primary/5 hover:border-primary/45"
                      : "hover:border-primary/30"
                }`}
              >
                <CardContent className="flex h-full items-start justify-between gap-3 p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{signal.title}</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight">{signal.count}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{signal.helper}</p>
                  </div>
                  <div
                    className={`rounded-lg p-2 ${
                      signal.highlight === "critical"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <signal.icon className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Today&apos;s Performance Snapshot</CardTitle>
            <CardDescription>High-level metrics for your shift and handover readiness.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Link
                key={metric.label}
                href={metric.href}
                className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="mt-1 line-clamp-1 text-2xl font-semibold tracking-tight">{metric.value}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <metric.icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{metric.helper}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          <Card className="border-border/80">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Operational Queue</CardTitle>
                  <CardDescription>What needs immediate review before end-of-shift handover.</CardDescription>
                </div>
                <Badge variant={criticalItems > 0 ? "destructive" : "secondary"}>
                  {criticalItems > 0 ? `${criticalItems} critical` : "Stable"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <section className="space-y-3 rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Urgent Notes
                </div>
                {urgentNotes.length === 0 ? (
                  <p className="rounded-lg border border-dashed bg-background px-3 py-2 text-sm text-muted-foreground">
                    No urgent notes logged for today.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {urgentNotes.map((note) => (
                      <div key={note.id} className="rounded-lg border bg-background px-3 py-2">
                        <p className="text-sm font-medium">{note.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/dashboard/notes" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Open notes
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </section>

              <section className="space-y-3 rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquareWarning className="h-4 w-4 text-primary" />
                  Open Complaints
                </div>
                {complaintQueue.length === 0 ? (
                  <p className="rounded-lg border border-dashed bg-background px-3 py-2 text-sm text-muted-foreground">
                    No open complaints at this time.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {complaintQueue.map((complaint) => (
                      <div key={complaint.id} className="rounded-lg border bg-background px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-1 text-sm font-medium">{complaint.title}</p>
                          {complaint.priority === "urgent" && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{complaint.description}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Link
                  href="/dashboard/complaints"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Open complaints
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </section>

              <section className="space-y-3 rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Bell className="h-4 w-4 text-primary" />
                  Unread Notifications
                </div>
                {unreadQueue.length === 0 ? (
                  <p className="rounded-lg border border-dashed bg-background px-3 py-2 text-sm text-muted-foreground">
                    You are all caught up.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {unreadQueue.map((notification) => (
                      <div key={notification.id} className="rounded-lg border bg-background px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-1 text-sm font-medium">{notification.title}</p>
                          {notification.priority === "urgent" && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Link
                  href="/dashboard/notifications"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Open notifications
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </section>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Jump directly into day-to-day tools.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <link.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{link.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{link.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-muted/20">
              <CardHeader>
                <CardTitle>Shift Snapshot</CardTitle>
                <CardDescription>A concise readout of current workload.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                  <span className="text-muted-foreground">Notes created today</span>
                  <span className="font-medium">{totalToday}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                  <span className="text-muted-foreground">Open complaints</span>
                  <span className="font-medium">{openComplaints.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                  <span className="text-muted-foreground">Unread notifications</span>
                  <span className="font-medium">{unreadNotifications}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                  <span className="text-muted-foreground">Resolved complaints</span>
                  <span className="font-medium">{resolvedComplaints}</span>
                </div>
                <div className="rounded-lg border border-dashed bg-background px-3 py-2 text-xs text-muted-foreground">
                  Keep this queue clear before handover to maintain service continuity.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
