"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { CheckCircle2, Trash2, Send, User, Clock, Edit2, X } from "lucide-react"
import { toast } from "sonner"
import type { Complaint, ComplaintComment, Profile } from "@/lib/types"

interface ComplaintDetailDialogProps {
  complaint: Complaint
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
  staffMembers: Profile[]
  onSuccess: () => void
}

export function ComplaintDetailDialog({
  complaint,
  open,
  onOpenChange,
  profile,
  staffMembers,
  onSuccess,
}: ComplaintDetailDialogProps) {
  const [comments, setComments] = useState<ComplaintComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: complaint.title,
    description: complaint.description,
    priority: complaint.priority,
    assigned_to: complaint.assigned_to || "",
  })

  useEffect(() => {
    if (open) {
      fetchComments()
    }
  }, [open, complaint.id])

  const fetchComments = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("complaint_comments")
      .select("*, author:profiles(id, full_name, email)")
      .eq("complaint_id", complaint.id)
      .order("created_at", { ascending: true })

    setComments((data as ComplaintComment[]) || [])
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from("complaint_comments").insert({
      complaint_id: complaint.id,
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
    const { error } = await supabase.from("complaint_comments").delete().eq("id", commentId)
    
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
      .from("complaints")
      .update({
        status: "resolved",
        resolved_by: profile.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", complaint.id)
    
    if (error) {
      toast.error("Failed to resolve complaint", {
        description: error.message
      })
    } else {
      toast.success("Complaint marked as resolved")
      onSuccess()
    }
  }

  const handleReopen = async () => {
    const supabase = createClient()
    const { error } = await supabase
      .from("complaints")
      .update({
        status: "open",
        resolved_by: null,
        resolved_at: null,
      })
      .eq("id", complaint.id)
    
    if (error) {
      toast.error("Failed to reopen complaint", {
        description: error.message
      })
    } else {
      toast.success("Complaint reopened")
      onSuccess()
    }
  }

  const handleUpdate = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("complaints")
      .update({
        title: editData.title,
        description: editData.description,
        priority: editData.priority,
        assigned_to: editData.assigned_to || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", complaint.id)
    
    setLoading(false)
    
    if (error) {
      toast.error("Failed to update complaint", {
        description: error.message
      })
    } else {
      toast.success("Complaint updated successfully")
      setIsEditing(false)
      onSuccess()
    }
  }

  const handleDelete = async () => {
    const supabase = createClient()
    const { error } = await supabase.from("complaints").delete().eq("id", complaint.id)
    
    if (error) {
      toast.error("Failed to delete complaint", {
        description: error.message
      })
    } else {
      toast.success("Complaint deleted successfully")
      onSuccess()
    }
  }

  const priorityColors = {
    low: "bg-green-500/10 text-green-600 border-green-500/20",
    normal: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    urgent: "bg-red-500/10 text-red-600 border-red-500/20",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {isEditing ? (
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="text-lg font-semibold"
                />
              ) : (
                <DialogTitle className="text-xl">{complaint.title}</DialogTitle>
              )}
              <DialogDescription className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Created {new Date(complaint.created_at).toLocaleString()}
                {complaint.creator && (
                  <>
                    <span className="mx-1">by</span>
                    {complaint.creator.full_name || complaint.creator.email}
                  </>
                )}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={complaint.status === "open" ? "default" : "secondary"}>{complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}</Badge>
              {isEditing ? (
                <Select
                  value={editData.priority}
                  onValueChange={(value) => setEditData({ ...editData, priority: value as any })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className={priorityColors[complaint.priority]}>
                  {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Guest Info */}
            {(complaint.guest_name || complaint.room_number) && (
              <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  {complaint.guest_name && <span className="font-medium">{complaint.guest_name}</span>}
                  {complaint.room_number && (
                    <span className="text-muted-foreground">
                      {complaint.guest_name ? " - " : ""}Room {complaint.room_number}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Description</Label>
              {isEditing ? (
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{complaint.description}</p>
              )}
            </div>

            {/* Assignment */}
            {isEditing && (
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select
                  value={editData.assigned_to}
                  onValueChange={(value) => setEditData({ ...editData, assigned_to: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name || staff.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {complaint.assignee && !isEditing && (
              <div className="text-sm">
                <span className="text-muted-foreground">Assigned to: </span>
                <span className="font-medium">{complaint.assignee.full_name || complaint.assignee.email}</span>
              </div>
            )}

            {complaint.status === "resolved" && complaint.resolver && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                <CheckCircle2 className="h-4 w-4 inline mr-2 text-green-600" />
                Resolved by {complaint.resolver.full_name} on {new Date(complaint.resolved_at!).toLocaleString()}
              </div>
            )}

            <Separator />

            {/* Comments Section */}
            <div className="space-y-4">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                Comments ({comments.length})
              </Label>

              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-secondary/30 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {comment.author?.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span className="font-medium">{comment.author?.full_name || "Unknown"}</span>
                        <span className="text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
                      </div>
                      {(comment.author_id === profile.id || profile.role === "admin") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 cursor-pointer"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                )}
              </div>

              {/* Add Comment */}
              <div className="flex gap-2">
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
                />
                <Button className="cursor-pointer" size="icon" onClick={handleAddComment} disabled={loading || !newComment.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button className="cursor-pointer" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button className="cursor-pointer" onClick={handleUpdate} disabled={loading}>
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {profile.role === "admin" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive bg-transparent cursor-pointer">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Complaint?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the complaint and all associated
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
              {complaint.status === "open" ? (
                <Button onClick={handleResolve} className="cursor-pointer">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
              ) : (
                <Button className="cursor-pointer" variant="outline" onClick={handleReopen}>
                  Reopen Complaint
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
