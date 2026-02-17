"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Search, Pencil, Trash2, FileText, FolderOpen } from "lucide-react"
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [deleteResource, setDeleteResource] = useState<Resource | null>(null)
  const [editResource, setEditResource] = useState<Resource | null>(null)
  const [deleting, setDeleting] = useState(false)

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const categoryCounts = resources.reduce(
    (acc, resource) => {
      acc[resource.category] = (acc[resource.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const sortedCategories = (categories.length > 0 ? categories : Object.keys(categoryCounts)).sort()

  const filteredResources = resources
    .filter((resource) => selectedCategory === "all" || resource.category === selectedCategory)
    .filter((resource) => {
      if (!normalizedQuery) return true

      return (
        resource.title.toLowerCase().includes(normalizedQuery) ||
        resource.content.toLowerCase().includes(normalizedQuery) ||
        resource.category.toLowerCase().includes(normalizedQuery)
      )
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
  }

  const handleDelete = async () => {
    if (!deleteResource) return
    setDeleting(true)

    const supabase = createClient()
    const { error } = await supabase.from("resources").delete().eq("id", deleteResource.id)

    if (error) {
      toast.error("Failed to delete resource", {
        description: error.message,
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
      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Library Index</CardTitle>
            <CardDescription>Jump to a category to find documentation faster.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="w-full justify-between cursor-pointer"
              onClick={() => setSelectedCategory("all")}
            >
              <span>All Resources</span>
              <Badge variant="secondary" className="ml-2 font-normal">
                {resources.length}
              </Badge>
            </Button>

            <div className="space-y-1 pr-1 xl:max-h-[430px] xl:overflow-y-auto">
              {sortedCategories.length === 0 ? (
                <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  No categories available yet.
                </div>
              ) : (
                sortedCategories.map((category) => {
                  const isActive = selectedCategory === category
                  return (
                    <Button
                      type="button"
                      key={category}
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-between cursor-pointer"
                      onClick={() => setSelectedCategory(category)}
                    >
                      <span className="truncate">{category}</span>
                      <Badge variant="outline" className="ml-2 font-normal">
                        {categoryCounts[category] || 0}
                      </Badge>
                    </Button>
                  )
                })
              )}
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredResources.length}</span> of{" "}
              <span className="font-semibold text-foreground">{resources.length}</span> resources.
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">Resources Directory</CardTitle>
                <CardDescription>Search by title, category, or content snippet.</CardDescription>
              </div>

              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="font-normal">
                {filteredResources.length} result{filteredResources.length !== 1 ? "s" : ""}
              </Badge>
              {selectedCategory !== "all" && (
                <Badge variant="outline" className="font-normal">
                  Category: {selectedCategory}
                </Badge>
              )}
              {(selectedCategory !== "all" || normalizedQuery) && (
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium mb-1">
                  {resources.length === 0 ? "No resources created yet" : "No resources match your filters"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {resources.length === 0
                    ? "Create your first resource to get started."
                    : "Try a different search term or switch category."}
                </p>
              </div>
            ) : (
              <div className="max-h-[560px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow className="hover:bg-background">
                      <TableHead className="pl-5">Resource</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="min-w-[320px]">Preview</TableHead>
                      <TableHead className="text-right pr-5">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="pl-5 py-4 align-top">
                          <div className="space-y-1">
                            <p className="font-medium leading-tight">{resource.title}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <FolderOpen className="h-3 w-3" />
                              <span>Library entry</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 align-top">
                          <Badge variant="outline" className="font-normal">
                            {resource.category}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-4 align-top whitespace-nowrap text-sm text-muted-foreground">
                          <span className="block">
                            {new Date(resource.updated_at).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="block text-xs">
                            {new Date(resource.updated_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </TableCell>

                        <TableCell className="py-4 align-top max-w-[460px]">
                          <p className="line-clamp-2 whitespace-normal text-sm text-muted-foreground">{resource.content}</p>
                        </TableCell>

                        <TableCell className="py-4 pr-5 align-top">
                          <div className="flex items-center justify-end gap-2">
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(searchQuery || selectedCategory !== "all") && (
        <div className="text-sm text-muted-foreground">
          Active filters applied. Use <span className="font-medium text-foreground">Clear filters</span> to reset view.
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