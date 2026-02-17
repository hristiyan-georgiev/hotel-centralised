"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, addWeeks, subWeeks } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Filter,
  CalendarIcon,
  Users,
  Briefcase,
} from "lucide-react"
import type { Profile, Department, Shift, ScheduleEvent, ScheduleTask } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ShiftDetailDialog } from "./shift-detail-dialog"
import { EventDetailDialog } from "./event-detail-dialog"
import { TaskDetailDialog } from "./task-detail-dialog"

interface ScheduleViewProps {
  profile: Profile
  shifts: Shift[]
  events: ScheduleEvent[]
  tasks: ScheduleTask[]
  departments: Department[]
  staffMembers: Profile[]
}

export function ScheduleView({ profile, shifts, events, tasks, departments, staffMembers }: ScheduleViewProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [filterDepartment, setFilterDepartment] = useState<string>("all")
  const [filterStaff, setFilterStaff] = useState<string>("all")
  const [view, setView] = useState<"week" | "day">("week")

  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [selectedTask, setSelectedTask] = useState<ScheduleTask | null>(null)

  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(weekStart, { weekStartsOn: 1 }),
    })
  }, [weekStart])

  // Filter logic
  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      if (filterDepartment !== "all" && shift.department_id !== filterDepartment) return false
      if (filterStaff !== "all" && shift.staff_id !== filterStaff) return false
      return true
    })
  }, [shifts, filterDepartment, filterStaff])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filterDepartment !== "all" && event.department_id && event.department_id !== filterDepartment) return false
      return true
    })
  }, [events, filterDepartment])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterDepartment !== "all" && task.department_id !== filterDepartment) return false
      if (filterStaff !== "all" && task.assigned_to !== filterStaff) return false
      return true
    })
  }, [tasks, filterDepartment, filterStaff])

  const selectedDayShifts = useMemo(
    () => filteredShifts.filter((shift) => isSameDay(parseISO(shift.shift_date), selectedDate)),
    [filteredShifts, selectedDate],
  )

  const selectedDayEvents = useMemo(
    () => filteredEvents.filter((event) => isSameDay(parseISO(event.event_date), selectedDate)),
    [filteredEvents, selectedDate],
  )

  const selectedDayTasks = useMemo(
    () => filteredTasks.filter((task) => isSameDay(parseISO(task.due_date), selectedDate)),
    [filteredTasks, selectedDate],
  )

  // Get items for a specific date
  const getShiftsForDate = (date: Date) => {
    return filteredShifts.filter((shift) => isSameDay(parseISO(shift.shift_date), date))
  }

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter((event) => isSameDay(parseISO(event.event_date), date))
  }

  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter((task) => isSameDay(parseISO(task.due_date), date))
  }

  // Stats for header
  const myShiftsThisWeek = shifts.filter(
    (s) => s.staff_id === profile.id && weekDays.some((d) => isSameDay(parseISO(s.shift_date), d)),
  ).length

  const myConfirmedShiftsThisWeek = shifts.filter(
    (s) => s.staff_id === profile.id && s.acknowledged && weekDays.some((d) => isSameDay(parseISO(s.shift_date), d)),
  ).length

  const unacknowledgedShifts = shifts.filter((s) => s.staff_id === profile.id && !s.acknowledged).length
  const pendingTasks = tasks.filter((t) => t.assigned_to === profile.id && t.status !== "completed").length

  const myTotalTasks = tasks.filter((t) => t.assigned_to === profile.id).length
  const myCompletedTasks = tasks.filter((t) => t.assigned_to === profile.id && t.status === "completed").length

  const weekTotals = useMemo(() => {
    const inCurrentWeek = (dateString: string) => weekDays.some((day) => isSameDay(parseISO(dateString), day))

    return {
      shifts: filteredShifts.filter((shift) => inCurrentWeek(shift.shift_date)).length,
      events: filteredEvents.filter((event) => inCurrentWeek(event.event_date)).length,
      tasks: filteredTasks.filter((task) => inCurrentWeek(task.due_date)).length,
    }
  }, [filteredShifts, filteredEvents, filteredTasks, weekDays])

  const visibleStaffMembers = useMemo(() => {
    return staffMembers
      .filter((staff) => (filterDepartment === "all" ? true : staff.department_id === filterDepartment))
      .filter((staff) => (filterStaff === "all" ? true : staff.id === filterStaff))
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [staffMembers, filterDepartment, filterStaff])

  const shiftConfirmationRate = myShiftsThisWeek === 0 ? 100 : Math.round((myConfirmedShiftsThisWeek / myShiftsThisWeek) * 100)
  const taskCompletionRate = myTotalTasks === 0 ? 0 : Math.round((myCompletedTasks / myTotalTasks) * 100)

  const weekLabel = `${format(weekStart, "MMM d")} - ${format(endOfWeek(weekStart, { weekStartsOn: 1 }), "MMM d, yyyy")}`

  const syncSelectedDate = (date: Date) => {
    setSelectedDate(date)
    setWeekStart(startOfWeek(date, { weekStartsOn: 1 }))
  }

  const handleAcknowledgeShift = async (shiftId: string) => {
    const supabase = createClient()
    await supabase
      .from("shifts")
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq("id", shiftId)
    router.refresh()
    setSelectedShift(null)
  }

  const handleAcknowledgeEvent = async (eventId: string) => {
    const supabase = createClient()

    // Check if attendance record exists
    const { data: existing } = await supabase
      .from("event_attendees")
      .select("id")
      .eq("event_id", eventId)
      .eq("staff_id", profile.id)
      .single()

    if (existing) {
      await supabase
        .from("event_attendees")
        .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq("id", existing.id)
    } else {
      await supabase.from("event_attendees").insert({
        event_id: eventId,
        staff_id: profile.id,
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
    }

    router.refresh()
    setSelectedEvent(null)
  }

  const handleAcknowledgeTask = async (taskId: string) => {
    const supabase = createClient()
    await supabase
      .from("schedule_tasks")
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq("id", taskId)
    router.refresh()
    setSelectedTask(null)
  }

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    const supabase = createClient()
    const updates: Record<string, unknown> = { status }
    if (status === "completed") {
      updates.completed_at = new Date().toISOString()
    }
    await supabase.from("schedule_tasks").update(updates).eq("id", taskId)
    router.refresh()
    setSelectedTask(null)
  }

  return (
    <div className="space-y-5">
      <Card className="border-border/70 bg-gradient-to-r from-slate-500/10 via-transparent to-transparent">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
                <p className="mt-1 text-sm text-muted-foreground">{weekLabel}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="cursor-pointer bg-white" onClick={() => syncSelectedDate(new Date())}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Today
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="cursor-pointer bg-white" variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Jump to date
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        syncSelectedDate(date)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Tabs value={view} onValueChange={(value) => setView(value as "week" | "day")}
              >
                <TabsList className="h-9">
                  <TabsTrigger value="week" className="cursor-pointer text-xs data-[state=inactive]:hover:bg-white/40">Week</TabsTrigger>
                  <TabsTrigger value="day" className="cursor-pointer text-xs data-[state=inactive]:hover:bg-white/40">Day</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Department</p>
              <div className="relative">
                <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="h-10 w-full cursor-pointer pl-8 bg-white/60">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value="all">All departments</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Staff</p>
              <Select value={filterStaff} onValueChange={setFilterStaff}>
                <SelectTrigger className="h-10 w-full cursor-pointer bg-white/60">
                  <SelectValue placeholder="All staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="all">All staff</SelectItem>
                  <SelectItem className="cursor-pointer" value={profile.id}>My schedule</SelectItem>
                  {staffMembers
                    .filter((staff) => staff.id !== profile.id)
                    .map((staff) => (
                      <SelectItem className="cursor-pointer" key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
                {filterDepartment === "all" ? "All departments" : "Filtered department"} - {filterStaff === "all" ? "All staff" : "Filtered staff"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">My shifts this week</p>
            <p className="mt-1 text-2xl font-semibold">{myShiftsThisWeek}</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Confirmation</span>
                <span>{shiftConfirmationRate}%</span>
              </div>
              <Progress value={shiftConfirmationRate} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Unconfirmed shifts</p>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-1 text-2xl font-semibold">{unacknowledgedShifts}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">Pending acknowledgement from your profile</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">My pending tasks</p>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-1 text-2xl font-semibold">{pendingTasks}</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Completion</span>
                <span>{taskCompletionRate}%</span>
              </div>
              <Progress value={taskCompletionRate} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Items this week</p>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-1 text-2xl font-semibold">{weekTotals.shifts + weekTotals.events + weekTotals.tasks}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
              <Badge variant="secondary">{weekTotals.shifts} shifts</Badge>
              <Badge variant="secondary">{weekTotals.events} events</Badge>
              <Badge variant="secondary">{weekTotals.tasks} tasks</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {view === "week" ? (
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Team rota table</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const prevWeek = subWeeks(weekStart, 1)
                    setWeekStart(prevWeek)
                    setSelectedDate(prevWeek)
                  }}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextWeek = addWeeks(weekStart, 1)
                    setWeekStart(nextWeek)
                    setSelectedDate(nextWeek)
                  }}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="mb-4 rounded-lg border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">Team events this week</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {weekDays.map((day) => {
                  const dayEvents = getEventsForDate(day)
                  return (
                    <div key={`event-strip-${day.toISOString()}`} className="rounded-md border bg-background p-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{format(day, "EEE d MMM")}</p>
                      {dayEvents.length === 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">No events</p>
                      ) : (
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <button
                              key={`week-event-strip-${event.id}`}
                              onClick={() => setSelectedEvent(event)}
                              className="w-full truncate rounded border border-blue-200 bg-blue-50 px-2 py-1 text-left text-[11px] font-medium text-blue-900 hover:bg-blue-100 cursor-pointer"
                            >
                              {(event.start_time?.slice(0, 5) || "All day") + ` - ${event.title}`}
                            </button>
                          ))}
                          {dayEvents.length > 2 && <p className="text-[11px] text-muted-foreground">+{dayEvents.length - 2} more</p>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {visibleStaffMembers.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                No team members match the current filters.
              </div>
            ) : (
              <Table className="min-w-[1300px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Team member</TableHead>
                    {weekDays.map((day) => {
                      const isToday = isSameDay(day, new Date())
                      return (
                        <TableHead key={`header-${day.toISOString()}`} className={cn("w-[170px]", isToday && "text-primary")}>
                          <div className="leading-tight">
                            <p className="text-[11px] uppercase tracking-wide">{format(day, "EEE")}</p>
                            <p>{format(day, "d MMM")}</p>
                          </div>
                        </TableHead>
                      )
                    })}
                    <TableHead className="w-[140px]">Weekly load</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleStaffMembers.map((staff) => {
                    const staffWeekShifts = filteredShifts.filter(
                      (shift) => shift.staff_id === staff.id && weekDays.some((day) => isSameDay(parseISO(shift.shift_date), day)),
                    ).length

                    const staffWeekTasks = filteredTasks.filter(
                      (task) => task.assigned_to === staff.id && weekDays.some((day) => isSameDay(parseISO(task.due_date), day)),
                    ).length

                    return (
                      <TableRow key={`staff-row-${staff.id}`}>
                        <TableCell className="align-top whitespace-normal">
                          <p className="font-semibold">{staff.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                        </TableCell>

                        {weekDays.map((day) => {
                          const staffDayShifts = filteredShifts.filter(
                            (shift) => shift.staff_id === staff.id && isSameDay(parseISO(shift.shift_date), day),
                          )

                          const staffDayTasks = filteredTasks.filter(
                            (task) => task.assigned_to === staff.id && isSameDay(parseISO(task.due_date), day),
                          )

                          return (
                            <TableCell key={`staff-day-${staff.id}-${day.toISOString()}`} className="align-top whitespace-normal">
                              {staffDayShifts.length === 0 && staffDayTasks.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Off</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {staffDayShifts.map((shift) => (
                                    <button
                                      key={`staff-shift-${shift.id}`}
                                      onClick={() => setSelectedShift(shift)}
                                      className={cn(
                                        "w-full rounded border px-2 py-1 text-left text-[11px] transition-colors cursor-pointer",
                                        shift.acknowledged
                                          ? "border-primary/30 bg-primary/[0.06] hover:bg-primary/[0.12]"
                                          : "border-amber-200 bg-amber-50 hover:bg-amber-100",
                                      )}
                                    >
                                      <span className="inline-flex items-center gap-1 font-medium">
                                        <Clock className="h-3 w-3" />
                                        {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                                      </span>
                                    </button>
                                  ))}

                                  {staffDayTasks.map((task) => (
                                    <button
                                      key={`staff-task-${task.id}`}
                                      onClick={() => setSelectedTask(task)}
                                      className={cn(
                                        "w-full rounded border px-2 py-1 text-left text-[11px] transition-colors cursor-pointer",
                                        task.status === "completed"
                                          ? "border-green-200 bg-green-50"
                                          : task.priority === "urgent"
                                            ? "border-red-200 bg-red-50 hover:bg-red-100"
                                            : "border-border/70 bg-background hover:bg-muted/40",
                                      )}
                                    >
                                      <span className="font-medium">Task:</span> {task.title}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                          )
                        })}

                        <TableCell className="align-top whitespace-normal">
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p>
                              <span className="font-semibold text-foreground">{staffWeekShifts}</span> shifts
                            </p>
                            <p>
                              <span className="font-semibold text-foreground">{staffWeekTasks}</span> tasks
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[280px_1fr]">
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{format(selectedDate, "EEEE, MMM d")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      syncSelectedDate(date)
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md border p-2">
                  <p className="font-semibold">{selectedDayShifts.length}</p>
                  <p className="text-muted-foreground">Shifts</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="font-semibold">{selectedDayEvents.length}</p>
                  <p className="text-muted-foreground">Events</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="font-semibold">{selectedDayTasks.length}</p>
                  <p className="text-muted-foreground">Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Day team table</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const previousDay = new Date(selectedDate)
                      previousDay.setDate(previousDay.getDate() - 1)
                      syncSelectedDate(previousDay)
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const nextDay = new Date(selectedDate)
                      nextDay.setDate(nextDay.getDate() + 1)
                      syncSelectedDate(nextDay)
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {visibleStaffMembers.length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                  No team members match the current filters.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[230px]">Team member</TableHead>
                      <TableHead>Shifts</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead className="w-[140px]">Daily load</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleStaffMembers.map((staff) => {
                      const staffDayShifts = selectedDayShifts.filter((shift) => shift.staff_id === staff.id)
                      const staffDayTasks = selectedDayTasks.filter((task) => task.assigned_to === staff.id)

                      return (
                        <TableRow key={`day-staff-${staff.id}`}>
                          <TableCell className="align-top whitespace-normal">
                            <p className="font-semibold">{staff.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                          </TableCell>

                          <TableCell className="align-top whitespace-normal">
                            {staffDayShifts.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No shift</p>
                            ) : (
                              <div className="space-y-1.5">
                                {staffDayShifts.map((shift) => (
                                  <button
                                    key={`day-staff-shift-${shift.id}`}
                                    onClick={() => setSelectedShift(shift)}
                                    className={cn(
                                      "w-full rounded border px-2 py-1 text-left text-[11px] transition-colors cursor-pointer",
                                      shift.acknowledged
                                        ? "border-primary/30 bg-primary/[0.06] hover:bg-primary/[0.12]"
                                        : "border-amber-200 bg-amber-50 hover:bg-amber-100",
                                    )}
                                  >
                                    {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                                  </button>
                                ))}
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="align-top whitespace-normal">
                            {staffDayTasks.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No tasks</p>
                            ) : (
                              <div className="space-y-1.5">
                                {staffDayTasks.map((task) => (
                                  <button
                                    key={`day-staff-task-${task.id}`}
                                    onClick={() => setSelectedTask(task)}
                                    className={cn(
                                      "w-full rounded border px-2 py-1 text-left text-[11px] transition-colors cursor-pointer",
                                      task.status === "completed"
                                        ? "border-green-200 bg-green-50"
                                        : task.priority === "urgent"
                                          ? "border-red-200 bg-red-50 hover:bg-red-100"
                                          : "border-border/70 bg-background hover:bg-muted/40",
                                    )}
                                  >
                                    {task.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="align-top whitespace-normal">
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p>
                                <span className="font-semibold text-foreground">{staffDayShifts.length}</span> shifts
                              </p>
                              <p>
                                <span className="font-semibold text-foreground">{staffDayTasks.length}</span> tasks
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}

              <div className="mt-4 border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground">Team events today</p>
                {selectedDayEvents.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No events scheduled for this day.</p>
                ) : (
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {selectedDayEvents.map((event) => (
                      <button
                        key={`day-event-card-${event.id}`}
                        onClick={() => setSelectedEvent(event)}
                        className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-left transition-colors hover:bg-blue-100 cursor-pointer"
                      >
                        <p className="text-sm font-medium text-blue-900">{event.title}</p>
                        <p className="text-xs text-blue-800/80">
                          {(event.start_time?.slice(0, 5) || "All day") + (event.location ? ` - ${event.location}` : "")}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Detail Dialogs */}
      <ShiftDetailDialog
        shift={selectedShift}
        profile={profile}
        onClose={() => setSelectedShift(null)}
        onAcknowledge={handleAcknowledgeShift}
      />
      <EventDetailDialog
        event={selectedEvent}
        profile={profile}
        onClose={() => setSelectedEvent(null)}
        onAcknowledge={handleAcknowledgeEvent}
      />
      <TaskDetailDialog
        task={selectedTask}
        profile={profile}
        onClose={() => setSelectedTask(null)}
        onAcknowledge={handleAcknowledgeTask}
        onUpdateStatus={handleUpdateTaskStatus}
      />
    </div>
  )
}
