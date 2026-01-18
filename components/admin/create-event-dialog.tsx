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
import type { Department } from "@/lib/types"

interface CreateEventDialogProps {
  open: boolean
  onClose: () => void
  departments: Department[]
}

export function CreateEventDialog({ open, onClose, departments }: CreateEventDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department_id: "hotel-wide", // Updated default value
    start_time: "",
    end_time: "",
    event_type: "meeting",
    location: "",
  })
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from("schedule_events").insert({
      ...formData,
      event_date: eventDate ? eventDate.toISOString().split("T")[0] : "",
      department_id: formData.department_id || null,
      description: formData.description || null,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      location: formData.location || null,
      created_by: user?.id,
    })

    setIsSubmitting(false)
    setFormData({
      title: "",
      description: "",
      department_id: "hotel-wide", // Updated default value
      start_time: "",
      end_time: "",
      event_type: "meeting",
      location: "",
    })
    setEventDate(undefined)
    onClose()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
          <DialogDescription>Add a new event to the schedule</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Team Meeting"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department (leave empty for hotel-wide)</Label>
            <Select
              value={formData.department_id}
              onValueChange={(v) => setFormData({ ...formData, department_id: v })}
            >
              <SelectTrigger className="cursor-pointer w-full">
                <SelectValue placeholder="Hotel-wide event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="hotel-wide">Hotel-wide</SelectItem> {/* Updated value prop */}
                {departments.map((dept) => (
                  <SelectItem className="cursor-pointer" key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal cursor-pointer",
                    !eventDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {eventDate ? format(eventDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  onSelect={setEventDate}
                  initialFocus
                  className="[&_button]:cursor-pointer"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time (optional)</Label>
              <Input
                className="cursor-text"
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time (optional)</Label>
              <Input
                className="cursor-text"
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_type">Event Type</Label>
            <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
              <SelectTrigger className="cursor-pointer w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="meeting">Meeting</SelectItem>
                <SelectItem className="cursor-pointer" value="training">Training</SelectItem>
                <SelectItem className="cursor-pointer" value="inspection">Inspection</SelectItem>
                <SelectItem className="cursor-pointer" value="vip">VIP</SelectItem>
                <SelectItem className="cursor-pointer" value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Conference Room A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Event details..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1 bg-transparent cursor-pointer" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 cursor-pointer" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
