"use client"

import { useState, useMemo } from "react"
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
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  Circle,
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

  const unacknowledgedShifts = shifts.filter((s) => s.staff_id === profile.id && !s.acknowledged).length
  const pendingTasks = tasks.filter((t) => t.assigned_to === profile.id && t.status !== "completed").length

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
    <div className="space-y-4">
      {/* Stats and Filters Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Stats Row */}
            <div className="flex items-center gap-6 pb-4 border-b">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">My shifts:</span>
                <Badge variant="secondary" className="font-semibold">{myShiftsThisWeek}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-muted-foreground">Unconfirmed:</span>
                <Badge variant={unacknowledgedShifts > 0 ? "destructive" : "secondary"} className="font-semibold">
                  {unacknowledgedShifts}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Pending tasks:</span>
                <Badge variant="secondary" className="font-semibold">{pendingTasks}</Badge>
              </div>
            </div>

            {/* Filters and View Toggle Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-[160px] h-9 cursor-pointer">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStaff} onValueChange={setFilterStaff}>
                  <SelectTrigger className="w-[160px] h-9 cursor-pointer">
                    <SelectValue placeholder="All Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value="all">All Staff</SelectItem>
                    <SelectItem className="cursor-pointer" value={profile.id}>My Schedule</SelectItem>
                    {staffMembers
                      .filter((s) => s.id !== profile.id)
                      .map((staff) => (
                        <SelectItem className="cursor-pointer" key={staff.id} value={staff.id}>
                          {staff.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="cursor-pointer" variant="outline" size="sm">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Jump to date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date)
                          setWeekStart(startOfWeek(date, { weekStartsOn: 1 }))
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Tabs value={view} onValueChange={(v) => setView(v as "week" | "day")}>
                  <TabsList className="h-9">
                    <TabsTrigger value="week" className="text-xs cursor-pointer">Week</TabsTrigger>
                    <TabsTrigger value="day" className="text-xs cursor-pointer">Day</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button className="cursor-pointer" variant="ghost" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <h2 className="text-lg font-semibold">
          {format(weekStart, "MMM d")} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), "MMM d, yyyy")}
        </h2>
        <Button className="cursor-pointer" variant="ghost" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Schedule Grid */}
      {view === "week" ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayShifts = getShiftsForDate(day)
            const dayEvents = getEventsForDate(day)
            const dayTasks = getTasksForDate(day)
            const isToday = isSameDay(day, new Date())

            return (
              <Card key={day.toISOString()} className={cn(
                "min-h-[180px]",
                isToday && "ring-2 ring-primary"
              )}>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span className={cn("text-sm font-medium", isToday && "text-primary")}>
                      {format(day, "EEE")}
                    </span>
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                        isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-1.5">
                  {/* Shifts */}
                  {dayShifts.map((shift) => (
                    <button
                      key={shift.id}
                      onClick={() => setSelectedShift(shift)}
                      className={cn(
                        "w-full text-left p-2 rounded-md text-xs transition-colors cursor-pointer",
                        shift.staff_id === profile.id
                          ? "bg-primary/10 hover:bg-primary/15 border-l-2 border-primary"
                          : "bg-muted/50 hover:bg-muted",
                        !shift.acknowledged && shift.staff_id === profile.id && "ring-1 ring-primary/30",
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{shift.start_time?.slice(0, 5)}-{shift.end_time?.slice(0, 5)}</span>
                      </div>
                      <div className="truncate text-muted-foreground mt-1 text-[11px]">
                        {shift.staff?.full_name || "Unassigned"}
                      </div>
                      {shift.staff_id === profile.id && !shift.acknowledged && (
                        <Badge variant="outline" className="mt-1 text-[10px] h-4 bg-background cursor-pointer">
                          Confirm
                        </Badge>
                      )}
                    </button>
                  ))}

                  {/* Events */}
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-2 rounded-md text-xs bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 border-l-2 border-blue-500 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-300">
                        <Users className="h-3 w-3 shrink-0" />
                        <span className="truncate">{event.title}</span>
                      </div>
                      {event.start_time && (
                        <div className="text-muted-foreground mt-1 text-[11px]">{event.start_time.slice(0, 5)}</div>
                      )}
                    </button>
                  ))}

                  {/* Tasks */}
                  {dayTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={cn(
                        "w-full text-left p-2 rounded-md text-xs transition-colors border-l-2 cursor-pointer",
                        task.status === "completed"
                          ? "bg-green-50 dark:bg-green-950/20 border-green-500 opacity-70"
                          : task.priority === "urgent"
                            ? "bg-red-50 dark:bg-red-950/20 border-destructive hover:bg-red-100 dark:hover:bg-red-950/30"
                            : "bg-amber-50 dark:bg-amber-950/20 border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-950/30",
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {task.status === "completed" ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate font-medium">{task.title}</span>
                      </div>
                      {task.assignee && (
                        <div className="text-muted-foreground mt-1 truncate text-[11px]">{task.assignee.full_name}</div>
                      )}
                    </button>
                  ))}

                  {dayShifts.length === 0 && dayEvents.length === 0 && dayTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">No items</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Day View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</h2>
            <div className="flex gap-2">
              <Button
                className="cursor-pointer"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const prev = new Date(selectedDate)
                  prev.setDate(prev.getDate() - 1)
                  setSelectedDate(prev)
                  setWeekStart(startOfWeek(prev, { weekStartsOn: 1 }))
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                className="cursor-pointer"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const next = new Date(selectedDate)
                  next.setDate(next.getDate() + 1)
                  setSelectedDate(next)
                  setWeekStart(startOfWeek(next, { weekStartsOn: 1 }))
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {/* Shifts Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Shifts ({getShiftsForDate(selectedDate).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {getShiftsForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No shifts scheduled</p>
                ) : (
                  getShiftsForDate(selectedDate).map((shift) => (
                    <button
                      key={shift.id}
                      onClick={() => setSelectedShift(shift)}
                      className={cn(
                        "w-full text-left p-3 rounded-md border transition-colors cursor-pointer",
                        shift.staff_id === profile.id
                          ? "border-primary bg-primary/5 hover:bg-primary/10"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{shift.staff?.full_name || "Unassigned"}</p>
                            <p className="text-xs text-muted-foreground">
                              {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                              {shift.department && ` • ${shift.department.name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={shift.shift_type === "regular" ? "secondary" : "outline"} className="text-xs">
                            {shift.shift_type}
                          </Badge>
                          {shift.acknowledged ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            shift.staff_id === profile.id && (
                              <Badge variant="destructive" className="text-xs cursor-pointer">
                                Confirm
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Events Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Events ({getEventsForDate(selectedDate).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No events scheduled</p>
                ) : (
                  getEventsForDate(selectedDate).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-3 rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{event.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            {event.start_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.start_time.slice(0, 5)}
                                {event.end_time && `-${event.end_time.slice(0, 5)}`}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">{event.event_type}</Badge>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Tasks Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Tasks ({getTasksForDate(selectedDate).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {getTasksForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No tasks due</p>
                ) : (
                  getTasksForDate(selectedDate).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={cn(
                        "w-full text-left p-3 rounded-md border transition-colors cursor-pointer",
                        task.status === "completed"
                          ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 opacity-70"
                          : task.priority === "urgent"
                            ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30"
                            : "hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {task.assignee?.full_name || "Unassigned"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={
                              task.priority === "urgent"
                                ? "destructive"
                                : task.priority === "low"
                                  ? "secondary"
                                  : "default"
                            }
                            className="text-xs"
                          >
                            {task.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{task.status.replace("_", " ")}</Badge>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
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
