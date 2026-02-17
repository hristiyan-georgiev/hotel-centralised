import { createClient } from "@/lib/supabase/server"
import { BookOpen, FolderOpen, Clock3, LibraryBig } from "lucide-react"
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

  const resourceTotal = resources?.length || 0
  const categoryTotal = categories.length
  const lastUpdatedLabel = mostRecent
    ? mostRecent.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    : "N/A"

  return (
    <div className="space-y-6 p-6">
      <Card className="border-border/70 bg-gradient-to-r from-slate-500/10 via-transparent to-transparent">
        <CardContent className="flex items-start gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <LibraryBig className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Resources Library</h1>
            <p className="text-sm text-muted-foreground">
              Procedures, policies, and references for your shift.
            </p>
          </div>
        </CardContent>
      </Card>

      <ResourcesList groupedResources={groupedResources} categories={categories} />
    </div>
  )
}
