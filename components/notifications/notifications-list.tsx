"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, BellOff, Check, CheckCheck, AlertTriangle, Info, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/types"

interface NotificationsListProps {
  notifications: Notification[]
  userId: string
}

export function NotificationsList({ notifications, userId }: NotificationsListProps) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [marking, setMarking] = useState<string | null>(null)

  const unreadNotifications = notifications.filter((n) => !n.is_read)
  const readNotifications = notifications.filter((n) => n.is_read)

  const markAsRead = async (notificationId: string) => {
    setMarking(notificationId)
    const supabase = createClient()

    await supabase.from("notification_reads").insert({
      notification_id: notificationId,
      user_id: userId,
    })

    router.refresh()
    setMarking(null)
  }

  const markAllAsRead = async () => {
    setMarking("all")
    const supabase = createClient()

    const unreadIds = unreadNotifications.map((n) => n.id)
    const inserts = unreadIds.map((id) => ({
      notification_id: id,
      user_id: userId,
    }))

    await supabase.from("notification_reads").insert(inserts)

    router.refresh()
    setMarking(null)
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

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const priorityConfig = getPriorityConfig(notification.priority)
    const PriorityIcon = priorityConfig.icon
    const isExpanded = expandedId === notification.id

    return (
      <Card className={cn("transition-all", !notification.is_read && "border-l-4 border-l-primary bg-primary/5")}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  notification.is_read ? "bg-muted" : "bg-primary/10",
                )}
              >
                {notification.is_read ? (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Bell className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base font-semibold">{notification.title}</CardTitle>
                  <Badge className={cn("shrink-0", priorityConfig.color)}>
                    <PriorityIcon className="h-3 w-3 mr-1" />
                    {priorityConfig.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.created_at).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {notification.creator?.full_name && <span> · Posted by {notification.creator.full_name}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!notification.is_read && (
                <Button
                  className="cursor-pointer"
                  size="sm"
                  variant="outline"
                  onClick={() => markAsRead(notification.id)}
                  disabled={marking === notification.id}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {marking === notification.id ? "..." : "Mark read"}
                </Button>
              )}
              <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => setExpandedId(isExpanded ? null : notification.id)}>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="pl-11 border-l-2 border-muted ml-4">
              <p className="text-sm text-foreground whitespace-pre-wrap pl-4">{notification.content}</p>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="unread">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="unread" className="gap-2 cursor-pointer">
              <Bell className="h-4 w-4" />
              Unread
              {unreadNotifications.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read" className="gap-2 cursor-pointer">
              <BellOff className="h-4 w-4" />
              Read
              <Badge variant="outline" className="ml-1">
                {readNotifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2 cursor-pointer">
              All
              <Badge variant="outline" className="ml-1">
                {notifications.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {unreadNotifications.length > 0 && (
            <Button className="cursor-pointer" variant="outline" size="sm" onClick={markAllAsRead} disabled={marking === "all"}>
              <CheckCheck className="h-4 w-4 mr-2" />
              {marking === "all" ? "Marking..." : "Mark all as read"}
            </Button>
          )}
        </div>

        <TabsContent value="unread" className="mt-4 space-y-3">
          {unreadNotifications.length === 0 ? (
            <Card className="p-8 text-center">
              <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-muted-foreground">You have no unread notifications</p>
            </Card>
          ) : (
            unreadNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="read" className="mt-4 space-y-3">
          {readNotifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No read notifications</p>
              <p className="text-muted-foreground">Notifications you've read will appear here</p>
            </Card>
          ) : (
            readNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-3">
          {notifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No notifications yet</p>
              <p className="text-muted-foreground">Management announcements will appear here</p>
            </Card>
          ) : (
            notifications.map((notification) => <NotificationCard key={notification.id} notification={notification} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
