import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Department, Profile, ScheduleTask } from "@/lib/types"
import { AdminTaskManager } from "@/components/admin/admin-task-manager"

export default async function AdminTasksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
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

  const { data: departments } = await supabase.from("departments").select("*").order("name")
  const { data: staffMembers } = await supabase.from("profiles").select("id, full_name, email, department_id").order("full_name")

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AdminTaskManager
        tasks={(tasks as ScheduleTask[]) || []}
        departments={(departments as Department[]) || []}
        staffMembers={(staffMembers as Profile[]) || []}
      />
    </div>
  )
}
