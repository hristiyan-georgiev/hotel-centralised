"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, AlertCircle, CheckCircle2, MessageSquare, Clock, User, AlertTriangle, TrendingUp } from "lucide-react"
import type { Complaint, Profile, Department } from "@/lib/types"
import { CreateComplaintDialog } from "./create-complaint-dialog"
import { ComplaintDetailDialog } from "./complaint-detail-dialog"

interface ComplaintsListProps {
  complaints: Complaint[]
  profile: Profile
  staffMembers: Profile[]
  departments: Department[]
}

export function ComplaintsList({ complaints, profile, staffMembers, departments }: ComplaintsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
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
      className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group"
      onClick={() => setSelectedComplaint(complaint)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">{complaint.title}</CardTitle>
              {complaint.priority === "urgent" && (
                <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
              )}
            </div>
            <CardDescription className="line-clamp-2 text-sm">{complaint.description}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end shrink-0">
            <Badge variant="outline" className={`${priorityColors[complaint.priority]} font-medium`}>
              {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
            </Badge>
            {complaint.assignee && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{complaint.assignee.full_name?.split(" ")[0]}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {complaint.guest_name && (
              <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded">
                <User className="h-3.5 w-3.5" />
                <span className="font-medium">{complaint.guest_name}</span>
                {complaint.room_number && (
                  <span className="text-primary font-semibold">• Room {complaint.room_number}</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
              <span className="text-muted-foreground/50">at</span>
              <span>{new Date(complaint.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            {(complaint.comment_count ?? 0) > 0 && (
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{complaint.comment_count} {complaint.comment_count === 1 ? "comment" : "comments"}</span>
              </div>
            )}
          </div>
          {complaint.department && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {complaint.department.name}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="cursor-pointer" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Complaint
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-600">{openComplaints.length}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Open Complaints</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10">
                <AlertCircle className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-red-600">{urgentCount}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Urgent Priority</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-600">{resolvedComplaints.length}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Resolved</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
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
            <div className="grid gap-4">
              {filterComplaints(resolvedComplaints).map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateComplaintDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        profile={profile}
        staffMembers={staffMembers}
        departments={departments}
        onSuccess={() => router.refresh()}
      />

      {selectedComplaint && (
        <ComplaintDetailDialog
          complaint={selectedComplaint}
          open={!!selectedComplaint}
          onOpenChange={(open) => !open && setSelectedComplaint(null)}
          profile={profile}
          staffMembers={staffMembers}
          onSuccess={() => {
            setSelectedComplaint(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
