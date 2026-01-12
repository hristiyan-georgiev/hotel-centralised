import { createClient } from "@/lib/supabase/server"
import { BookOpen, FolderOpen, Clock } from "lucide-react"
import type { Resource } from "@/lib/types"
import { ResourcesList } from "@/components/resources/resources-list"
import { Card, CardContent } from "@/components/ui/card"

export default async function ResourcesPage() {
  const supabase = await createClient()

  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .order("category", { ascending: true })
    .order("title", { ascending: true })

  // Group resources by category
  const groupedResources = (resources || []).reduce(
    (acc, resource) => {
      const category = resource.category || "General"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(resource)
      return acc
    },
    {} as Record<string, Resource[]>,
  )

  const categories = Object.keys(groupedResources).sort()

  // Get most recently updated resource
  const mostRecent = resources && resources.length > 0
    ? new Date(Math.max(...resources.map((r) => new Date(r.updated_at).getTime())))
    : null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
        <p className="text-muted-foreground mt-1">Hotel procedures, policies, and reference materials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <ResourcesList groupedResources={groupedResources} categories={categories} />
    </div>
  )
}
