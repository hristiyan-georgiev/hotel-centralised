"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { Clock, User, Building2, CheckCircle2, Briefcase, FileText, PlayCircle } from "lucide-react"
import type { Profile, ScheduleTask } from "@/lib/types"

interface TaskDetailDialogProps {
  task: ScheduleTask | null
  profile: Profile
  onClose: () => void
  onAcknowledge: (taskId: string) => void
  onUpdateStatus: (taskId: string, status: string) => void
}

export function TaskDetailDialog({ task, profile, onClose, onAcknowledge, onUpdateStatus }: TaskDetailDialogProps) {
  if (!task) return null

  const isMyTask = task.assigned_to === profile.id
  const canAcknowledge = isMyTask && !task.acknowledged
  const canUpdateStatus = isMyTask && task.status !== "completed"

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            {task.title}
          </DialogTitle>
          <DialogDescription>Due: {format(parseISO(task.due_date), "EEEE, MMMM d, yyyy")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={task.priority === "urgent" ? "destructive" : task.priority === "low" ? "secondary" : "default"}
            >
              {task.priority}
            </Badge>
            <Badge
              variant="outline"
              className={
                task.status === "completed"
                  ? "border-green-500 text-green-600"
                  : task.status === "in_progress"
                    ? "border-blue-500 text-blue-600"
                    : ""
              }
            >
              {task.status === "in_progress" ? "In Progress" : task.status}
            </Badge>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned to</p>
              <p className="font-medium">{task.assignee?.full_name || "Unassigned"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {task.due_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Time</p>
                  <p className="font-medium">{task.due_time.slice(0, 5)}</p>
                </div>
              </div>
            )}
            {task.department && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{task.department.name}</p>
                </div>
              </div>
            )}
          </div>

          {task.description && (
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Description</p>
              </div>
              <p className="text-sm">{task.description}</p>
            </div>
          )}

          {isMyTask && (
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">Acknowledgment</span>
              {task.acknowledged ? (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Acknowledged
                </div>
              ) : (
                <Badge variant="secondary">Pending</Badge>
              )}
            </div>
          )}

          {task.completed_at && (
            <p className="text-xs text-muted-foreground text-center">
              Completed on {format(parseISO(task.completed_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {canAcknowledge && (
            <Button className="cursor-pointer" onClick={() => onAcknowledge(task.id)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Acknowledge Task
            </Button>
          )}
          {canUpdateStatus && (
            <div className="flex gap-2">
              {task.status === "pending" && (
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent cursor-pointer"
                  onClick={() => onUpdateStatus(task.id, "in_progress")}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Task
                </Button>
              )}
              <Button
                variant={task.status === "in_progress" ? "default" : "outline"}
                className="flex-1 cursor-pointer"
                onClick={() => onUpdateStatus(task.id, "completed")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            </div>
          )}
          <Button className="cursor-pointer" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
