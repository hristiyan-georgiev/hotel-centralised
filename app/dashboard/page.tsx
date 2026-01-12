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
  Calendar
} from "lucide-react"
import { NotesList } from "@/components/dashboard/notes-list"
import { CreateNoteButton } from "@/components/dashboard/create-note-button"
import type { HandoverNote, Profile, Category } from "@/lib/types"

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

  // Get categories for the create form
  const { data: categories } = await supabase.from("categories").select("*").order("name")

  // Get complaints stats
  const { data: complaints } = await supabase
    .from("complaints")
    .select("id, status, priority")

  const openComplaints = complaints?.filter((c) => c.status === "open").length || 0
  const urgentComplaints = complaints?.filter((c) => c.priority === "urgent" && c.status === "open").length || 0

  // Get notifications stats
  const { data: notifications } = await supabase.from("notifications").select("id")
  const { data: reads } = await supabase
    .from("notification_reads")
    .select("notification_id")
    .eq("user_id", user.id)

  const readIds = new Set(reads?.map((r) => r.notification_id) || [])
  const unreadNotifications = (notifications || []).filter((n) => !readIds.has(n.id)).length

  // Stats
  const urgentCount = todayNotes?.filter((n) => n.priority === "urgent").length || 0
  const totalToday = todayNotes?.length || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {profile.department_id && (
          <CreateNoteButton profile={profile as Profile} categories={(categories || []) as Category[]} />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-600">{totalToday}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Today's Notes</p>
                {urgentCount > 0 && (
                  <Badge variant="destructive" className="mt-2 text-xs">
                    {urgentCount} urgent
                  </Badge>
                )}
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <ClipboardList className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/complaints">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-600">{openComplaints}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Open Complaints</p>
                  {urgentComplaints > 0 && (
                    <Badge variant="destructive" className="mt-2 text-xs">
                      {urgentComplaints} urgent
                    </Badge>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10">
                  <MessageSquareWarning className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/notifications">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-600">{unreadNotifications}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Unread Notifications</p>
                  {unreadNotifications > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">Click to view</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Bell className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-emerald-600 truncate">
                  {profile.department?.name || "Not assigned"}
                </p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Your Department</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/calendar">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
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

        <Link href="/dashboard/resources">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
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

        <Link href="/dashboard/notes">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">All Notes</p>
                    <p className="text-sm text-muted-foreground">Browse by date</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Today's Handover Notes</h2>
          <Badge variant="secondary">{totalToday} notes</Badge>
        </div>
        {!profile.department_id ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                You haven't been assigned to a department yet. Contact your admin.
              </p>
            </CardContent>
          </Card>
        ) : (
          <NotesList 
            notes={(todayNotes || []) as HandoverNote[]} 
            currentUserId={user.id}
            categories={(categories || []) as Category[]}
          />
        )}
      </div>
    </div>
  )
}
