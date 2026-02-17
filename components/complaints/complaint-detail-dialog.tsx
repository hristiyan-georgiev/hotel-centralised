"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { CheckCircle2, Trash2, Send, User, Clock, Edit2, X, MessageSquarePlus } from "lucide-react"
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
      <DialogContent className="sm:max-w-5xl max-h-[92vh] flex flex-col overflow-hidden p-0 gap-0">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <DialogHeader className="space-y-3 pr-12 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Guest Care
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <Input
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="h-10 bg-background text-base font-semibold"
                  />
                ) : (
                  <DialogTitle className="text-xl tracking-tight">{complaint.title}</DialogTitle>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={complaint.status === "open" ? "default" : "secondary"} className="text-xs">
                  {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                </Badge>
                {!isEditing && (
                  <Badge variant="outline" className={`${priorityColors[complaint.priority]} text-xs font-medium`}>
                    {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
                  </Badge>
                )}
              </div>
            </div>

            <DialogDescription className="flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(complaint.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
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
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-6 py-5">
            {isEditing ? (
              <div className="rounded-xl border bg-card p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
                    <Textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={5}
                      className="text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Assigned To</Label>
                    <Select
                      value={editData.assigned_to}
                      onValueChange={(value) => setEditData({ ...editData, assigned_to: value })}
                    >
                      <SelectTrigger className="text-sm w-full cursor-pointer">
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers.map((staff) => (
                          <SelectItem className="cursor-pointer" key={staff.id} value={staff.id}>
                            {staff.full_name || staff.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Priority</Label>
                    <Select
                      value={editData.priority}
                      onValueChange={(value) => setEditData({ ...editData, priority: value as any })}
                    >
                      <SelectTrigger className="text-sm w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value="low">Low</SelectItem>
                        <SelectItem className="cursor-pointer" value="normal">Normal</SelectItem>
                        <SelectItem className="cursor-pointer" value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tags</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white min-h-[44px]">
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
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${isSelected
                                ? "opacity-100 scale-105"
                                : "opacity-55 hover:opacity-70"
                              }`}
                            style={{
                              backgroundColor: isSelected ? tag.color + "18" : "transparent",
                              borderColor: tag.color + (isSelected ? "60" : "80"),
                              color: tag.color,
                            }}
                          >
                            {tag.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-4 sm:p-5">
                <div className="relative">
                {/* Center vertical timeline line */}
                <div className="absolute left-1/2 -translate-x-[0.5px] top-4 bottom-0 w-px bg-border" />

                {/* ── Complaint Opened ── left side */}
                <div className="grid grid-cols-[1fr_35px_1fr] pb-8">
                  <div className="flex flex-col items-end pr-3">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap justify-end">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(complaint.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                        {" "}
                        {new Date(complaint.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-sm font-semibold">
                        {complaint.creator?.full_name || complaint.creator?.email || "Unknown"}
                      </span>
                    </div>
                    <div className="p-3.5 border rounded-xl rounded-tr-sm bg-muted/20 space-y-2.5 w-full text-left">
                      {(complaint.guest_name || complaint.room_number) && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {complaint.guest_name && <span className="font-medium">{complaint.guest_name}</span>}
                          {complaint.room_number && (
                            <span className="text-muted-foreground">
                              {complaint.guest_name && "•"} Room {complaint.room_number}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
                      {complaint.tags && complaint.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {complaint.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="font-normal text-xs"
                              style={{ borderColor: tag.color, color: tag.color }}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {complaint.assignee && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <span>Assigned to <span className="font-medium text-foreground">{complaint.assignee.full_name || complaint.assignee.email}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="relative z-10 h-[35px] w-[35px] rounded-full bg-primary flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  </div>
                  <div />
                </div>

                {/* ── Comment timeline entries ── */}
                {comments.map((comment) => {
                  const isOwnComment = comment.author_id === profile.id
                  return (
                    <div key={comment.id} className="grid grid-cols-[1fr_35px_1fr] pb-6 group">
                      {/* Left column — content if NOT own comment */}
                      {!isOwnComment ? (
                        <div className="flex flex-col items-end pr-3">
                          <div className="flex items-center gap-2 mb-1 flex-wrap justify-end">
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                              {" "}
                              {new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="text-xs font-medium">
                              {comment.author?.full_name || "Unknown"}
                            </span>
                            {(comment.author_id === profile.id || profile.role === "admin") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-transparent"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="p-3 text-sm leading-relaxed whitespace-pre-wrap bg-muted/60 border rounded-2xl rounded-tr-sm text-left w-full">
                            {comment.content}
                          </div>
                        </div>
                      ) : <div />}

                      {/* Center dot */}
                      <div className="flex justify-center">
                        <div className={`relative z-10 h-[35px] w-[35px] rounded-full flex items-center justify-center text-xs font-semibold ${
                          isOwnComment
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {comment.author?.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      </div>

                      {/* Right column — content if own comment */}
                      {isOwnComment ? (
                        <div className="flex flex-col items-start pl-3">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-medium">
                              {comment.author?.full_name || "Unknown"}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                              {" "}
                              {new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {(comment.author_id === profile.id || profile.role === "admin") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-transparent"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="p-3 text-sm leading-relaxed whitespace-pre-wrap bg-primary text-primary-foreground rounded-2xl rounded-tl-sm w-full">
                            {comment.content}
                          </div>
                        </div>
                      ) : <div />}
                    </div>
                  )
                })}

                {/* ── Resolved Event ── center point */}
                {complaint.status === "resolved" && complaint.resolver && (
                  <div className="grid grid-cols-[1fr_35px_1fr] pb-2">
                    <div className="flex items-center justify-end pr-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(complaint.resolved_at!).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <div className="relative z-10 h-[35px] w-[35px] rounded-full bg-green-500/15 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="flex items-center pl-3">
                      <span className="text-sm font-medium text-green-600">
                        Resolved by {complaint.resolver.full_name}
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Empty state ── center point */}
                {comments.length === 0 && complaint.status !== "resolved" && (
                  <div className="grid grid-cols-[1fr_35px_1fr] pb-2">
                    <div />
                    <div className="flex justify-center">
                      <div className="relative z-10 h-[35px] w-[35px] rounded-full bg-muted/60 flex items-center justify-center">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                      </div>
                    </div>
                    <div className="flex items-center pl-3">
                      <span className="text-sm text-muted-foreground">No replies yet</span>
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Comment input — pinned below scroll area */}
        {!isEditing && (
          <div className="border-t bg-background px-6 py-3 shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Write a reply..."
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
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-6 py-3 shrink-0">
          <div className="flex flex-wrap gap-2">
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
                <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-3.5 w-3.5 mr-2" />
                  Edit
                </Button>
                {profile.role === "admin" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive cursor-pointer bg-red-100 border">
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
