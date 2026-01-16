import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ComplaintsReportView } from "@/components/reports/complaints-report-view"
import type { Complaint, Profile, Department } from "@/lib/types"

export default async function ReportsPage() {
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

  // Fetch all complaints with related data for reporting
  const { data: complaints } = await supabase
    .from("complaints")
    .select(`
      *,
      creator:profiles!complaints_created_by_fkey(id, full_name, email),
      assignee:profiles!complaints_assigned_to_fkey(id, full_name, email),
      resolver:profiles!complaints_resolved_by_fkey(id, full_name),
      department:departments(id, name)
    `)
    .order("created_at", { ascending: false })

  // Fetch departments for filtering
  const { data: departments } = await supabase.from("departments").select("*").order("name")

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate and analyze complaints reports with visual insights</p>
      </div>

      <ComplaintsReportView
        complaints={(complaints as Complaint[]) || []}
        departments={(departments as Department[]) || []}
        profile={profile as Profile}
      />
    </div>
  )
}
