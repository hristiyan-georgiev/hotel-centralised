"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  Search,
  CheckCircle2,
  MessageSquare,
  Clock,
  User,
  Dot,
} from "lucide-react"
import type { Issue, Profile } from "@/lib/types"
import { IssueDetailDialog } from "./issue-detail-dialog"

interface IssuesListProps {
  issues: Issue[]
  profile: Profile
}

export function IssuesList({ issues, profile }: IssuesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeStatus, setActiveStatus] = useState<"open" | "resolved">("open")
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const router = useRouter()

  const openIssues = issues.filter((i) => i.status === "open")
  const resolvedIssues = issues.filter((i) => i.status === "resolved")
  const activeIssues = activeStatus === "open" ? openIssues : resolvedIssues

  const filterIssues = (list: Issue[]) => {
    if (!searchQuery) return list
    const query = searchQuery.toLowerCase()
    return list.filter(
      (i) =>
        i.title.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query)
    )
  }

  const priorityStyles: Record<
    Issue["priority"],
    { dot: string; badge: string; label: string }
  > = {
    low: {
      dot: "text-emerald-500",
      badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      label: "Low",
    },
    normal: {
      dot: "text-amber-500",
      badge: "bg-amber-500/10 text-amber-700 border-amber-500/20",
      label: "Normal",
    },
    urgent: {
      dot: "text-rose-500",
      badge: "bg-rose-500/10 text-rose-700 border-rose-500/20",
      label: "Urgent",
    },
  }

  const visibleIssues = filterIssues(activeIssues)

  const formatTimestamp = (value: string) =>
    new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="space-y-6 w-full">
      <Tabs value={activeStatus} onValueChange={(value) => setActiveStatus(value as "open" | "resolved")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:min-w-[320px]">
            <TabsTrigger value="open" className="gap-2 cursor-pointer data-[state=inactive]:hover:bg-white/40">
              <AlertCircle className="h-4 w-4" />
              Open <span className="ml-1 text-xs">({openIssues.length})</span>
            </TabsTrigger>
            <TabsTrigger value="resolved" className="gap-2 cursor-pointer data-[state=inactive]:hover:bg-white/40">
              <CheckCircle2 className="h-4 w-4" />
              Resolved <span className="ml-1 text-xs">({resolvedIssues.length})</span>
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:max-w-xs bg-white">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Tabs>

      {visibleIssues.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              {activeStatus === "open" ? (
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              ) : (
                <MessageSquare className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <p className="text-lg font-medium mb-1">
              {activeStatus === "open" ? "No open issues" : "No resolved issues"}
            </p>
            <p className="text-muted-foreground text-sm">
              {searchQuery
                ? "Try adjusting your search criteria"
                : activeStatus === "open"
                  ? "Everything is currently under control"
                  : "Resolved issues will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden md:block overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-[minmax(0,3fr)_160px_200px_170px_100px] border-b bg-muted/30 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>Issue</span>
                <span>Priority</span>
                <span>Reported by</span>
                <span>Created</span>
                <span>Comments</span>
              </div>
              {visibleIssues.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => setSelectedIssue(issue)}
                  className="grid w-full grid-cols-[minmax(0,3fr)_160px_200px_170px_100px] items-center gap-3 border-b px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Dot className={cn("h-6 w-6 -ml-1.5", priorityStyles[issue.priority].dot)} />
                      <p className="truncate font-medium text-foreground">{issue.title}</p>
                      {issue.priority === "urgent" && (
                        <Badge variant="outline" className="h-5 text-[10px] bg-rose-500/10 text-rose-700 border-rose-500/20">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <p className="truncate pl-5 text-xs text-muted-foreground">{issue.description}</p>
                  </div>

                  <div>
                    <Badge variant="outline" className={cn("text-xs", priorityStyles[issue.priority].badge)}>
                      {priorityStyles[issue.priority].label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 min-w-0 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{issue.creator?.full_name || issue.creator?.email || "Unknown"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTimestamp(issue.created_at)}
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {issue.comment_count ?? 0}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-3 md:hidden">
            {visibleIssues.map((issue) => (
              <Card key={issue.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(issue)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">{issue.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px]", priorityStyles[issue.priority].badge)}>
                      {priorityStyles[issue.priority].label}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {issue.creator?.full_name || "Unknown"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(issue.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {issue.comment_count ?? 0}
                    </span>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </>
      )}

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
