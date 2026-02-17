import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NotificationsList } from "@/components/notifications/notifications-list"
import { Card, CardContent } from "@/components/ui/card"
import type { Notification } from "@/lib/types"
import { Bell, BellRing, CircleAlert, Clock3 } from "lucide-react"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Fetch all notifications with creator info
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*, creator:created_by(full_name)")
    .order("created_at", { ascending: false })

  // Fetch user's read notifications
  const { data: reads } = await supabase.from("notification_reads").select("notification_id").eq("user_id", user.id)

  const readIds = new Set(reads?.map((r) => r.notification_id) || [])

  // Mark notifications with read status
  const notificationsWithReadStatus = (notifications || []).map((n) => ({
    ...n,
    is_read: readIds.has(n.id),
  }))

  const unreadCount = notificationsWithReadStatus.filter((n) => !n.is_read).length
  const urgentCount = notificationsWithReadStatus.filter((n) => n.priority === "urgent").length

  const todayDate = new Date().toISOString().split("T")[0]
  const todayCount = notificationsWithReadStatus.filter((n) => n.created_at.startsWith(todayDate)).length

  const latestUpdateLabel =
    notificationsWithReadStatus.length > 0
      ? new Date(notificationsWithReadStatus[0].created_at).toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "No notifications published"

  return (
    <div className="min-h-full bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full space-y-6">
        <Card className="border-border/70 bg-gradient-to-r from-slate-500/10 via-background to-background shadow-sm">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Team-wide announcements, operational updates, and priority alerts in one focused feed.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">Unread</p>
                <p className="mt-1 text-xl font-semibold">{unreadCount}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">Urgent</p>
                <p className="mt-1 text-xl font-semibold">{urgentCount}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">Published Today</p>
                <p className="mt-1 text-xl font-semibold">{todayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/70">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BellRing className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Unread queue</p>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} announcement${unreadCount === 1 ? "" : "s"} to review` : "You are fully caught up"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <CircleAlert className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">Priority alerts</p>
                <p className="text-xs text-muted-foreground">
                  {urgentCount > 0 ? `${urgentCount} urgent notice${urgentCount === 1 ? "" : "s"} currently listed` : "No urgent notices right now"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Clock3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Last published</p>
                <p className="text-xs text-muted-foreground">{latestUpdateLabel}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <NotificationsList notifications={notificationsWithReadStatus as Notification[]} userId={user.id} />
      </div>
    </div>
  )
}
