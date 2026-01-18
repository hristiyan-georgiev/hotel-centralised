import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile, Issue } from "@/lib/types"
import { IssuesList } from "@/components/issues/issues-list"
import { CreateIssueButton } from "@/components/issues/create-issue-button"

export default async function IssuesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
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

  const { data: issues } = await supabase
    .from("issues")
    .select(`
      *,
      creator:profiles!issues_created_by_fkey(id, full_name, email),
      resolver:profiles!issues_resolved_by_fkey(id, full_name, email)
    `)
    .order("created_at", { ascending: false })

  const issuesWithCommentCount = await Promise.all(
    (issues || []).map(async (issue) => {
      const { count } = await supabase
        .from("issue_comments")
        .select("*", { count: "exact", head: true })
        .eq("issue_id", issue.id)

      return {
        ...issue,
        comment_count: count || 0,
      }
    })
  )

  return (
    <div className="h-screen overflow-auto">
      <div className="w-full p-6 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Issues</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage hotel issues that need follow-up
            </p>
          </div>
          <CreateIssueButton profile={profile as Profile} />
        </div>

        <IssuesList
          issues={(issuesWithCommentCount || []) as Issue[]}
          profile={profile as Profile}
        />
      </div>
    </div>
  )
}
