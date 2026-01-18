"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, AlertCircle, CheckCircle2, MessageSquare, Clock, User, AlertTriangle } from "lucide-react"
import type { Issue, Profile } from "@/lib/types"
import { IssueDetailDialog } from "./issue-detail-dialog"

interface IssuesListProps {
  issues: Issue[]
  profile: Profile
}

export function IssuesList({ issues, profile }: IssuesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const router = useRouter()

  const openIssues = issues.filter((i) => i.status === "open")
  const resolvedIssues = issues.filter((i) => i.status === "resolved")

  const filterIssues = (list: Issue[]) => {
    if (!searchQuery) return list
    const query = searchQuery.toLowerCase()
    return list.filter(
      (i) =>
        i.title.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query)
    )
  }

  const priorityColors = {
    low: "bg-green-500/10 text-green-600 border-green-500/20",
    normal: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    urgent: "bg-red-500/10 text-red-600 border-red-500/20",
  }

  const IssueCard = ({ issue }: { issue: Issue }) => (
    <Card
      className="cursor-pointer hover:border-foreground/20 transition-colors group"
      onClick={() => setSelectedIssue(issue)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">{issue.title}</CardTitle>
              {issue.priority === "urgent" && (
                <Badge variant="outline" className={`${priorityColors[issue.priority]} text-xs font-medium shrink-0`}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Urgent
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{issue.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {issue.creator && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {issue.creator.full_name || issue.creator.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(issue.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                {" • "}
                {new Date(issue.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              {(issue.comment_count ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {issue.comment_count}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-foreground">{openIssues.length}</span>
              <span>open</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium text-foreground">{resolvedIssues.length}</span>
              <span>resolved</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="open" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="open" className="gap-2 cursor-pointer">
            <AlertCircle className="h-4 w-4" />
            Open <span className="ml-1 text-xs">({openIssues.length})</span>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-2 cursor-pointer">
            <CheckCircle2 className="h-4 w-4" />
            Resolved <span className="ml-1 text-xs">({resolvedIssues.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {filterIssues(openIssues).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-green-500/10 mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <p className="text-lg font-medium mb-1">All clear!</p>
                <p className="text-muted-foreground text-sm">No open issues at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filterIssues(openIssues).map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {filterIssues(resolvedIssues).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium mb-1">No resolved issues</p>
                <p className="text-muted-foreground text-sm">Resolved issues will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filterIssues(resolvedIssues).map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedIssue && (
        <IssueDetailDialog
          issue={selectedIssue}
          open={!!selectedIssue}
          onOpenChange={(open: boolean) => !open && setSelectedIssue(null)}
          profile={profile}
          onSuccess={() => {
            setSelectedIssue(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
