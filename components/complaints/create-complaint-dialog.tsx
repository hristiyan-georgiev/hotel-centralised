"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { Profile, Department } from "@/lib/types"

interface CreateComplaintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
  staffMembers: Profile[]
  departments: Department[]
  onSuccess: () => void
}

export function CreateComplaintDialog({
  open,
  onOpenChange,
  profile,
  staffMembers,
  departments,
  onSuccess,
}: CreateComplaintDialogProps) {
  const [loading, setLoading] = useState(false)
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

    const { error } = await supabase.from("complaints").insert({
      title: formData.title,
      description: formData.description,
      guest_name: formData.guest_name || null,
      room_number: formData.room_number || null,
      priority: formData.priority,
      assigned_to: formData.assigned_to || null,
      department_id: formData.department_id || null,
      created_by: profile.id,
    })

    setLoading(false)

    if (error) {
      toast.error("Failed to create complaint", {
        description: error.message
      })
    } else {
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
      onOpenChange(false)
      onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log New Complaint</DialogTitle>
          <DialogDescription>Record a guest complaint or issue that needs to be addressed.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief summary of the complaint"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Full details of the complaint..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guest_name">Guest Name</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
            >
              <SelectTrigger className="cursor-pointer">
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

          <DialogFooter>
            <Button className="cursor-pointer" type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="cursor-pointer" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Complaint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
