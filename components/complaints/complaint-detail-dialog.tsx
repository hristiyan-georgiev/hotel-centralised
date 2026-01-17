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
import type { Complaint, ComplaintComment, Profile, ComplaintTag } from "@/lib/types"

interface ComplaintDetailDialogProps {
  complaint: Complaint
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
  staffMembers: Profile[]
  availableTags: ComplaintTag[]
  onSuccess: () => void
}

export function ComplaintDetailDialog({
  complaint,
  open,
  onOpenChange,
  profile,
  staffMembers,
  availableTags,
  onSuccess,
}: ComplaintDetailDialogProps) {
  const [comments, setComments] = useState<ComplaintComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>(complaint.tags?.map(t => t.id) || [])
  const [editData, setEditData] = useState({
    title: complaint.title,
    description: complaint.description,
    priority: complaint.priority,
    assigned_to: complaint.assigned_to || "",
  })

  useEffect(() => {
    if (open) {
      fetchComments()
      setSelectedTags(complaint.tags?.map(t => t.id) || [])
      setEditData({
        title: complaint.title,
        description: complaint.description,
        priority: complaint.priority,
        assigned_to: complaint.assigned_to || "",
      })
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
    
    if (error) {
      setLoading(false)
      toast.error("Failed to update complaint", {
        description: error.message
      })
      return
    }

    const currentTagIds = complaint.tags?.map(t => t.id) || []
    const tagsToAdd = selectedTags.filter(id => !currentTagIds.includes(id))
    const tagsToRemove = currentTagIds.filter(id => !selectedTags.includes(id))

    if (tagsToRemove.length > 0) {
      await supabase
        .from("complaint_tag_mappings")
        .delete()
        .eq("complaint_id", complaint.id)
        .in("tag_id", tagsToRemove)
    }

    if (tagsToAdd.length > 0) {
      const tagMappings = tagsToAdd.map(tagId => ({
        complaint_id: complaint.id,
        tag_id: tagId
      }))
      await supabase.from("complaint_tag_mappings").insert(tagMappings)
    }
    
    setLoading(false)
    toast.success("Complaint updated successfully")
    setIsEditing(false)
    onSuccess()
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
                <DialogTitle className="text-lg font-semibold">{complaint.title}</DialogTitle>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={complaint.status === "open" ? "default" : "secondary"} className="text-xs">
                  {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                </Badge>
                {isEditing ? (
                  <Select
                    value={editData.priority}
                    onValueChange={(value) => setEditData({ ...editData, priority: value as any })}
                  >
                    <SelectTrigger className="w-24 h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  complaint.priority === "urgent" && (
                    <Badge variant="outline" className={`${priorityColors[complaint.priority]} text-xs`}>
                      Urgent
                    </Badge>
                  )
                )}
              </div>
            </div>
            <DialogDescription className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(complaint.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                {" • "}
                {new Date(complaint.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              {complaint.creator && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {complaint.creator.full_name || complaint.creator.email}
                </span>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-5">
            {/* Guest Info */}
            {(complaint.guest_name || complaint.room_number) && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                {complaint.guest_name && <span className="font-medium">{complaint.guest_name}</span>}
                {complaint.room_number && (
                  <span className="text-muted-foreground">
                    {complaint.guest_name && "•"} Room {complaint.room_number}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Description</Label>
              {isEditing ? (
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                  className="text-sm"
                />
              ) : (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
              )}
            </div>

            {/* Assignment */}
            {isEditing && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Assigned To</Label>
                <Select
                  value={editData.assigned_to}
                  onValueChange={(value) => setEditData({ ...editData, assigned_to: value })}
                >
                  <SelectTrigger className="text-sm">
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
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Assigned to:</span>
                <span className="font-medium">{complaint.assignee.full_name || complaint.assignee.email}</span>
              </div>
            )}

            {/* Tags Section */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Tags</Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2 p-2.5 border rounded-md min-h-[42px]">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setSelectedTags(
                            isSelected
                              ? selectedTags.filter((id) => id !== tag.id)
                              : [...selectedTags, tag.id]
                          )
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "opacity-100"
                            : "opacity-50 hover:opacity-100"
                        }`}
                        style={{
                          backgroundColor: isSelected ? tag.color + "15" : tag.color + "08",
                          borderColor: tag.color + (isSelected ? "50" : "30"),
                          color: tag.color,
                          borderWidth: "1px",
                          borderStyle: "solid"
                        }}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {complaint.tags && complaint.tags.length > 0 ? (
                    complaint.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="font-normal text-xs"
                        style={{ borderColor: tag.color, color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No tags</p>
                  )}
                </div>
              )}
            </div>

            {complaint.status === "resolved" && complaint.resolver && (
              <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-md text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-foreground/80">
                  Resolved by <span className="font-medium">{complaint.resolver.full_name}</span> on {new Date(complaint.resolved_at!).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
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
                <Button onClick={handleResolve} size="sm" className="cursor-pointer">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
              ) : (
                <Button className="cursor-pointer" variant="outline" size="sm" onClick={handleReopen}>
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
