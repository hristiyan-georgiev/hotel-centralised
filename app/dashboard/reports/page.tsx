import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ComplaintsReportView } from "@/components/reports/complaints-report-view"
import type { Complaint, Profile, Department, ComplaintTag } from "@/lib/types"

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

  // Fetch tags for each complaint
  const complaintsWithTags = await Promise.all(
    (complaints || []).map(async (complaint) => {
      const { data: tagMappings } = await supabase
        .from("complaint_tag_mappings")
        .select("tag_id, complaint_tags(*)")
        .eq("complaint_id", complaint.id)
      
      const tags = tagMappings?.map((mapping: any) => mapping.complaint_tags).filter(Boolean) || []
      return { ...complaint, tags }
    })
  )

  // Fetch departments for filtering
  const { data: departments } = await supabase.from("departments").select("*").order("name")

  // Fetch all available tags
  const { data: availableTags } = await supabase.from("complaint_tags").select("*").order("name")

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate and analyze complaints reports with visual insights</p>
      </div>

      <ComplaintsReportView
        complaints={(complaintsWithTags as Complaint[]) || []}
        departments={(departments as Department[]) || []}
        availableTags={(availableTags as ComplaintTag[]) || []}
        profile={profile as Profile}
      />
    </div>
  )
}
