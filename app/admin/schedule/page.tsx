import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminScheduleManager } from "@/components/admin/admin-schedule-manager"
import type { Profile, Department, Shift, ScheduleEvent, ScheduleTask } from "@/lib/types"

export default async function AdminSchedulePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, department:departments(*)")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch all shifts
  const { data: shifts } = await supabase
    .from("shifts")
    .select(`
      *,
      staff:profiles!shifts_staff_id_fkey(id, full_name, email),
      department:departments(id, name)
    `)
    .order("shift_date", { ascending: false })
    .limit(100)

  // Fetch all events
  const { data: events } = await supabase
    .from("schedule_events")
    .select(`
      *,
      department:departments(id, name)
    `)
    .order("event_date", { ascending: false })
    .limit(100)

  // Fetch all tasks
  const { data: tasks } = await supabase
    .from("schedule_tasks")
    .select(`
      *,
      assignee:profiles!schedule_tasks_assigned_to_fkey(id, full_name, email),
      department:departments(id, name)
    `)
    .order("due_date", { ascending: false })
    .limit(100)

  // Fetch departments
  const { data: departments } = await supabase.from("departments").select("*").order("name")

  // Fetch staff
  const { data: staffMembers } = await supabase
    .from("profiles")
    .select("id, full_name, email, department_id")
    .order("full_name")

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Manage Schedule</h1>
        <p className="text-muted-foreground">Create and manage shifts, events, and tasks for staff</p>
      </div>

      <AdminScheduleManager
        shifts={(shifts as Shift[]) || []}
        events={(events as ScheduleEvent[]) || []}
        tasks={(tasks as ScheduleTask[]) || []}
        departments={(departments as Department[]) || []}
        staffMembers={(staffMembers as Profile[]) || []}
      />
    </div>
  )
}
