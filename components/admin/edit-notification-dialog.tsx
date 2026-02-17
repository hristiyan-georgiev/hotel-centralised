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
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Bell className="h-3.5 w-3.5" />
              Staff Communications
            </div>
            <DialogTitle className="text-xl tracking-tight">Edit Notification</DialogTitle>
            <DialogDescription className="text-sm">
              Update this notification. Staff who have already read it will not see changes as unread.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-content">Message</Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="bg-white"
                required
              />
            </div>
          </section>

          <section className="space-y-3 rounded-xl border bg-card p-4">
            <Label htmlFor="edit-priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "normal" | "urgent")}>
              <SelectTrigger className="w-full cursor-pointer bg-white" id="edit-priority">
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
          </section>

          <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
            <Button className="cursor-pointer" type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="cursor-pointer" type="submit" disabled={loading || !title.trim() || !content.trim()}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
