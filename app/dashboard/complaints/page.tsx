import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ComplaintsList } from "@/components/complaints/complaints-list"
import type { Complaint, Profile, Department } from "@/lib/types"

export default async function ComplaintsPage() {
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

  // Fetch all complaints with related data
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

  // Get comment counts for each complaint
  const complaintsWithCounts = await Promise.all(
    (complaints || []).map(async (complaint) => {
      const { count } = await supabase
        .from("complaint_comments")
        .select("*", { count: "exact", head: true })
        .eq("complaint_id", complaint.id)
      return { ...complaint, comment_count: count || 0 }
    }),
  )

  // Fetch all staff for assignment dropdown
  const { data: staffMembers } = await supabase.from("profiles").select("id, full_name, email").order("full_name")

  // Fetch departments
  const { data: departments } = await supabase.from("departments").select("*").order("name")

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Complaints</h1>
        <p className="text-muted-foreground mt-1">Track and manage guest complaints and issues</p>
      </div>

      <ComplaintsList
        complaints={(complaintsWithCounts as Complaint[]) || []}
        profile={profile as Profile}
        staffMembers={(staffMembers as Profile[]) || []}
        departments={(departments as Department[]) || []}
      />
    </div>
  )
}
