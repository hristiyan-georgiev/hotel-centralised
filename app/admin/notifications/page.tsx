import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminNotificationsList } from "@/components/admin/admin-notifications-list"
import { CreateNotificationDialog } from "@/components/admin/create-notification-dialog"
import type { Notification } from "@/lib/types"
import { Bell } from "lucide-react"

export default async function AdminNotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*, creator:created_by(full_name)")
    .order("created_at", { ascending: false })

  // Get read stats for each notification
  const { data: readStats } = await supabase.from("notification_reads").select("notification_id")

  const { data: totalUsers } = await supabase.from("profiles").select("id", { count: "exact" })

  const readCountMap = (readStats || []).reduce(
    (acc, r) => {
      acc[r.notification_id] = (acc[r.notification_id] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const notificationsWithStats = (notifications || []).map((n) => ({
    ...n,
    read_count: readCountMap[n.id] || 0,
    total_users: totalUsers?.length || 0,
  }))

  const urgentCount = notifications?.filter((n) => n.priority === "urgent").length || 0
  const thisWeekCount =
    notifications?.filter((n) => {
      const created = new Date(n.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return created > weekAgo
    }).length || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Bell className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Notifications</h1>
            <p className="text-muted-foreground text-sm">Broadcast announcements and updates to staff</p>
          </div>
        </div>
        <CreateNotificationDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{notifications?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{thisWeekCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{urgentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Staff Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUsers?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <AdminNotificationsList
        notifications={notificationsWithStats as (Notification & { read_count: number; total_users: number })[]}
      />
    </div>
  )
}
