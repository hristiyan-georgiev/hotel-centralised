import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { AdminResourcesList } from "@/components/admin/admin-resources-list"
import { CreateResourceDialog } from "@/components/admin/create-resource-dialog"
import { ManageCategoriesDialog } from "@/components/admin/manage-categories-dialog"
import { BookOpen, FolderOpen, Clock, FileText } from "lucide-react"
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manage Resources</h1>
            <p className="text-muted-foreground text-sm">Create and manage hotel documentation and procedures</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ManageCategoriesDialog categories={categories} categoryMap={categoryMap} />
          <CreateResourceDialog categories={categories} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-600">{resources?.length || 0}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Total Resources</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <BookOpen className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Categories</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10">
                <FolderOpen className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-600">
                  {mostRecent ? mostRecent.toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
                </p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Last Updated</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Clock className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminResourcesList resources={(resources as Resource[]) || []} categories={categories} />
    </div>
  )
}
