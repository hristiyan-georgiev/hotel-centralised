"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2, Wrench, ShieldAlert, FileText } from "lucide-react"
import { toast } from "sonner"
import type { Profile } from "@/lib/types"

interface CreateIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
}

export function CreateIssueDialog({ open, onOpenChange }: CreateIssueDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normal" as "low" | "normal" | "urgent",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to create issue")
      }

      toast.success("Issue created successfully")
      onOpenChange(false)
      setFormData({
        title: "",
        description: "",
        priority: "normal",
      })
      router.refresh()
    } catch (error) {
      toast.error("Failed to create issue", {
        description: error instanceof Error ? error.message : "Unknown error"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-4xl">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Wrench className="h-3.5 w-3.5" />
              Engineering Desk
            </div>
            <DialogTitle className="text-xl tracking-tight">Create New Issue</DialogTitle>
            <DialogDescription className="text-sm">
                Capture clear details so the team can triage and resolve quickly.
              </DialogDescription>
          </DialogHeader>
          </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-6 px-6 py-6">
            <div className="space-y-5 rounded-xl border bg-background p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="title">Issue title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. AC not cooling in Room 304"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <div>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value as "low" | "normal" | "urgent" })}
                    >
                      <SelectTrigger id="priority" className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value="low">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Low
                          </div>
                        </SelectItem>
                        <SelectItem className="cursor-pointer" value="normal">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Normal
                          </div>
                        </SelectItem>
                        <SelectItem className="cursor-pointer" value="urgent">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            Urgent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What happened, where it happened, and any immediate impact on operations"
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include location, timing, and relevant details to help with faster resolution.
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Before you submit</p>
              <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                <li className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-primary" />
                  Use a clear title that can be scanned in under 2 seconds.
                </li>
                <li className="flex items-start gap-2">
                  <Wrench className="mt-0.5 h-4 w-4 text-primary" />
                  Add enough details for the next shift to act without follow-up.
                </li>
                <li className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 text-primary" />
                  Flag safety or guest-impacting issues as urgent.
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button className="cursor-pointer" type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="cursor-pointer" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Issue"
                )}
              </Button>
            </div>
          </div>

          <aside className="hidden border-l bg-muted/20 px-5 py-6 md:block">
            <div className="space-y-4">
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm font-semibold">Priority guide</p>
                <div className="mt-3 space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <p><span className="font-medium text-foreground">Low:</span> can wait for planned maintenance.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                    <p><span className="font-medium text-foreground">Normal:</span> impacts workflow and needs scheduling soon.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-rose-500" />
                    <p><span className="font-medium text-foreground">Urgent:</span> immediate risk or major guest impact.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-background p-4 text-xs text-muted-foreground">
                Issues are visible to relevant teams instantly after submission.
              </div>
            </div>
          </aside>
        </form>
      </DialogContent>
    </Dialog>
  )
}
