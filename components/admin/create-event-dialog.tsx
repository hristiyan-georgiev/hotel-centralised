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
import { CalendarIcon, CalendarClock, Building2, Clock3, MapPin } from "lucide-react"
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
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Schedule Planner
            </div>
            <DialogTitle className="text-xl tracking-tight">Create Event</DialogTitle>
            <DialogDescription className="text-sm">Add a new event to the schedule.</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Team Meeting"
                className="bg-white"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department" className="inline-flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Department
                </Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(v) => setFormData({ ...formData, department_id: v })}
                >
                  <SelectTrigger className="cursor-pointer w-full bg-white" id="department">
                    <SelectValue placeholder="Hotel-wide event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value="hotel-wide">Hotel-wide</SelectItem>
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
                        "w-full justify-start bg-white text-left font-normal cursor-pointer",
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
            </div>
          </section>

          <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_time" className="inline-flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                  Start Time (optional)
                </Label>
                <Input
                  className="cursor-text bg-white"
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time (optional)</Label>
                <Input
                  className="cursor-text bg-white"
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
                <SelectTrigger className="cursor-pointer w-full bg-white" id="event_type">
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
              <Label htmlFor="location" className="inline-flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Location (optional)
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Conference Room A"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event details..."
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
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
