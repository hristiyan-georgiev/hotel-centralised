"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CalendarDays, MessageSquare, NotebookText } from "lucide-react"
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

const toDateKey = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

const toIsoDate = (value: string) => value.split("T")[0]

export function CalendarView({ notes, complaints, month, year }: CalendarViewProps) {
  const router = useRouter()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayDate = new Date()
  const todayKey = toDateKey(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate())

  const notesByDate = useMemo(() => {
    const map = new Map<string, Pick<HandoverNote, "id" | "note_date" | "priority" | "title">[]>()
    notes.forEach((note) => {
      const existing = map.get(note.note_date)
      if (existing) {
        existing.push(note)
      } else {
        map.set(note.note_date, [note])
      }
    })
    return map
  }, [notes])

  const complaintsByDate = useMemo(() => {
    const map = new Map<string, Pick<Complaint, "id" | "created_at" | "priority" | "status">[]>()
    complaints.forEach((complaint) => {
      const date = toIsoDate(complaint.created_at)
      const existing = map.get(date)
      if (existing) {
        existing.push(complaint)
      } else {
        map.set(date, [complaint])
      }
    })
    return map
  }, [complaints])

  const goToDate = (dateStr: string) => {
    router.push(`/dashboard/notes?date=${dateStr}`)
  }

  const totalSlots = Math.ceil((firstDay + daysInMonth) / 7) * 7
  const dayCells = Array.from({ length: totalSlots }, (_, slot) => {
    const day = slot - firstDay + 1

    if (day < 1 || day > daysInMonth) {
      return <div key={`empty-${slot}`} className="min-h-36 bg-white" />
    }

    const dateKey = toDateKey(year, month, day)
    const dayNotes = notesByDate.get(dateKey) ?? []
    const dayComplaints = complaintsByDate.get(dateKey) ?? []
    const isToday = dateKey === todayKey
    const hasUrgent =
      dayNotes.some((item) => item.priority === "urgent") || dayComplaints.some((item) => item.priority === "urgent")
    const hasActivity = dayNotes.length > 0 || dayComplaints.length > 0
    const openComplaintCount = dayComplaints.filter((item) => item.status === "open").length

    return (
      <button
        key={dateKey}
        onClick={() => goToDate(dateKey)}
        className={`group min-h-36 bg-white p-3 text-left transition-colors cursor-pointer ${
          isToday ? "ring-1 ring-inset ring-primary/55" : "hover:bg-background/90"
        }`}
        aria-label={`Open notes for ${MONTHS[month]} ${day}, ${year}`}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
              isToday ? "bg-primary/15 text-primary" : "bg-muted text-foreground"
            }`}
          >
            {day}
          </span>
          <div className="flex items-center gap-1">
            {isToday && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase tracking-wide">
                Today
              </Badge>
            )}
            {hasUrgent && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-xs">
          {hasActivity ? (
            <>
              {dayNotes.length > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <NotebookText className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {dayNotes.length} note{dayNotes.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {dayComplaints.length > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5 text-foreground/70" />
                  <span>
                    {dayComplaints.length} complaint{dayComplaints.length !== 1 ? "s" : ""}
                    {openComplaintCount > 0 ? ` (${openComplaintCount} open)` : ""}
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground/70">No activity</p>
          )}
        </div>
      </button>
    )
  })

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/70">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-7 border-b bg-white">
                {DAYS.map((day) => (
                  <div key={day} className="p-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground ">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px bg-border/60">{dayCells}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          Select a day to open handover notes
        </span>
        <span className="inline-flex items-center gap-1.5">
          <NotebookText className="h-3.5 w-3.5 text-primary" />
          Note count
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          Complaint count
        </span>
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          Urgent activity
        </span>
      </div>
    </div>
  )
}
