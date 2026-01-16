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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{myShiftsThisWeek}</p>
                <p className="text-sm font-medium text-muted-foreground">My Shifts This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-600">{unacknowledgedShifts}</p>
                <p className="text-sm font-medium text-muted-foreground">Unconfirmed Shifts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{pendingTasks}</p>
                <p className="text-sm font-medium text-muted-foreground">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStaff} onValueChange={setFilterStaff}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              <SelectItem value={profile.id}>My Schedule</SelectItem>
              {staffMembers
                .filter((s) => s.id !== profile.id)
                .map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.full_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
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
          <Tabs value={view} onValueChange={(v) => setView(v as "week" | "day")} className="hidden sm:block">
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
        </CardContent>
      </Card>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-4">
        <Button variant="outline" size="default" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Week
        </Button>
        <h2 className="text-xl font-bold">
          {format(weekStart, "MMM d")} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), "MMM d, yyyy")}
        </h2>
        <Button variant="outline" size="default" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
          Next Week
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Schedule Grid */}
      {view === "week" ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayShifts = getShiftsForDate(day)
            const dayEvents = getEventsForDate(day)
            const dayTasks = getTasksForDate(day)
            const isToday = isSameDay(day, new Date())

            return (
              <Card key={day.toISOString()} className={cn(
                "min-h-[200px] transition-shadow hover:shadow-md",
                isToday && "ring-2 ring-primary shadow-lg"
              )}>
                <CardHeader className="py-3 px-3 border-b bg-secondary/20">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className={cn(isToday && "text-primary")}>{format(day, "EEE")}</span>
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                        isToday ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-2 space-y-1.5">
                  {/* Shifts */}
                  {dayShifts.map((shift) => (
                    <button
                      key={shift.id}
                      onClick={() => setSelectedShift(shift)}
                      className={cn(
                        "w-full text-left p-2 rounded-md text-xs transition-colors",
                        shift.staff_id === profile.id
                          ? "bg-primary/10 hover:bg-primary/20 border-l-2 border-primary"
                          : "bg-secondary hover:bg-secondary/80",
                        !shift.acknowledged && shift.staff_id === profile.id && "animate-pulse",
                      )}
                    >
                      <div className="flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3" />
                        {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                      </div>
                      <div className="truncate text-muted-foreground mt-0.5">
                        {shift.staff?.full_name || "Unassigned"}
                      </div>
                      {shift.staff_id === profile.id && !shift.acknowledged && (
                        <Badge variant="outline" className="mt-1 text-[10px] h-4">
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
                      className="w-full text-left p-2 rounded-md text-xs bg-blue-500/10 hover:bg-blue-500/20 border-l-2 border-blue-500 transition-colors"
                    >
                      <div className="flex items-center gap-1 font-medium text-blue-700 dark:text-blue-300">
                        <Users className="h-3 w-3" />
                        {event.title}
                      </div>
                      {event.start_time && (
                        <div className="text-muted-foreground mt-0.5">{event.start_time.slice(0, 5)}</div>
                      )}
                    </button>
                  ))}

                  {/* Tasks */}
                  {dayTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={cn(
                        "w-full text-left p-2 rounded-md text-xs transition-colors border-l-2",
                        task.status === "completed"
                          ? "bg-green-500/10 border-green-500 opacity-60"
                          : task.priority === "urgent"
                            ? "bg-destructive/10 border-destructive hover:bg-destructive/20"
                            : "bg-amber-500/10 border-amber-500 hover:bg-amber-500/20",
                      )}
                    >
                      <div className="flex items-center gap-1 font-medium">
                        {task.status === "completed" ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                        <span className="truncate">{task.title}</span>
                      </div>
                      {task.assignee && (
                        <div className="text-muted-foreground mt-0.5 truncate">{task.assignee.full_name}</div>
                      )}
                    </button>
                  ))}

                  {dayShifts.length === 0 && dayEvents.length === 0 && dayTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No items</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Day View */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
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
                  variant="outline"
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
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Shifts Section */}
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4" />
                Shifts ({getShiftsForDate(selectedDate).length})
              </h3>
              <div className="space-y-2">
                {getShiftsForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No shifts scheduled</p>
                ) : (
                  getShiftsForDate(selectedDate).map((shift) => (
                    <button
                      key={shift.id}
                      onClick={() => setSelectedShift(shift)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border transition-colors",
                        shift.staff_id === profile.id
                          ? "border-primary bg-primary/5 hover:bg-primary/10"
                          : "hover:bg-secondary",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{shift.staff?.full_name || "Unassigned"}</p>
                            <p className="text-sm text-muted-foreground">
                              {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                              {shift.department && ` • ${shift.department.name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={shift.shift_type === "regular" ? "secondary" : "outline"}>
                            {shift.shift_type}
                          </Badge>
                          {shift.acknowledged ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            shift.staff_id === profile.id && (
                              <Badge variant="destructive" className="animate-pulse">
                                Confirm
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Events Section */}
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                Events ({getEventsForDate(selectedDate).length})
              </h3>
              <div className="space-y-2">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events scheduled</p>
                ) : (
                  getEventsForDate(selectedDate).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-4 rounded-lg border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            {event.start_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.start_time.slice(0, 5)}
                                {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">{event.event_type}</Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Tasks Section */}
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Briefcase className="h-4 w-4" />
                Tasks ({getTasksForDate(selectedDate).length})
              </h3>
              <div className="space-y-2">
                {getTasksForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks due</p>
                ) : (
                  getTasksForDate(selectedDate).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border transition-colors",
                        task.status === "completed"
                          ? "border-green-500/30 bg-green-500/5 opacity-60"
                          : task.priority === "urgent"
                            ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                            : "hover:bg-secondary",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Assigned to: {task.assignee?.full_name || "Unassigned"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              task.priority === "urgent"
                                ? "destructive"
                                : task.priority === "low"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {task.priority}
                          </Badge>
                          <Badge variant="outline">{task.status.replace("_", " ")}</Badge>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
