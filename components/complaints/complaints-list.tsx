"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, AlertCircle, CheckCircle2, MessageSquare, Clock, AlertTriangle, FileText, ArrowRight } from "lucide-react"
import type { Complaint, Profile, ComplaintTag } from "@/lib/types"
import { ComplaintDetailDialog } from "./complaint-detail-dialog"

interface ComplaintsListProps {
  complaints: Complaint[]
  profile: Profile
  staffMembers: Profile[]
  availableTags: ComplaintTag[]
}

export function ComplaintsList({ complaints, profile, staffMembers, availableTags }: ComplaintsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [focusedComplaint, setFocusedComplaint] = useState<Complaint | null>(null)
  const router = useRouter()

  const openComplaints = complaints.filter((c) => c.status === "open")
  const resolvedComplaints = complaints.filter((c) => c.status === "resolved")

  const filterComplaints = (list: Complaint[]) => {
    if (!searchQuery) return list
    const query = searchQuery.toLowerCase()
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.guest_name?.toLowerCase().includes(query) ||
        c.room_number?.toLowerCase().includes(query),
    )
  }

  const priorityColors = {
    low: "bg-green-500/10 text-green-600 border-green-500/20",
    normal: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    urgent: "bg-red-500/10 text-red-600 border-red-500/20",
  }

  const ComplaintSplitView = ({ list }: { list: Complaint[] }) => {
    const selected = focusedComplaint && list.some((c) => c.id === focusedComplaint.id) ? focusedComplaint : list[0] || null

    if (list.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-1">No complaints found</p>
            <p className="text-muted-foreground text-sm">Try adjusting your filters or search query</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-[360px_1fr] border rounded-xl overflow-hidden bg-white shadow-sm h-[calc(100vh-230px)] min-h-[430px]">
        <div className="border-r bg-muted/5 overflow-y-auto">
          {list.map((complaint) => {
            const isSelected = selected?.id === complaint.id
            return (
              <button
                type="button"
                key={complaint.id}
                onClick={() => setFocusedComplaint(complaint)}
                className={`w-full cursor-pointer hover:bg-background text-left px-4 py-3.5 border-b border-l-[3px] transition-all ${
                  isSelected
                    ? `bg-background ${complaint.priority === "urgent" ? "border-l-red-500" : "border-l-primary"}`
                    : "border-l-transparent hover:bg-background/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-xs font-semibold ${
                    complaint.priority === "urgent" ? "bg-red-500/10 text-red-600" : "bg-primary/10 text-primary"
                  }`}>
                    {complaint.creator?.full_name?.charAt(0).toUpperCase() || "G"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm truncate ${isSelected ? "font-semibold" : "font-medium"}`}>{complaint.title}</p>
                      {complaint.priority === "urgent" && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{complaint.description}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(complaint.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                      {(complaint.comment_count ?? 0) > 0 && (
                        <>
                          <span>•</span>
                          <MessageSquare className="h-3 w-3" />
                          <span>{complaint.comment_count}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {selected ? (
          <div className="overflow-y-auto">
            <div className="p-7 w-full space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold leading-tight">{selected.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setSelectedComplaint(selected)}>
                  Open timeline
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`${priorityColors[selected.priority]} text-xs font-medium`}>
                  {selected.priority === "urgent" && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {selected.priority.charAt(0).toUpperCase() + selected.priority.slice(1)}
                </Badge>
                <Badge variant={selected.status === "resolved" ? "secondary" : "outline"} className="text-xs">
                  {selected.status === "resolved" ? "Resolved" : "Open"}
                </Badge>
                {selected.department && <Badge variant="secondary" className="text-xs">{selected.department.name}</Badge>}
                {(selected.comment_count ?? 0) > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {selected.comment_count} comments
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y text-sm">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Guest</p>
                  <p className="font-medium">{selected.guest_name || "Not specified"}</p>
                  {selected.room_number && <p className="text-muted-foreground">Room {selected.room_number}</p>}
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Assignment</p>
                  <p className="font-medium">{selected.assignee?.full_name || "Unassigned"}</p>
                  <p className="text-muted-foreground">
                    Created by {selected.creator?.full_name || selected.creator?.email || "Unknown"}
                  </p>
                </div>
              </div>

              {selected.tags && selected.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="font-normal text-xs"
                        style={{ borderColor: tag.color, color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Tabs defaultValue="open" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:min-w-[320px]">
            <TabsTrigger value="open" className="gap-2 cursor-pointer data-[state=inactive]:hover:bg-white/40">
              <AlertCircle className="h-4 w-4" />
              Open <span className="ml-1 text-xs">({openComplaints.length})</span>
            </TabsTrigger>
            <TabsTrigger value="resolved" className="gap-2 cursor-pointer data-[state=inactive]:hover:bg-white/40">
              <CheckCircle2 className="h-4 w-4" />
              Resolved <span className="ml-1 text-xs">({resolvedComplaints.length})</span>
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full lg:max-w-md bg-white">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value="open" className="space-y-4">
          {filterComplaints(openComplaints).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 rounded-full bg-green-500/10 p-4">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <p className="mb-1 text-lg font-medium">All clear!</p>
                <p className="text-sm text-muted-foreground">No open complaints at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <ComplaintSplitView list={filterComplaints(openComplaints)} />
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {filterComplaints(resolvedComplaints).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="mb-1 text-lg font-medium">No resolved complaints</p>
                <p className="text-sm text-muted-foreground">Resolved complaints will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <ComplaintSplitView list={filterComplaints(resolvedComplaints)} />
          )}
        </TabsContent>
      </Tabs>

      {selectedComplaint && (
        <ComplaintDetailDialog
          complaint={selectedComplaint}
          open={!!selectedComplaint}
          onOpenChange={(open) => !open && setSelectedComplaint(null)}
          profile={profile}
          staffMembers={staffMembers}
          availableTags={availableTags}
          onSuccess={() => {
            setSelectedComplaint(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
