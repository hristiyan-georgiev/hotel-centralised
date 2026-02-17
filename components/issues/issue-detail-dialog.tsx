"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CheckCircle2, Trash2, Send, User, Clock, Edit2, X, AlertTriangle, AlertCircle, MessageSquare, Wrench } from "lucide-react"
import { toast } from "sonner"
import type { Issue, IssueComment, Profile } from "@/lib/types"

interface IssueDetailDialogProps {
  issue: Issue
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
  onSuccess: () => void
}

export function IssueDetailDialog({
  issue,
  open,
  onOpenChange,
  profile,
  onSuccess,
}: IssueDetailDialogProps) {
  const [comments, setComments] = useState<IssueComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: issue.title,
    description: issue.description,
    priority: issue.priority,
  })

  useEffect(() => {
    if (open) {
      fetchComments()
      setEditData({
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
      })
    }
  }, [open, issue.id])

  const fetchComments = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("issue_comments")
      .select("*, author:profiles(id, full_name, email)")
      .eq("issue_id", issue.id)
      .order("created_at", { ascending: true })

    setComments((data as IssueComment[]) || [])
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from("issue_comments").insert({
      issue_id: issue.id,
      author_id: profile.id,
      content: newComment.trim(),
    })

    setLoading(false)

    if (error) {
      toast.error("Failed to add comment", {
        description: error.message
      })
    } else {
      toast.success("Comment added")
      setNewComment("")
      fetchComments()
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("issue_comments").delete().eq("id", commentId)

    if (error) {
      toast.error("Failed to delete comment", {
        description: error.message
      })
    } else {
      toast.success("Comment deleted")
      fetchComments()
    }
  }

  const handleResolve = async () => {
    const supabase = createClient()
    const { error } = await supabase
      .from("issues")
      .update({
        status: "resolved",
        resolved_by: profile.id,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", issue.id)

    if (error) {
      toast.error("Failed to resolve issue", {
        description: error.message
      })
    } else {
      toast.success("Issue marked as resolved")
      onSuccess()
    }
  }

  const handleReopen = async () => {
    const supabase = createClient()
    const { error } = await supabase
      .from("issues")
      .update({
        status: "open",
        resolved_by: null,
        resolved_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issue.id)

    if (error) {
      toast.error("Failed to reopen issue", {
        description: error.message
      })
    } else {
      toast.success("Issue reopened")
      onSuccess()
    }
  }

  const handleUpdate = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("issues")
      .update({
        title: editData.title,
        description: editData.description,
        priority: editData.priority,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issue.id)

    setLoading(false)

    if (error) {
      toast.error("Failed to update issue", {
        description: error.message
      })
      return
    }

    toast.success("Issue updated successfully")
    setIsEditing(false)
    onSuccess()
  }

  const handleDelete = async () => {
    const supabase = createClient()
    const { error } = await supabase.from("issues").delete().eq("id", issue.id)

    if (error) {
      toast.error("Failed to delete issue", {
        description: error.message
      })
    } else {
      toast.success("Issue deleted successfully")
      onSuccess()
    }
  }

  const statusStyles = {
    open: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    resolved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  }

  const priorityStyles = {
    low: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    normal: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    urgent: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  }

  const priorityLabels = {
    low: "Low",
    normal: "Normal",
    urgent: "Urgent",
  }

  const formatTimestamp = (value: string) =>
    new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <DialogHeader className="space-y-3 pr-12 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Wrench className="h-3.5 w-3.5" />
              Engineering Desk
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <AlertCircle className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-base font-semibold tracking-tight">Issue workspace</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Review details, collaborate, and close the loop.
                  </DialogDescription>
                </div>
              </div>

              <Badge variant="outline" className={cn("text-xs", statusStyles[issue.status])}>
                {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_300px]">
          <ScrollArea className="min-h-0 border-b md:border-b-0 md:border-r">
            <div className="space-y-5 p-6">
              <section className="rounded-xl border bg-card p-4 sm:p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Issue summary</p>

                <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <Input
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        className="text-base font-medium"
                      />
                    ) : (
                      <h2 className="truncate text-xl font-semibold tracking-tight">{issue.title}</h2>
                    )}
                  </div>

                  {!isEditing && (
                    <Badge variant="outline" className={cn("text-xs", priorityStyles[issue.priority])}>
                      {issue.priority === "urgent" && <AlertTriangle className="mr-1 h-3 w-3" />}
                      {priorityLabels[issue.priority]}
                    </Badge>
                  )}
                </div>

                <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {issue.creator?.full_name || issue.creator?.email || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTimestamp(issue.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {comments.length} comments
                  </span>
                </div>
              </section>

              <section className="rounded-xl border bg-card p-4 sm:p-5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Issue details</Label>
                <div className="mt-3">
                  {isEditing ? (
                    <Textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={8}
                      className="text-sm"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{issue.description}</p>
                  )}
                </div>
              </section>

              {issue.status === "resolved" && issue.resolver && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-foreground/80">
                    Resolved by <span className="font-medium">{issue.resolver.full_name || issue.resolver.email}</span> on{" "}
                    {issue.resolved_at ? formatTimestamp(issue.resolved_at) : "-"}
                  </span>
                </div>
              )}

              <section className="rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Discussion</Label>
                  <span className="text-xs text-muted-foreground">{comments.length} entries</span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {comments.map((comment) => (
                    <article key={comment.id} className="space-y-2 rounded-lg border bg-muted/20 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {comment.author?.full_name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0 text-xs">
                            <p className="truncate font-medium text-foreground">{comment.author?.full_name || "Unknown"}</p>
                            <p className="text-muted-foreground">{formatTimestamp(comment.created_at)}</p>
                          </div>
                        </div>

                        {(comment.author_id === profile.id || profile.role === "admin") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 cursor-pointer text-muted-foreground hover:bg-transparent hover:text-destructive"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <p className="pl-9 text-sm leading-relaxed text-foreground/80">{comment.content}</p>
                    </article>
                  ))}

                  {comments.length === 0 && (
                    <div className="rounded-lg border border-dashed bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
                      No comments yet. Add context to help your team resolve this faster.
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-lg border bg-background p-3">
                  <Label className="text-xs font-medium text-muted-foreground">Add comment</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Share an update or handover note..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleAddComment()
                        }
                      }}
                      className="text-sm"
                    />
                    <Button
                      className="cursor-pointer"
                      size="icon"
                      onClick={handleAddComment}
                      disabled={loading || !newComment.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </ScrollArea>

          <aside className="space-y-4 bg-muted/20 p-5">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status & priority</p>

              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Status</p>
                  <Badge variant="outline" className={cn("mt-1 text-xs", statusStyles[issue.status])}>
                    {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                  </Badge>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">Priority</p>
                  {isEditing ? (
                    <Select
                      value={editData.priority}
                      onValueChange={(value) => setEditData({ ...editData, priority: value as "low" | "normal" | "urgent" })}
                    >
                      <SelectTrigger className="mt-1 h-9 w-full cursor-pointer">
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
                  ) : (
                    <Badge variant="outline" className={cn("mt-1 text-xs", priorityStyles[issue.priority])}>
                      {priorityLabels[issue.priority]}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Actions</p>

              <div className="mt-3 space-y-2">
                {isEditing ? (
                  <>
                    <Button className="w-full cursor-pointer" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel edits
                    </Button>
                    <Button className="w-full cursor-pointer" size="sm" onClick={handleUpdate} disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full cursor-pointer" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit2 className="mr-2 h-3.5 w-3.5" />
                      Edit issue
                    </Button>

                    {issue.status === "open" ? (
                      <Button onClick={handleResolve} size="sm" className="w-full cursor-pointer">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark as Resolved
                      </Button>
                    ) : (
                      <Button className="w-full cursor-pointer" variant="outline" size="sm" onClick={handleReopen}>
                        Reopen Issue
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {profile.role === "admin" && !isEditing && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-destructive">Admin zone</p>
                <p className="mt-1 text-xs text-muted-foreground">Delete this issue and all associated comments permanently.</p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="mt-3 w-full cursor-pointer">
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete issue
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Issue?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the issue and all associated
                        comments.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                      <AlertDialogAction className="cursor-pointer" onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}
