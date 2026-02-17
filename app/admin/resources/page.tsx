import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { AdminResourcesList } from "@/components/admin/admin-resources-list"
import { CreateResourceDialog } from "@/components/admin/create-resource-dialog"
import { ManageCategoriesDialog } from "@/components/admin/manage-categories-dialog"
import { BookOpen, FolderOpen, Clock3, LibraryBig } from "lucide-react"
import type { Resource } from "@/lib/types"

export default async function AdminResourcesPage() {
  const supabase = await createClient()

  // Check admin access
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: resources } = await supabase
    .from("resources")
    .select("*, creator:created_by(full_name)")
    .order("category", { ascending: true })
    .order("title", { ascending: true })

  // Get unique categories with resource counts
  const categoryMap = (resources || []).reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const categories = Object.keys(categoryMap).sort()

  // Get most recently updated resource
  const mostRecent = resources && resources.length > 0
    ? new Date(Math.max(...resources.map((r) => new Date(r.updated_at).getTime())))
    : null

  const resourceTotal = resources?.length || 0
  const categoryTotal = categories.length
  const lastUpdatedLabel = mostRecent
    ? mostRecent.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    : "N/A"

  return (
    <div className="space-y-6 p-6">
      <Card className="border-border/70 bg-gradient-to-r from-slate-500/10 via-transparent to-transparent">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <LibraryBig className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Resources Library</h1>
              <p className="text-sm text-muted-foreground">
                Centralized procedures, policies, and references for the operations team.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <ManageCategoriesDialog categories={categories} categoryMap={categoryMap} />
            <CreateResourceDialog categories={categories} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-semibold">{resourceTotal}</p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">Total Resources</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-semibold">{categoryTotal}</p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">Categories</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-semibold">{lastUpdatedLabel}</p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">Last Updated</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3">
                <Clock3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminResourcesList resources={(resources as Resource[]) || []} categories={categories} />
    </div>
  )
}
