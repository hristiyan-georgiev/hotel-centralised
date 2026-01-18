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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Department, Profile } from "@/lib/types"

interface CreateTaskDialogProps {
  open: boolean
  onClose: () => void
  departments: Department[]
  staffMembers: Profile[]
}

export function CreateTaskDialog({ open, onClose, departments, staffMembers }: CreateTaskDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    department_id: "",
    due_time: "",
    priority: "normal",
  })
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from("schedule_tasks").insert({
      ...formData,
      due_date: dueDate ? dueDate.toISOString().split("T")[0] : "",
      assigned_to: formData.assigned_to || null,
      department_id: formData.department_id || null,
      description: formData.description || null,
      due_time: formData.due_time || null,
      created_by: user?.id,
    })

    setIsSubmitting(false)
    setFormData({
      title: "",
      description: "",
      assigned_to: "",
      department_id: "",
      due_time: "",
      priority: "normal",
    })
    setDueDate(undefined)
    onClose()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>Add a new task to the schedule</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Inspect room 204"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To</Label>
            <Select value={formData.assigned_to} onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}>
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


          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal cursor-pointer",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="[&_button]:cursor-pointer"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_time">Due Time (optional)</Label>
              <Input
                className="cursor-text"
                id="due_time"
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
              <SelectTrigger className="cursor-pointer w-full">
                <SelectValue />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="low">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#a9a9a9ff" }} />
                    Low</SelectItem>
                  <SelectItem className="cursor-pointer" value="normal">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#00a103ff" }} />
                    Normal</SelectItem>
                  <SelectItem className="cursor-pointer" value="urgent">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#ff0019ff" }} />
                    Urgent</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task details..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1 bg-transparent cursor-pointer" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 cursor-pointer" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
