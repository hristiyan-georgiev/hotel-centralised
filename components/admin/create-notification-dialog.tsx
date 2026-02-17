"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, AlertTriangle, Bell, Info } from "lucide-react"

export function CreateNotificationDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState<string>("normal")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setLoading(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from("notifications").insert({
      title: title.trim(),
      content: content.trim(),
      priority,
      created_by: user?.id,
    })

    setLoading(false)
    setOpen(false)
    setTitle("")
    setContent("")
    setPriority("normal")
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          New Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Bell className="h-3.5 w-3.5" />
              Staff Communications
            </div>
            <DialogTitle className="text-xl tracking-tight">Create Notification</DialogTitle>
            <DialogDescription className="text-sm">Broadcast an announcement to all staff members.</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Important Update"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                placeholder="Enter the full notification message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="bg-white"
                required
              />
            </div>
          </section>

          <section className="space-y-3 rounded-xl border bg-card p-4">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-full cursor-pointer bg-white" id="priority">
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
            <Button className="cursor-pointer" type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="cursor-pointer" type="submit" disabled={loading || !title.trim() || !content.trim()}>
              {loading ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
