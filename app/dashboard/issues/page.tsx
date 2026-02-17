import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile, Issue } from "@/lib/types"
import { IssuesList } from "@/components/issues/issues-list"
import { CreateIssueButton } from "@/components/issues/create-issue-button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

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
      <div className="w-full space-y-6 p-6">
        <Card className="border-border/70 bg-gradient-to-r from-slate-500/10 via-transparent to-transparent">
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Issues</h1>
                <p className="text-sm text-muted-foreground">Track and manage hotel issues that need follow-up.</p>
              </div>
            </div>

            <div>
              <CreateIssueButton profile={profile as Profile} />
            </div>
          </CardContent>
        </Card>

        <IssuesList
          issues={(issuesWithCommentCount || []) as Issue[]}
          profile={profile as Profile}
        />
      </div>
    </div>
  )
}
