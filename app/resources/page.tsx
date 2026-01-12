import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminResourcesList } from "@/components/admin/admin-resources-list"
import { CreateResourceDialog } from "@/components/admin/create-resource-dialog"
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

  // Get unique categories
  const categories = [...new Set((resources || []).map((r) => r.category))].sort()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Resources</h1>
          <p className="text-muted-foreground">Create and manage hotel documentation and procedures</p>
        </div>
        <CreateResourceDialog categories={categories} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{resources?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {resources && resources.length > 0
                ? new Date(Math.max(...resources.map((r) => new Date(r.updated_at).getTime()))).toLocaleDateString()
                : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      <AdminResourcesList resources={(resources as Resource[]) || []} categories={categories} />
    </div>
  )
}