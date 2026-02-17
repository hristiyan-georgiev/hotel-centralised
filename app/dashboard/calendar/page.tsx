import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarView } from "@/components/dashboard/calendar-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import type { HandoverNote, Complaint } from "@/lib/types"

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

interface CalendarPageProps {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const now = new Date()
  const month = params.month ? Number.parseInt(params.month) : now.getMonth()
  const year = params.year ? Number.parseInt(params.year) : now.getFullYear()

  // Get first and last day of month
  const startDate = new Date(year, month, 1).toISOString().split("T")[0]
  const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0]

  const { data: notes } = await supabase
    .from("handover_notes")
    .select("id, note_date, priority, title")
    .gte("note_date", startDate)
    .lte("note_date", endDate)

  const { data: complaints } = await supabase
    .from("complaints")
    .select("id, created_at, priority, status")
    .gte("created_at", `${startDate}T00:00:00`)
    .lte("created_at", `${endDate}T23:59:59`)

  const calendarNotes = (notes || []) as Pick<HandoverNote, "id" | "note_date" | "priority" | "title">[]
  const calendarComplaints = (complaints || []) as Pick<Complaint, "id" | "created_at" | "priority" | "status">[]

  const activeDays = new Set([
    ...calendarNotes.map((note) => note.note_date),
    ...calendarComplaints.map((item) => item.created_at.split("T")[0]),
  ]).size
  const totalNotes = calendarNotes.length
  const openComplaints = calendarComplaints.filter((item) => item.status === "open").length
  const urgentItems =
    calendarNotes.filter((note) => note.priority === "urgent").length +
    calendarComplaints.filter((item) => item.priority === "urgent").length

  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear()


  return (
    <div className="min-h-full bg-background p-4 sm:p-6 lg:p-8">
      <Card className="border-border/70 bg-gradient-to-r from-slate-500/10 via-transparent to-transparent">
        <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Calendar View</h1>
              <p className="mt-1 text-sm text-muted-foreground">Overview of handover notes and complaints by date.</p>
            </div>
          </div>

          <div className="space-y-3 lg:min-w-[460px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Monthly overview</p>
                <p className="text-lg font-semibold text-foreground">{MONTHS[month]} {year}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="icon" className="bg-white">
                  <Link href={`/dashboard/calendar?month=${prevMonth}&year=${prevYear}`} aria-label="Previous month">
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="icon" className="bg-white">
                  <Link href={`/dashboard/calendar?month=${nextMonth}&year=${nextYear}`} aria-label="Next month">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                {isCurrentMonth ? (
                  <Button variant="outline" className="bg-white" disabled>
                    Today
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="bg-white">
                    <Link href={`/dashboard/calendar?month=${now.getMonth()}&year=${now.getFullYear()}`}>Today</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border bg-white px-3 py-2">
                <p className="text-xs text-muted-foreground">Active days</p>
                <p className="text-lg font-semibold">{activeDays}</p>
              </div>
              <div className="rounded-lg border bg-white px-3 py-2">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-lg font-semibold">{totalNotes}</p>
              </div>
              <div className="rounded-lg border bg-white px-3 py-2">
                <p className="text-xs text-muted-foreground">Open complaints</p>
                <p className="text-lg font-semibold">{openComplaints}</p>
              </div>
              <div className="rounded-lg border bg-white px-3 py-2">
                <p className="text-xs text-muted-foreground">Urgent items</p>
                <p className="text-lg font-semibold">{urgentItems}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      <CalendarView
        notes={calendarNotes}
        complaints={calendarComplaints}
        month={month}
        year={year}
      />
    </div>
  )
}
