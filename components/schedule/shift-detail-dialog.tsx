"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { Clock, User, Building2, CheckCircle2, CalendarDays, FileText } from "lucide-react"
import type { Profile, Shift } from "@/lib/types"

interface ShiftDetailDialogProps {
  shift: Shift | null
  profile: Profile
  onClose: () => void
  onAcknowledge: (shiftId: string) => void
}

export function ShiftDetailDialog({ shift, profile, onClose, onAcknowledge }: ShiftDetailDialogProps) {
  if (!shift) return null

  const isMyShift = shift.staff_id === profile.id
  const canAcknowledge = isMyShift && !shift.acknowledged

  return (
    <Dialog open={!!shift} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Shift Details
          </DialogTitle>
          <DialogDescription>{format(parseISO(shift.shift_date), "EEEE, MMMM d, yyyy")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{shift.staff?.full_name || "Unassigned"}</p>
              <p className="text-sm text-muted-foreground">{shift.staff?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">
                  {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{shift.department?.name || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Badge variant={shift.shift_type === "regular" ? "secondary" : "outline"}>{shift.shift_type}</Badge>
              {shift.acknowledged ? (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmed
                </div>
              ) : (
                <Badge variant="destructive">Unconfirmed</Badge>
              )}
            </div>
          </div>

          {shift.notes && (
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Notes</p>
              </div>
              <p className="text-sm">{shift.notes}</p>
            </div>
          )}

          {shift.acknowledged && shift.acknowledged_at && (
            <p className="text-xs text-muted-foreground text-center">
              Confirmed on {format(parseISO(shift.acknowledged_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
            Close
          </Button>
          {canAcknowledge && (
            <Button className="flex-1" onClick={() => onAcknowledge(shift.id)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm Shift
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
