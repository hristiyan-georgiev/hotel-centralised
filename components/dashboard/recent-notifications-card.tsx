"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, ArrowRight, Clock, AlertTriangle, Info } from "lucide-react"
import type { Notification } from "@/lib/types"
import { cn } from "@/lib/utils"

interface RecentNotificationsCardProps {
  notifications: Notification[]
}

export function RecentNotificationsCard({ notifications }: RecentNotificationsCardProps) {
  const recentNotifications = notifications.slice(0, 3)

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      case "low":
        return <Info className="h-3 w-3 text-blue-500" />
      default:
        return <Bell className="h-3 w-3 text-primary" />
    }
  }

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Bell className="h-5 w-5 text-purple-500" />
            </div>
            <CardTitle className="text-lg font-semibold">Recent Notifications</CardTitle>
          </div>
          <Badge variant="secondary" className="font-semibold">
            {notifications.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentNotifications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No new notifications</p>
          </div>
        ) : (
          <>
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-3 rounded-lg bg-background border hover:border-purple-500/40 transition-colors",
                  notification.is_read ? "border-border" : "border-purple-500/30 bg-purple-500/5"
                )}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="mt-0.5">{getPriorityIcon(notification.priority)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm line-clamp-1">{notification.title}</h4>
                      {!notification.is_read && (
                        <Badge variant="default" className="text-xs h-5 px-1.5">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.content}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(notification.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  {notification.priority === "urgent" && (
                    <Badge variant="destructive" className="text-xs h-5">
                      Urgent
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            <Link href="/dashboard/notifications">
              <Button variant="ghost" className="w-full mt-2 gap-2 cursor-pointer">
                View all notifications
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}
