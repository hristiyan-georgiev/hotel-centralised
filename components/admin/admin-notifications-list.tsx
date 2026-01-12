"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Bell, Trash2, Edit, Users, AlertTriangle, Info, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/types"
import { EditNotificationDialog } from "@/components/admin/edit-notification-dialog"

interface AdminNotificationsListProps {
  notifications: (Notification & { read_count: number; total_users: number })[]
}

export function AdminNotificationsList({ notifications }: AdminNotificationsListProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editNotification, setEditNotification] = useState<Notification | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)

    const supabase = createClient()
    await supabase.from("notifications").delete().eq("id", deleteId)

    setDeleting(false)
    setDeleteId(null)
    router.refresh()
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "urgent":
        return {
          color: "bg-destructive text-destructive-foreground",
          icon: AlertTriangle,
          label: "Urgent",
        }
      case "low":
        return {
          color: "bg-muted text-muted-foreground",
          icon: Info,
          label: "Low",
        }
      default:
        return {
          color: "bg-primary text-primary-foreground",
          icon: Bell,
          label: "Normal",
        }
    }
  }

  if (notifications.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No notifications yet</p>
        <p className="text-muted-foreground">Create your first notification to get started</p>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {notifications.map((notification) => {
          const priorityConfig = getPriorityConfig(notification.priority)
          const PriorityIcon = priorityConfig.icon
          const readPercentage =
            notification.total_users > 0 ? Math.round((notification.read_count / notification.total_users) * 100) : 0

          return (
            <Card key={notification.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <CardTitle className="text-base font-semibold">{notification.title}</CardTitle>
                      <Badge className={cn(priorityConfig.color)}>
                        <PriorityIcon className="h-3 w-3 mr-1" />
                        {priorityConfig.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {notification.creator?.full_name && <span> · By {notification.creator.full_name}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button className="cursor-pointer"  size="sm" variant="outline" onClick={() => setEditNotification(notification)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive bg-transparent cursor-pointer"
                      onClick={() => setDeleteId(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{notification.content}</p>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{notification.read_count} read</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{notification.total_users} total staff</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${readPercentage}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground">{readPercentage}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editNotification && (
        <EditNotificationDialog
          notification={editNotification}
          open={!!editNotification}
          onOpenChange={() => setEditNotification(null)}
        />
      )}
    </>
  )
}
