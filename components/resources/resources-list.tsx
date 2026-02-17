"use client"

import { Fragment, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, FileText, FolderOpen } from "lucide-react"
import type { Resource } from "@/lib/types"

interface ResourcesListProps {
  groupedResources: Record<string, Resource[]>
  categories: string[]
}

export function ResourcesList({ groupedResources, categories }: ResourcesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [expandedResource, setExpandedResource] = useState<string | null>(null)

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const getCategoryLabel = (resource: Resource) => resource.category?.trim() || "General"

  const allResources = categories.flatMap((category) => groupedResources[category] || [])

  const categoryCounts = allResources.reduce(
    (acc, resource) => {
      const categoryLabel = getCategoryLabel(resource)
      acc[categoryLabel] = (acc[categoryLabel] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const sortedCategories = (categories.length > 0 ? categories : Object.keys(categoryCounts)).sort()

  const filteredResources = allResources
    .filter((resource) => selectedCategory === "all" || getCategoryLabel(resource) === selectedCategory)
    .filter((resource) => {
      if (!normalizedQuery) return true

      return (
        resource.title.toLowerCase().includes(normalizedQuery) ||
        resource.content.toLowerCase().includes(normalizedQuery) ||
        getCategoryLabel(resource).toLowerCase().includes(normalizedQuery)
      )
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
  }

  const toggleExpanded = (resourceId: string) => {
    setExpandedResource((current) => (current === resourceId ? null : resourceId))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Library Index</CardTitle>
            <CardDescription>Browse by category to quickly locate a policy or procedure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="w-full justify-between"
              onClick={() => setSelectedCategory("all")}
            >
              <span>All Resources</span>
              <Badge variant="secondary" className="ml-2 font-normal">
                {allResources.length}
              </Badge>
            </Button>

            <div className="space-y-1 pr-1 xl:max-h-[430px] xl:overflow-y-auto">
              {sortedCategories.length === 0 ? (
                <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  No categories available.
                </div>
              ) : (
                sortedCategories.map((category) => {
                  const isActive = selectedCategory === category
                  return (
                    <Button
                      type="button"
                      key={category}
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-between"
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
              <span className="font-semibold text-foreground">{allResources.length}</span> resources.
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
                <p className="text-lg font-medium mb-1">No resources match your filters</p>
                <p className="text-sm text-muted-foreground">Try another search term or switch category.</p>
              </div>
            ) : (
              <div className="max-h-[560px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow className="hover:bg-background">
                      <TableHead className="pl-5">Resource</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="min-w-[300px]">Preview</TableHead>
                      <TableHead className="text-right pr-5">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.map((resource) => {
                      const isExpanded = expandedResource === resource.id

                      return (
                        <Fragment key={resource.id}>
                          <TableRow>
                            <TableCell className="pl-5 py-4 align-top">
                              <div className="space-y-1">
                                <p className="font-medium leading-tight">{resource.title}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <FolderOpen className="h-3 w-3" />
                                  <span>Knowledge base entry</span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-4 align-top">
                              <Badge variant="outline" className="font-normal">
                                {getCategoryLabel(resource)}
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
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant={isExpanded ? "secondary" : "outline"}
                                  size="sm"
                                  className="h-8"
                                  onClick={() => toggleExpanded(resource.id)}
                                >
                                  {isExpanded ? "Hide" : "Read"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {isExpanded && (
                            <TableRow className="hover:bg-muted/30 bg-muted/20">
                              <TableCell colSpan={5} className="px-5 py-4 whitespace-normal">
                                <div className="rounded-md border bg-background p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                  {resource.content}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      )
                    })}
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
    </div>
  )
}
