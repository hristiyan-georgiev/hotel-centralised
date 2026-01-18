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
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { CheckCircle2, Trash2, Send, User, Clock, Edit2, X, AlertTriangle } from "lucide-react"
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

  const statusColors = {
    open: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    resolved: "bg-green-500/10 text-green-600 border-green-500/20",
  }

  const priorityColors = {
    low: "bg-green-500/10 text-green-600 border-green-500/20",
    normal: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    urgent: "bg-red-500/10 text-red-600 border-red-500/20",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 pr-12 border-b">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              {isEditing ? (
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="text-base font-medium"
                />
              ) : (
                <DialogTitle className="text-lg font-semibold">{issue.title}</DialogTitle>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={`${statusColors[issue.status]} text-xs`}>
                  {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                </Badge>
                {isEditing ? (
                  <Select
                    value={editData.priority}
                    onValueChange={(value) => setEditData({ ...editData, priority: value as "low" | "normal" | "urgent" })}
                  >
                    <SelectTrigger className="w-28 h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  issue.priority === "urgent" && (
                    <Badge variant="outline" className={`${priorityColors[issue.priority]} text-xs`}>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Urgent
                    </Badge>
                  )
                )}
              </div>
            </div>
            <DialogDescription className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(issue.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                {" • "}
                {new Date(issue.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              {issue.creator && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {issue.creator.full_name || issue.creator.email}
                </span>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-5">
            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Description</Label>
              {isEditing ? (
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={6}
                  className="text-sm"
                />
              ) : (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{issue.description}</p>
              )}
            </div>

            {issue.status === "resolved" && issue.resolver && (
              <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-md text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-foreground/80">
                  Resolved by <span className="font-medium">{issue.resolver.full_name}</span> on {new Date(issue.resolved_at!).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}

            <Separator className="my-4" />

            {/* Comments Section */}
            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground">
                Comments ({comments.length})
              </Label>

              <div className="space-y-2.5">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-muted/30 rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                          {comment.author?.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-foreground">{comment.author?.full_name || "Unknown"}</span>
                          <span className="text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            {" • "}
                            {new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      {(comment.author_id === profile.id || profile.role === "admin") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 cursor-pointer hover:bg-transparent hover:text-destructive"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed pl-8">{comment.content}</p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No comments yet</p>
                )}
              </div>

              {/* Add Comment */}
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Add a comment..."
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
                <Button className="cursor-pointer" size="icon" onClick={handleAddComment} disabled={loading || !newComment.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button className="cursor-pointer" size="sm" onClick={handleUpdate} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button className="cursor-pointer" variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-3.5 w-3.5 mr-2" />
                  Edit
                </Button>
                {profile.role === "admin" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
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
                )}
              </>
            )}
          </div>

          {!isEditing && (
            <>
              {issue.status === "open" ? (
                <Button onClick={handleResolve} size="sm" className="cursor-pointer">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
              ) : (
                <Button className="cursor-pointer" variant="outline" size="sm" onClick={handleReopen}>
                  Reopen Issue
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
