"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Pencil, Trash2, FileText, Clock, Layers } from "lucide-react"
import { toast } from "sonner"
import type { Resource } from "@/lib/types"
import { EditResourceDialog } from "./edit-resource-dialog"

interface AdminResourcesListProps {
  resources: Resource[]
  categories: string[]
}

export function AdminResourcesList({ resources, categories }: AdminResourcesListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteResource, setDeleteResource] = useState<Resource | null>(null)
  const [editResource, setEditResource] = useState<Resource | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filteredResources = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Group resources by category
  const groupedResources = filteredResources.reduce((acc, resource) => {
    const category = resource.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(resource)
    return acc
  }, {} as Record<string, Resource[]>)

  const sortedCategories = Object.keys(groupedResources).sort()

  const handleDelete = async () => {
    if (!deleteResource) return
    setDeleting(true)

    const supabase = createClient()
    const { error } = await supabase.from("resources").delete().eq("id", deleteResource.id)

    if (error) {
      toast.error("Failed to delete resource", {
        description: error.message
      })
    } else {
      toast.success("Resource deleted successfully")
    }

    setDeleteResource(null)
    setDeleting(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredResources.length} of {resources.length} resources
          </div>
        )}
      </div>

      {filteredResources.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-1">
              {resources.length === 0 ? "No resources created yet" : "No resources found"}
            </p>
            <p className="text-muted-foreground text-sm">
              {resources.length === 0 ? "Create your first resource to get started" : "Try adjusting your search query"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedCategories.map((category) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{category}</h3>
                    <p className="text-sm text-muted-foreground">
                      {groupedResources[category].length} resource{groupedResources[category].length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {groupedResources[category].map((resource) => (
                  <Card key={resource.id} className="hover:border-primary/50 hover:shadow-sm transition-all group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                          <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                            {resource.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              Updated {new Date(resource.updated_at).toLocaleDateString([], { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })} at {new Date(resource.updated_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 cursor-pointer"
                            onClick={() => setEditResource(resource)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                            onClick={() => setDeleteResource(resource)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">{resource.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteResource} onOpenChange={() => setDeleteResource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteResource?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editResource && (
        <EditResourceDialog
          resource={editResource}
          categories={categories}
          open={!!editResource}
          onOpenChange={() => setEditResource(null)}
        />
      )}
    </div>
  )
}