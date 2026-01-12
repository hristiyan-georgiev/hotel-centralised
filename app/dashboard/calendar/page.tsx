import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CalendarView } from "@/components/dashboard/calendar-view"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react"
import type { HandoverNote, Complaint } from "@/lib/types"

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


  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar View</h1>
        <p className="text-muted-foreground mt-1">Overview of handover notes by date</p>
      </div>


      <CalendarView
        notes={(notes || []) as Pick<HandoverNote, "id" | "note_date" | "priority" | "title">[]}
        complaints={(complaints || []) as Pick<Complaint, "id" | "created_at" | "priority" | "status">[]}
        month={month}
        year={year}
      />
    </div>
  )
}
