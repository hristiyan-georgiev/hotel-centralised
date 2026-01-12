"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Circle, AlertCircle, MessageSquare } from "lucide-react"
import type { HandoverNote, Complaint } from "@/lib/types"

interface CalendarViewProps {
  notes: Pick<HandoverNote, "id" | "note_date" | "priority" | "title">[]
  complaints: Pick<Complaint, "id" | "created_at" | "priority" | "status">[]
  month: number
  year: number
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export function CalendarView({ notes, complaints, month, year }: CalendarViewProps) {
  const router = useRouter()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split("T")[0]

  const navigateMonth = (direction: number) => {
    let newMonth = month + direction
    let newYear = year
    if (newMonth < 0) {
      newMonth = 11
      newYear--
    } else if (newMonth > 11) {
      newMonth = 0
      newYear++
    }
    router.push(`/dashboard/calendar?month=${newMonth}&year=${newYear}`)
  }

  const getNotesForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return notes.filter((n) => n.note_date === dateStr)
  }

  const getComplaintsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return complaints.filter((c) => c.created_at.startsWith(dateStr))
  }

  const goToDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    router.push(`/dashboard/notes?date=${dateStr}`)
  }

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-28 border border-transparent" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const dayNotes = getNotesForDate(day)
    const dayComplaints = getComplaintsForDate(day)
    const isToday = dateStr === today
    const hasUrgent = dayNotes.some((n) => n.priority === "urgent")
    const hasUrgentComplaint = dayComplaints.some((c) => c.priority === "urgent")

    days.push(
      <button
        key={day}
        onClick={() => goToDate(day)}
        className={`h-28 p-3 text-left border rounded-lg transition-all group relative cursor-pointer ${
          isToday 
            ? "border-primary bg-primary/10 shadow-sm" 
            : dayNotes.length > 0 || dayComplaints.length > 0
            ? "border-border bg-card hover:border-primary/50 hover:shadow-md"
            : "border-border bg-card hover:bg-secondary/50 hover:border-border"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className={`text-base font-semibold ${
            isToday ? "text-primary" : "text-foreground"
          }`}>
            {day}
          </div>
          {isToday && (
            <Badge variant="default" className="text-xs px-1.5 py-0 h-5">
              Today
            </Badge>
          )}
        </div>
        
        {(dayNotes.length > 0 || dayComplaints.length > 0) && (
          <div className="mt-2 space-y-1.5">
            {(hasUrgent || hasUrgentComplaint) && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-500/10 px-2 py-1 rounded">
                <AlertCircle className="h-3 w-3" />
                <span className="font-medium">Urgent</span>
              </div>
            )}
            {dayNotes.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Circle className="h-2 w-2 fill-current" />
                <span>{dayNotes.length} note{dayNotes.length !== 1 ? "s" : ""}</span>
              </div>
            )}
            {dayComplaints.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="h-2.5 w-2.5 fill-current" />
                <span>{dayComplaints.length} complaint{dayComplaints.length !== 1 ? "s" : ""}</span>
              </div>
            )}
            {dayNotes.slice(0, 1).map((note, idx) => (
              <div 
                key={note.id} 
                className="text-xs truncate text-muted-foreground group-hover:text-foreground transition-colors"
              >
                {note.title}
              </div>
            ))}
          </div>
        )}
      </button>,
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigateMonth(-1)}
            className="hover:bg-background cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            {MONTHS[month]} {year}
          </h2>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigateMonth(1)}
            className="hover:bg-background cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-3 mb-3">
          {DAYS.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-3">{days}</div>
      </CardContent>
    </Card>
  )
}
