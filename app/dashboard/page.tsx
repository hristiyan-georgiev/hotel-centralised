import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ClipboardList, 
  AlertTriangle, 
  MessageSquareWarning, 
  Bell, 
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Calendar,
  Users,
  Sparkles
} from "lucide-react"
import { UrgentNotesCard } from "@/components/dashboard/urgent-notes-card"
import { RecentNotificationsCard } from "@/components/dashboard/recent-notifications-card"
import { OpenComplaintsCard } from "@/components/dashboard/open-complaints-card"
import type { HandoverNote, Notification, Complaint } from "@/lib/types"

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

  return (
    <div className="p-6 space-y-6 mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Badge variant="outline" className="hidden sm:flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {profile.role}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/notes">
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">{totalToday}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Today's Notes</p>
                  {urgentCount > 0 && (
                    <Badge variant="destructive" className="mt-2 text-xs">
                      {urgentCount} urgent
                    </Badge>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <ClipboardList className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/complaints">
          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-600 group-hover:text-orange-700 transition-colors">{openComplaints.length}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Open Complaints</p>
                  {urgentComplaints > 0 && (
                    <Badge variant="destructive" className="mt-2 text-xs">
                      {urgentComplaints} urgent
                    </Badge>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                  <MessageSquareWarning className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/notifications">
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-600 group-hover:text-purple-700 transition-colors">{unreadNotifications}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Unread Alerts</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {recentNotifications.length} in last 7 days
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Bell className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xl font-bold text-emerald-600 truncate">
                  {profile.department?.name || "Not assigned"}
                </p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Your Department</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 shrink-0">
                <Users className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <UrgentNotesCard notes={(todayNotes || []) as HandoverNote[]} />
        <RecentNotificationsCard notifications={recentNotifications as Notification[]} />
        <OpenComplaintsCard complaints={(complaints || []) as Complaint[]} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/calendar">
          <Card className="hover:border-primary/50 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">Calendar View</p>
                    <p className="text-sm text-muted-foreground">View notes by date</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/schedule">
          <Card className="hover:border-primary/50 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">Team Schedule</p>
                    <p className="text-sm text-muted-foreground">View staff rotas</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/resources">
          <Card className="hover:border-primary/50 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">Resources</p>
                    <p className="text-sm text-muted-foreground">Browse guides & docs</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
