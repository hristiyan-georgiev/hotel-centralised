"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquareWarning, ArrowRight, Clock, User, AlertTriangle } from "lucide-react"
import type { Complaint } from "@/lib/types"

interface OpenComplaintsCardProps {
  complaints: Complaint[]
}

export function OpenComplaintsCard({ complaints }: OpenComplaintsCardProps) {
  const openComplaints = complaints.filter((c) => c.status === "open").slice(0, 3)
  const urgentCount = openComplaints.filter((c) => c.priority === "urgent").length

  return (
    <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <MessageSquareWarning className="h-5 w-5 text-orange-500" />
            </div>
            <CardTitle className="text-lg font-semibold">Open Complaints</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {urgentCount > 0 && (
              <Badge variant="destructive" className="font-semibold text-xs">
                {urgentCount} urgent
              </Badge>
            )}
            <Badge variant="secondary" className="font-semibold">
              {openComplaints.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {openComplaints.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No open complaints</p>
          </div>
        ) : (
          <>
            {openComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="p-3 rounded-lg bg-background border border-orange-500/20 hover:border-orange-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm line-clamp-1">{complaint.title}</h4>
                  {complaint.priority === "urgent" && (
                    <Badge variant="destructive" className="text-xs shrink-0">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{complaint.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
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
                      {complaint.assignee.full_name?.split(" ")[0]}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(complaint.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
            <Link href="/dashboard/complaints">
              <Button variant="ghost" className="w-full mt-2 gap-2 cursor-pointer">
                View all complaints
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}
