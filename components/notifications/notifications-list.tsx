"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, BellOff, Check, CheckCheck, AlertTriangle, Info, ChevronDown, ChevronUp, Search } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")

  const unreadNotifications = notifications.filter((n) => !n.is_read)
  const readNotifications = notifications.filter((n) => n.is_read)

  const filterNotifications = (list: Notification[]) => {
    if (!searchQuery) return list
    const query = searchQuery.toLowerCase()

    return list.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.priority.toLowerCase().includes(query) ||
        n.creator?.full_name?.toLowerCase().includes(query),
    )
  }

  const filteredUnreadNotifications = filterNotifications(unreadNotifications)
  const filteredReadNotifications = filterNotifications(readNotifications)
  const filteredAllNotifications = filterNotifications(notifications)

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
          badgeClass: "border-destructive/30 bg-destructive/10 text-destructive",
          icon: AlertTriangle,
          label: "Urgent",
        }
      case "low":
        return {
          badgeClass: "border-border bg-muted text-muted-foreground",
          icon: Info,
          label: "Low",
        }
      default:
        return {
          badgeClass: "border-primary/30 bg-primary/10 text-primary",
          icon: Bell,
          label: "Normal",
        }
    }
  }

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const priorityConfig = getPriorityConfig(notification.priority)
    const PriorityIcon = priorityConfig.icon
    const isExpanded = expandedId === notification.id
    const timestampLabel = new Date(notification.created_at).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    return (
      <Card
        className={cn(
          "border-border/70 transition-all",
          !notification.is_read && "border-primary/30 bg-primary/[0.03] shadow-sm",
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                  notification.is_read
                    ? "border-border bg-muted text-muted-foreground"
                    : "border-primary/30 bg-primary/10 text-primary",
                )}
              >
                {notification.is_read ? (
                  <BellOff className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base font-semibold">{notification.title}</CardTitle>
                  {!notification.is_read && <Badge className="border-primary/30 bg-primary/10 text-primary">New</Badge>}
                  <Badge variant="outline" className={cn("shrink-0", priorityConfig.badgeClass)}>
                    <PriorityIcon className="h-3 w-3 mr-1" />
                    {priorityConfig.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {timestampLabel}
                  {notification.creator?.full_name && <span> · Posted by {notification.creator.full_name}</span>}
                </p>
                {!isExpanded && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{notification.content}</p>}
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
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <CardContent className="pt-0">
              <div className="rounded-lg border border-border/70 bg-white/50 p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{notification.content}</p>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="unread">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="unread" className="gap-2 cursor-pointer data-[state=inactive]:hover:bg-white/40">
              <Bell className="h-4 w-4" />
              Unread
              {unreadNotifications.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read" className="gap-2 cursor-pointer data-[state=inactive]:hover:bg-white/40">
              <BellOff className="h-4 w-4" />
              Read
              <Badge variant="outline" className="ml-1">
                {readNotifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2 cursor-pointer data-[state=inactive]:hover:bg-white/40">
              All
              <Badge variant="outline" className="ml-1">
                {notifications.length}
              </Badge>
            </TabsTrigger>
          </TabsList>


          <div className="flex items-center gap-2">
            {unreadNotifications.length > 0 && (
              <Button className="cursor-pointer bg-white" variant="outline" size="sm" onClick={markAllAsRead} disabled={marking === "all"}>
                <CheckCheck className="h-4 w-4 mr-2" />
                {marking === "all" ? "Marking..." : "Mark all as read"}
              </Button>
            )}
            <div className="relative w-full sm:max-w-xs bg-white">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <TabsContent value="unread" className="mt-4 space-y-3">
          {filteredUnreadNotifications.length === 0 ? (
            <Card className="border-border/70 p-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-muted">
                <BellOff className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">{searchQuery ? "No matches found" : "All caught up"}</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No unread notifications match your search." : "No unread notifications at the moment."}
              </p>
            </Card>
          ) : (
            filteredUnreadNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="read" className="mt-4 space-y-3">
          {filteredReadNotifications.length === 0 ? (
            <Card className="border-border/70 p-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">{searchQuery ? "No matches found" : "No read notifications"}</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No read notifications match your search."
                  : "Announcements you open will appear in this tab."}
              </p>
            </Card>
          ) : (
            filteredReadNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-3">
          {filteredAllNotifications.length === 0 ? (
            <Card className="border-border/70 p-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">{searchQuery ? "No matches found" : "No notifications yet"}</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No notifications match your search."
                  : "Management announcements will appear here."}
              </p>
            </Card>
          ) : (
            filteredAllNotifications.map((notification) => <NotificationCard key={notification.id} notification={notification} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
