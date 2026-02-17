"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, CircleAlert, ClipboardList, MessageSquarePlus, Tags, UserRound, UserRoundCheck } from "lucide-react"
import { toast } from "sonner"
import type { Profile, Department, ComplaintTag } from "@/lib/types"

interface CreateComplaintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
  staffMembers: Profile[]
  departments: Department[]
  availableTags: ComplaintTag[]
  onSuccess: () => void
}

export function CreateComplaintDialog({
  open,
  onOpenChange,
  profile,
  staffMembers,
  departments,
  availableTags,
  onSuccess,
}: CreateComplaintDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    guest_name: "",
    room_number: "",
    priority: "normal",
    assigned_to: "",
    department_id: profile.department_id || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    const { data: complaint, error } = await supabase.from("complaints").insert({
      title: formData.title,
      description: formData.description,
      guest_name: formData.guest_name || null,
      room_number: formData.room_number || null,
      priority: formData.priority,
      assigned_to: formData.assigned_to || null,
      department_id: formData.department_id || null,
      created_by: profile.id,
    }).select().single()

    if (error) {
      setLoading(false)
      toast.error("Failed to create complaint", {
        description: error.message
      })
      return
    }

    if (complaint && selectedTags.length > 0) {
      const tagMappings = selectedTags.map(tagId => ({
        complaint_id: complaint.id,
        tag_id: tagId
      }))
      const { error: tagError } = await supabase.from("complaint_tag_mappings").insert(tagMappings)
      if (tagError) {
        console.error("Failed to add tags:", tagError)
      }
    }

    setLoading(false)
    toast.success("Complaint created successfully")
    setFormData({
      title: "",
      description: "",
      guest_name: "",
      room_number: "",
      priority: "normal",
      assigned_to: "",
      department_id: profile.department_id || "",
    })
    setSelectedTags([])
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Guest Care
            </div>
            <DialogTitle className="text-xl tracking-tight">Log New Complaint</DialogTitle>
            <DialogDescription className="text-sm">
              Record a guest complaint clearly so teams can triage, assign, and resolve quickly.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="inline-flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                Title *
              </Label>
              <Input
                id="title"
                placeholder="Brief summary of the complaint"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="inline-flex items-center gap-2">
                <CircleAlert className="h-3.5 w-3.5 text-muted-foreground" />
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Full details of the complaint..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                required
              />
            </div>
          </section>

          <section className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guest_name" className="inline-flex items-center gap-2">
                <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                Guest Name
              </Label>
              <Input
                id="guest_name"
                placeholder="Guest name"
                value={formData.guest_name}
                onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room_number">Room Number</Label>
              <Input
                id="room_number"
                placeholder="e.g., 204"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="cursor-pointer w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="low">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#a9a9a9ff" }} />
                    Low
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="normal">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#00a103ff" }} />
                    Normal
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="urgent">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#ff0019ff" }} />
                    Urgent
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="inline-flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Department
              </Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
              >
                <SelectTrigger className="cursor-pointer w-full bg-white">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem className="cursor-pointer" key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="space-y-2">
              <Label htmlFor="assigned_to" className="inline-flex items-center gap-2">
                <UserRoundCheck className="h-3.5 w-3.5 text-muted-foreground" />
                Assign To
              </Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger className="cursor-pointer w-full bg-white">
                  <SelectValue placeholder="Assign to staff member" />
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

            <div className="space-y-2">
              <Label className="inline-flex items-center gap-2">
                <Tags className="h-3.5 w-3.5 text-muted-foreground" />
                Tags
              </Label>
              <div className="min-h-[42px] rounded-lg border bg-white p-3">
                <div className="flex flex-wrap gap-2">
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
                        className={`cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition-all ${
                          isSelected
                            ? "opacity-100"
                            : "scale-95 opacity-60 hover:scale-100 hover:opacity-100"
                        }`}
                        style={{
                          backgroundColor: isSelected ? tag.color + "20" : tag.color + "10",
                          borderColor: tag.color,
                          color: tag.color,
                          borderWidth: "1px",
                          borderStyle: "solid",
                        }}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button className="cursor-pointer" type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="cursor-pointer" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Complaint"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
