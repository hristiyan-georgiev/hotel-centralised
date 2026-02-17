import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile, ScheduleTask } from "@/lib/types"
import { StaffTasksBoard } from "@/components/tasks/staff-tasks-board"

export default async function TasksPage() {
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

  const { data: tasks } = await supabase
    .from("schedule_tasks")
    .select(`
      *,
      assignee:profiles!schedule_tasks_assigned_to_fkey(id, full_name, email),
      department:departments(id, name),
      creator:profiles!schedule_tasks_created_by_fkey(id, full_name)
    `)
    .order("due_date", { ascending: true })
    .order("due_time", { ascending: true })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <StaffTasksBoard profile={profile as Profile} tasks={(tasks as ScheduleTask[]) || []} />
    </div>
  )
}
