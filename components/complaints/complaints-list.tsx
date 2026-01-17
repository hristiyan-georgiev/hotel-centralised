"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, AlertCircle, CheckCircle2, MessageSquare, Clock, User, AlertTriangle, TrendingUp } from "lucide-react"
import type { Complaint, Profile, Department, ComplaintTag } from "@/lib/types"
import { ComplaintDetailDialog } from "./complaint-detail-dialog"

interface ComplaintsListProps {
  complaints: Complaint[]
  profile: Profile
  staffMembers: Profile[]
  departments: Department[]
  availableTags: ComplaintTag[]
}

export function ComplaintsList({ complaints, profile, staffMembers, departments, availableTags }: ComplaintsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
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

  const urgentCount = openComplaints.filter((c) => c.priority === "urgent").length

  const ComplaintCard = ({ complaint }: { complaint: Complaint }) => (
    <Card
      className="cursor-pointer hover:border-foreground/20 transition-colors group"
      onClick={() => setSelectedComplaint(complaint)}
    >
      <CardContent className="px-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">{complaint.title}</CardTitle>              {complaint.priority === "urgent" && (
                <Badge variant="outline" className={`${priorityColors[complaint.priority]} text-xs font-medium`}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Urgent
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-6">{complaint.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {complaint.guest_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {complaint.guest_name}
                  {complaint.room_number && (
                    <span className="text-foreground font-medium">• Rm {complaint.room_number}</span>
                  )}
                </span>
              )}
              {complaint.assignee && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Assigned: <span className="text-foreground">{complaint.assignee.full_name?.split(" ")[0]}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(complaint.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                {" • "}
                {new Date(complaint.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              {(complaint.comment_count ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {complaint.comment_count}
                </span>
              )}
            </div>
          </div>
        </div>
        {(complaint.department || (complaint.tags && complaint.tags.length > 0)) && (
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t">
            {complaint.department && (
              <Badge variant="secondary" className="font-normal">
                {complaint.department.name}
              </Badge>
            )}
            {complaint.tags && complaint.tags.length > 0 && (
              <>
                {complaint.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="font-normal text-xs"
                    style={{ borderColor: tag.color, color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-foreground">{openComplaints.length}</span>
              <span>open</span>
            </div>
          </div>
          {urgentCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="font-medium text-foreground">{urgentCount}</span>
                <span>urgent</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium text-foreground">{resolvedComplaints.length}</span>
              <span>resolved</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="open" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="open" className="gap-2 cursor-pointer">
            <AlertCircle className="h-4 w-4" />
            Open <span className="ml-1 text-xs">({openComplaints.length})</span>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-2 cursor-pointer">
            <CheckCircle2 className="h-4 w-4" />
            Resolved <span className="ml-1 text-xs">({resolvedComplaints.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {filterComplaints(openComplaints).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-green-500/10 mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <p className="text-lg font-medium mb-1">All clear!</p>
                <p className="text-muted-foreground text-sm">No open complaints at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filterComplaints(openComplaints).map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {filterComplaints(resolvedComplaints).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium mb-1">No resolved complaints</p>
                <p className="text-muted-foreground text-sm">Resolved complaints will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filterComplaints(resolvedComplaints).map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))}
            </div>
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
