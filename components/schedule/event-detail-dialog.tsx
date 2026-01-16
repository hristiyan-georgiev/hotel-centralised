"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { Clock, MapPin, CheckCircle2, Users, FileText } from "lucide-react"
import type { Profile, ScheduleEvent } from "@/lib/types"

interface EventDetailDialogProps {
  event: ScheduleEvent | null
  profile: Profile
  onClose: () => void
  onAcknowledge: (eventId: string) => void
}

export function EventDetailDialog({ event, profile, onClose, onAcknowledge }: EventDetailDialogProps) {
  if (!event) return null

  const isAcknowledged = event.user_attendance?.acknowledged

  return (
    <Dialog open={!!event} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            {event.title}
          </DialogTitle>
          <DialogDescription>{format(parseISO(event.event_date), "EEEE, MMMM d, yyyy")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">
              {event.event_type}
            </Badge>
            {event.department ? (
              <Badge variant="secondary">{event.department.name}</Badge>
            ) : (
              <Badge variant="default">Hotel-wide</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {event.start_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {event.start_time.slice(0, 5)}
                    {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                  </p>
                </div>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
            )}
          </div>

          {event.description && (
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Description</p>
              </div>
              <p className="text-sm">{event.description}</p>
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <span className="text-sm">Your Response</span>
            {isAcknowledged ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Acknowledged
              </div>
            ) : (
              <Badge variant="secondary">Pending</Badge>
            )}
          </div>

          {event.creator && (
            <p className="text-xs text-muted-foreground text-center">Created by {event.creator.full_name}</p>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
            Close
          </Button>
          {!isAcknowledged && (
            <Button className="flex-1" onClick={() => onAcknowledge(event.id)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Acknowledge
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
