"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  LogOut,
  Settings,
  Users,
  Building2,
  BookOpen,
  FileText,
  MessageSquareWarning,
  Bell,
} from "lucide-react"
import { useEffect, useState } from "react"

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const supabase = createClient()

      // Get all notifications
      const { data: notifications } = await supabase.from("notifications").select("id")

      // Get user's read notifications
      const { data: reads } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", profile.id)

      const readIds = new Set(reads?.map((r) => r.notification_id) || [])
      const unread = (notifications || []).filter((n) => !readIds.has(n.id)).length
      setUnreadCount(unread)
    }

    fetchUnreadCount()

    // Subscribe to notification changes
    const supabase = createClient()
    const channel = supabase
      .channel("notifications-sidebar")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, fetchUnreadCount)
      .on("postgres_changes", { event: "*", schema: "public", table: "notification_reads" }, fetchUnreadCount)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile.id])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const staffLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/notes", label: "Handover Notes", icon: ClipboardList },
    { href: "/dashboard/calendar", label: "Calendar View", icon: CalendarDays },
    { href: "/dashboard/complaints", label: "Complaints", icon: MessageSquareWarning },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell, badge: unreadCount }, // Added notifications link with badge
    { href: "/dashboard/resources", label: "Resources", icon: BookOpen },
  ]

  const adminLinks = [
    { href: "/admin", label: "Admin Dashboard", icon: Settings },
    { href: "/admin/users", label: "Manage Users", icon: Users },
    { href: "/admin/departments", label: "Departments", icon: Building2 },
    { href: "/admin/notifications", label: "Manage Notifications", icon: Bell }, // Added admin notifications link
    { href: "/admin/resources", label: "Manage Resources", icon: FileText },
  ]

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex items-center justify-center gap-4 border-b px-4 py-2">
        <div className="flex h-full w-full items-center justify-center">
          <Image
            src="/logo/hobson.png"
            alt="Hobson Logo"
            width={196}
            height={128}
            className="object-contain"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Staff</p>
        {staffLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === link.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <link.icon className="h-4 w-4" />
            <span className="flex-1">{link.label}</span>
            {"badge" in link && link.badge > 0 && (
              <span
                className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-medium px-1.5",
                  pathname === link.href
                    ? "bg-primary-foreground text-primary"
                    : "bg-destructive text-destructive-foreground",
                )}
              >
                {link.badge > 99 ? "99+" : link.badge}
              </span>
            )}
          </Link>
        ))}

        {profile.role === "admin" && (
          <>
            <p className="px-3 py-2 pt-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Admin</p>
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {profile.full_name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 mt-2 text-muted-foreground cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

        <div className="flex flex-col h-16 px-6 items-left justify-center border-t">
  <p className="text-xs text-muted-foreground mb-1">Powered by</p>
  <Image
    src="/logo/playvenu-logo.png"
    alt="Playvenu Logo"
    width={80}
    height={32}
    className="object-contain"
  />
</div>

    </aside>
  )
}