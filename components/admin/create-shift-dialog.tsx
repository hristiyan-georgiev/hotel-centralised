"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Department, Profile } from "@/lib/types"

interface CreateShiftDialogProps {
  open: boolean
  onClose: () => void
  departments: Department[]
  staffMembers: Profile[]
}

export function CreateShiftDialog({ open, onClose, departments, staffMembers }: CreateShiftDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    staff_id: "",
    department_id: "",
    shift_date: "",
    start_time: "",
    end_time: "",
    shift_type: "regular",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from("shifts").insert({
      ...formData,
      staff_id: formData.staff_id || null,
      department_id: formData.department_id || null,
      notes: formData.notes || null,
      created_by: user?.id,
    })

    setIsSubmitting(false)
    setFormData({
      staff_id: "",
      department_id: "",
      shift_date: "",
      start_time: "",
      end_time: "",
      shift_type: "regular",
      notes: "",
    })
    onClose()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Shift</DialogTitle>
          <DialogDescription>Add a new shift to the schedule</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff">Staff Member</Label>
            <Select value={formData.staff_id} onValueChange={(v) => setFormData({ ...formData, staff_id: v })}>
              <SelectTrigger className="cursor-pointer w-full">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map((staff) => (
                  <SelectItem className="cursor-pointer" key={staff.id} value={staff.id}>
                    {staff.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.shift_date}
              onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                className="cursor-text"
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                className="cursor-text"
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift_type">Shift Type</Label>
            <Select value={formData.shift_type} onValueChange={(v) => setFormData({ ...formData, shift_type: v })}>
              <SelectTrigger className="cursor-pointer w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="regular">Regular</SelectItem>
                <SelectItem className="cursor-pointer" value="overtime">Overtime</SelectItem>
                <SelectItem className="cursor-pointer" value="on-call">On-call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1 bg-transparent cursor-pointer" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 cursor-pointer" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Shift"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
