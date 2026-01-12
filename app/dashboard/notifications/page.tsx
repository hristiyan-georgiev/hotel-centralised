import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NotificationsList } from "@/components/notifications/notifications-list"
import type { Notification } from "@/lib/types"

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated with announcements from management
          {unreadCount > 0 && <span className="ml-2 text-destructive font-medium">({unreadCount} unread)</span>}
        </p>
      </div>

      <NotificationsList notifications={notificationsWithReadStatus as Notification[]} userId={user.id} />
    </div>
  )
}
