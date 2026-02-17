import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ScheduleView } from "@/components/schedule/schedule-view"
import type { Profile, Department, Shift, ScheduleEvent, ScheduleTask } from "@/lib/types"

export default async function SchedulePage() {
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

  if (!profile) {
    redirect("/login")
  }

  // Fetch shifts for the user's department or all if admin
  const shiftsQuery = supabase
    .from("shifts")
    .select(`
      *,
      staff:profiles!shifts_staff_id_fkey(id, full_name, email),
      department:departments(id, name),
      creator:profiles!shifts_created_by_fkey(id, full_name)
    `)
    .order("shift_date", { ascending: true })
    .order("start_time", { ascending: true })

  const { data: shifts } = await shiftsQuery

  // Fetch events (department-specific or hotel-wide)
  const eventsQuery = supabase
    .from("schedule_events")
    .select(`
      *,
      department:departments(id, name),
      creator:profiles!schedule_events_created_by_fkey(id, full_name)
    `)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true })

  const { data: events } = await eventsQuery

  // Fetch user's attendance records for events
  const { data: userAttendance } = await supabase.from("event_attendees").select("*").eq("staff_id", user.id)

  // Merge attendance into events
  const eventsWithAttendance = (events || []).map((event) => ({
    ...event,
    user_attendance: userAttendance?.find((a) => a.event_id === event.id) || null,
  }))

  // Fetch tasks assigned to the user or their department
  const tasksQuery = supabase
    .from("schedule_tasks")
    .select(`
      *,
      assignee:profiles!schedule_tasks_assigned_to_fkey(id, full_name, email),
      department:departments(id, name),
      creator:profiles!schedule_tasks_created_by_fkey(id, full_name)
    `)
    .order("due_date", { ascending: true })
    .order("priority", { ascending: false })

  const { data: tasks } = await tasksQuery

  // Fetch departments for filtering
  const { data: departments } = await supabase.from("departments").select("*").order("name")

  // Fetch staff for filtering
  const { data: staffMembers } = await supabase
    .from("profiles")
    .select("id, full_name, email, department_id")
    .order("full_name")

  return (
    <div className="p-6">
      <ScheduleView
        profile={profile as Profile}
        shifts={(shifts as Shift[]) || []}
        events={(eventsWithAttendance as ScheduleEvent[]) || []}
        tasks={(tasks as ScheduleTask[]) || []}
        departments={(departments as Department[]) || []}
        staffMembers={(staffMembers as Profile[]) || []}
      />
    </div>
  )
}
