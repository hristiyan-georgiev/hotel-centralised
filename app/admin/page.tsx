import { createClient } from "@/lib/supabase/server"
import { AdminDashboardOverview } from "@/components/admin/admin-dashboard-overview"

export default async function AdminPage() {
  const supabase = await createClient()

  const today = new Date().toISOString().split("T")[0]
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const startDate = sevenDaysAgo.toISOString().split("T")[0]

  // User stats
  const { count: usersCount } = await supabase.from("profiles").select("id", { count: "exact", head: true })
  const { count: activeUsersCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
  const { count: adminCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")

  // Department stats
  const { count: departmentsCount } = await supabase
    .from("departments")
    .select("id", { count: "exact", head: true })

  // Handover notes stats
  const { count: todayNotesCount } = await supabase
    .from("handover_notes")
    .select("id", { count: "exact", head: true })
    .eq("note_date", today)

  const { count: urgentNotesCount } = await supabase
    .from("handover_notes")
    .select("id", { count: "exact", head: true })
    .eq("note_date", today)
    .eq("priority", "urgent")

  // Complaints stats
  const { data: complaints } = await supabase.from("complaints").select("id, status, priority")
  const openComplaints = complaints?.filter((c) => c.status === "open").length || 0
  const urgentComplaints = complaints?.filter((c) => c.priority === "urgent" && c.status === "open").length || 0
  const resolvedComplaints = complaints?.filter((c) => c.status === "resolved").length || 0

  // Notifications stats
  const { count: notificationsCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })

  // Resources stats
  const { data: resources } = await supabase.from("resources").select("id, category")
  const resourcesCount = resources?.length || 0
  const categoriesCount = new Set(resources?.map((r) => r.category)).size || 0

  // Issues stats
  const { count: openIssuesCount } = await supabase
    .from("issues")
    .select("id", { count: "exact", head: true })
    .eq("status", "open")

  // Activity trend data (last 7 days)
  const { data: noteActivity } = await supabase
    .from("handover_notes")
    .select("note_date")
    .gte("note_date", startDate)
    .lte("note_date", today)

  const { data: complaintsActivity } = await supabase
    .from("complaints")
    .select("created_at")
    .gte("created_at", `${startDate}T00:00:00.000Z`)

  const { data: notificationsActivity } = await supabase
    .from("notifications")
    .select("created_at")
    .gte("created_at", `${startDate}T00:00:00.000Z`)

  const dateSequence = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sevenDaysAgo)
    date.setDate(sevenDaysAgo.getDate() + index)
    return date.toISOString().split("T")[0]
  })

  const notesByDate = new Map<string, number>()
  for (const item of noteActivity ?? []) {
    notesByDate.set(item.note_date, (notesByDate.get(item.note_date) ?? 0) + 1)
  }

  const complaintsByDate = new Map<string, number>()
  for (const item of complaintsActivity ?? []) {
    const date = item.created_at.split("T")[0]
    complaintsByDate.set(date, (complaintsByDate.get(date) ?? 0) + 1)
  }

  const notificationsByDate = new Map<string, number>()
  for (const item of notificationsActivity ?? []) {
    const date = item.created_at.split("T")[0]
    notificationsByDate.set(date, (notificationsByDate.get(date) ?? 0) + 1)
  }

  const activity = dateSequence.map((date) => {
    const dateObject = new Date(`${date}T12:00:00`)
    return {
      date: dateObject.toLocaleDateString("en-GB", { weekday: "short" }),
      fullDate: date,
      notes: notesByDate.get(date) ?? 0,
      complaints: complaintsByDate.get(date) ?? 0,
      notifications: notificationsByDate.get(date) ?? 0,
    }
  })

  return (
    <AdminDashboardOverview
      stats={{
        totalUsers: usersCount || 0,
        activeUsers: activeUsersCount || 0,
        adminUsers: adminCount || 0,
        departments: departmentsCount || 0,
        notesToday: todayNotesCount || 0,
        urgentNotesToday: urgentNotesCount || 0,
        openComplaints,
        urgentComplaints,
        totalComplaints: complaints?.length || 0,
        resolvedComplaints,
        notifications: notificationsCount || 0,
        resources: resourcesCount,
        resourceCategories: categoriesCount,
        openIssues: openIssuesCount || 0,
      }}
      activity={activity}
    />
  )
}
