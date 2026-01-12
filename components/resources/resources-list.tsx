"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronDown, ChevronUp, FileText, Clock, Layers } from "lucide-react"
import type { Resource } from "@/lib/types"

interface ResourcesListProps {
  groupedResources: Record<string, Resource[]>
  categories: string[]
}

export function ResourcesList({ groupedResources, categories }: ResourcesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedResource, setExpandedResource] = useState<string | null>(null)

  const filteredCategories = categories.filter((category) => {
    const resources = groupedResources[category]
    return resources.some(
      (r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  })

  const getFilteredResources = (category: string) => {
    return groupedResources[category].filter(
      (r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }

  const totalResources = Object.values(groupedResources).flat().length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative max-w-md flex-1 w-full">
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
            Showing {filteredCategories.reduce((acc, cat) => acc + getFilteredResources(cat).length, 0)} of {totalResources} resources
          </div>
        )}
      </div>

      {filteredCategories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-1">No resources found</p>
            <p className="text-muted-foreground text-sm">Try adjusting your search query</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredCategories.map((category) => {
            const categoryResources = getFilteredResources(category)
            return (
            <div key={category} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{category}</h3>
                    <p className="text-sm text-muted-foreground">
                      {categoryResources.length} resource{categoryResources.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {categoryResources.map((resource) => (
                  <Card 
                    key={resource.id} 
                    className={`overflow-hidden transition-all ${
                      expandedResource === resource.id 
                        ? "border-primary/50 shadow-md" 
                        : "hover:border-primary/30 hover:shadow-sm"
                    }`}
                  >
                    <CardHeader
                      className="cursor-pointer group py-4"
                      onClick={() => setExpandedResource(expandedResource === resource.id ? null : resource.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0 flex-1">
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
                              })}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="shrink-0 h-8 w-8 cursor-pointer"
                        >
                          {expandedResource === resource.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    {expandedResource === resource.id && (
                      <CardContent className="border-t bg-gradient-to-b from-secondary/30 to-secondary/10 pt-4 pb-5">
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                            {resource.content}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )
          })}
        </div>
      )}
    </div>
  )
}
