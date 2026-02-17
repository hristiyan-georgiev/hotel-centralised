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
import { CalendarClock, User, Building2, Clock3, NotebookPen } from "lucide-react"
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
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Shift Planner
            </div>
            <DialogTitle className="text-xl tracking-tight">Create Shift</DialogTitle>
            <DialogDescription className="text-sm">Add a new shift to the schedule.</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="staff" className="inline-flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Staff Member
                </Label>
                <Select value={formData.staff_id} onValueChange={(v) => setFormData({ ...formData, staff_id: v })}>
                  <SelectTrigger className="cursor-pointer w-full bg-white" id="staff">
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
                <Label htmlFor="department_id" className="inline-flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Department (optional)
                </Label>
                <Select value={formData.department_id} onValueChange={(v) => setFormData({ ...formData, department_id: v })}>
                  <SelectTrigger className="cursor-pointer w-full bg-white" id="department_id">
                    <SelectValue placeholder="All departments" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.shift_date}
                onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
                className="bg-white"
                required
              />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_time" className="inline-flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                  Start Time
                </Label>
                <Input
                  className="cursor-text bg-white"
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
                  className="cursor-text bg-white"
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
                <SelectTrigger className="cursor-pointer w-full bg-white" id="shift_type">
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
              <Label htmlFor="notes" className="inline-flex items-center gap-2">
                <NotebookPen className="h-3.5 w-3.5 text-muted-foreground" />
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
                rows={3}
                className="bg-white"
              />
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" className="cursor-pointer" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Shift"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
