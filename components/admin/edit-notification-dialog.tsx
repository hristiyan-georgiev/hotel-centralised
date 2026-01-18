"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Bell, Info } from "lucide-react"
import type { Notification } from "@/lib/types"

interface EditNotificationDialogProps {
  notification: Notification
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditNotificationDialog({ notification, open, onOpenChange }: EditNotificationDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(notification.title)
  const [content, setContent] = useState(notification.content)
  const [priority, setPriority] = useState(notification.priority)

  useEffect(() => {
    setTitle(notification.title)
    setContent(notification.content)
    setPriority(notification.priority)
  }, [notification])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setLoading(true)
    const supabase = createClient()

    await supabase
      .from("notifications")
      .update({
        title: title.trim(),
        content: content.trim(),
        priority,
        updated_at: new Date().toISOString(),
      })
      .eq("id", notification.id)

    setLoading(false)
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Notification</DialogTitle>
            <DialogDescription>
              Update this notification. Staff who have already read it will not see changes as unread.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-content">Message</Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "normal" | "urgent")}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="low">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      Low Priority
                    </div>
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="normal">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      Normal
                    </div>
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="urgent">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button className="cursor-pointer" type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="cursor-pointer" type="submit" disabled={loading || !title.trim() || !content.trim()}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
