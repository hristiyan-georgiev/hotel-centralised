import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ComplaintsList } from "@/components/complaints/complaints-list"
import { CreateComplaintButton } from "@/components/complaints/create-complaint-button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, MessageSquareWarning } from "lucide-react"
import type { Complaint, Profile, Department, ComplaintTag } from "@/lib/types"

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

  // Get comment counts for each complaint
  const complaintsWithCounts = await Promise.all(
    complaintsWithTags.map(async (complaint) => {
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

  // Fetch all available tags
  const { data: availableTags } = await supabase.from("complaint_tags").select("*").order("name")

  const openComplaints = complaintsWithCounts.filter((complaint) => complaint.status === "open")
  const resolvedComplaints = complaintsWithCounts.filter((complaint) => complaint.status === "resolved")
  const urgentComplaints = openComplaints.filter((complaint) => complaint.priority === "urgent")

  return (
    <div className="space-y-6 p-6">
      <Card className="border-border/70 bg-gradient-to-r from-slate-500/10 via-transparent to-transparent">
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <MessageSquareWarning className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Complaints</h1>
              <p className="text-sm text-muted-foreground">
                Record, track, and resolve guest complaints with clear status visibility.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex flex-wrap gap-2 text-sm">
              <div className="inline-flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-muted-foreground">
                <MessageSquareWarning className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{openComplaints.length}</span>
                <span>Open</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="font-medium text-foreground">{urgentComplaints.length}</span>
                <span>Urgent</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium text-foreground">{resolvedComplaints.length}</span>
                <span>Resolved</span>
              </div>
            </div>

            <CreateComplaintButton
              profile={profile as Profile}
              staffMembers={(staffMembers as Profile[]) || []}
              departments={(departments as Department[]) || []}
              availableTags={(availableTags as ComplaintTag[]) || []}
            />
          </div>
        </CardContent>
      </Card>

      <ComplaintsList
        complaints={(complaintsWithCounts as Complaint[]) || []}
        profile={profile as Profile}
        staffMembers={(staffMembers as Profile[]) || []}
        availableTags={(availableTags as ComplaintTag[]) || []}
      />
    </div>
  )
}
