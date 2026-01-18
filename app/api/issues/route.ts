import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: issues, error } = await supabase
    .from("issues")
    .select(`
      *,
      creator:profiles!issues_created_by_fkey(id, full_name, email),
      resolver:profiles!issues_resolved_by_fkey(id, full_name, email)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

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

  return NextResponse.json(issuesWithCommentCount)
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  const { data, error } = await supabase
    .from("issues")
    .insert({
      ...body,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
