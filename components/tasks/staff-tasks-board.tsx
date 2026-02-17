"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format, isBefore, parseISO, startOfDay } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  User2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile, ScheduleTask } from "@/lib/types"
import { TaskDetailDialog } from "@/components/schedule/task-detail-dialog"

interface StaffTasksBoardProps {
  profile: Profile
  tasks: ScheduleTask[]
}

type TaskView = "assigned" | "queue" | "completed"

const statusLabels: Record<ScheduleTask["status"], string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
}

export function StaffTasksBoard({ profile, tasks }: StaffTasksBoardProps) {
  const router = useRouter()
  const [view, setView] = useState<TaskView>("assigned")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTask, setSelectedTask] = useState<ScheduleTask | null>(null)

  const today = new Date()
  const todayStart = startOfDay(today)
  const todayKey = format(today, "yyyy-MM-dd")

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const dueDateSort = a.due_date.localeCompare(b.due_date)
      if (dueDateSort !== 0) return dueDateSort

      const timeA = a.due_time ?? "23:59:59"
      const timeB = b.due_time ?? "23:59:59"
      return timeA.localeCompare(timeB)
    })
  }, [tasks])

  const myTasks = useMemo(() => sortedTasks.filter((task) => task.assigned_to === profile.id), [sortedTasks, profile.id])

  const queueTasks = useMemo(
    () =>
      sortedTasks.filter(
        (task) => task.status !== "completed" && (task.assigned_to !== profile.id || task.assigned_to === null),
      ),
    [sortedTasks, profile.id],
  )

  const completedTasks = useMemo(() => sortedTasks.filter((task) => task.status === "completed"), [sortedTasks])

  const activeTasks = useMemo(() => {
    if (view === "assigned") return myTasks
    if (view === "queue") return queueTasks
    return completedTasks
  }, [completedTasks, myTasks, queueTasks, view])

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return activeTasks

    return activeTasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.assignee?.full_name?.toLowerCase().includes(query) ||
        task.department?.name?.toLowerCase().includes(query) ||
        task.due_date.includes(query)
      )
    })
  }, [activeTasks, searchQuery])

  const openMine = myTasks.filter((task) => task.status !== "completed").length
  const dueTodayMine = myTasks.filter((task) => task.status !== "completed" && task.due_date === todayKey).length
  const overdueMine = myTasks.filter(
    (task) => task.status !== "completed" && isBefore(parseISO(task.due_date), todayStart),
  ).length
  const completionRate = myTasks.length > 0 ? Math.round((myTasks.filter((task) => task.status === "completed").length / myTasks.length) * 100) : 0

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
    if (status !== "pending" && status !== "in_progress" && status !== "completed") {
      return
    }

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
      <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-slate-500/10 via-transparent to-transparent p-5 sm:px-6 sm:py-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Staff Tasks</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Stay on top of assigned duties, acknowledge new work, and update progress in real time.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border bg-white shadow-none">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">My open tasks</p>
              <p className="text-2xl font-semibold text-foreground">{openMine}</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-white shadow-none">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Due today</p>
              <p className="text-2xl font-semibold text-foreground">{dueTodayMine}</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-white shadow-none">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Overdue</p>
              <p className={cn("text-2xl font-semibold text-foreground", overdueMine > 0 && "text-destructive")}>{overdueMine}</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-white shadow-none">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <span>Completion</span>
                <span>{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-1.5" />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={view} onValueChange={(value) => setView(value as TaskView)}>
            <TabsList className="h-10 bg-muted/70">
              <TabsTrigger value="assigned" className="cursor-pointer gap-2 text-xs sm:text-sm">
                <Briefcase className="h-4 w-4" />
                Assigned to me
              </TabsTrigger>
              <TabsTrigger value="queue" className="cursor-pointer gap-2 text-xs sm:text-sm hover:bg-white/40">
                <User2 className="h-4 w-4" />
                Team queue
              </TabsTrigger>
              <TabsTrigger value="completed" className="cursor-pointer gap-2 text-xs sm:text-sm hover:bg-white/40">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full lg:max-w-sm bg-white">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tasks by title, assignee, or date"
              className="pl-10"
            />
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold">No tasks found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try switching tabs or refining your search.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => {
              const isMine = task.assigned_to === profile.id
              const isOverdue = task.status !== "completed" && isBefore(parseISO(task.due_date), todayStart)

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setSelectedTask(task)}
                  className={cn(
                    "rounded-2xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
                    task.status === "completed"
                      ? "border-green-200 bg-green-50/70 dark:border-green-900/40 dark:bg-green-950/20"
                      : task.priority === "urgent"
                        ? "border-red-200 bg-red-50/70 dark:border-red-900/40 dark:bg-red-950/20"
                        : "border-border/70 bg-card",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={task.priority === "urgent" ? "destructive" : task.priority === "low" ? "secondary" : "default"}>
                      {task.priority}
                    </Badge>
                    <Badge variant="outline">{statusLabels[task.status]}</Badge>
                    {isOverdue && (
                      <Badge variant="outline" className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-300">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Overdue
                      </Badge>
                    )}
                  </div>

                  <h3 className="mt-3 line-clamp-2 text-base font-semibold">{task.title}</h3>
                  {task.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>}

                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Due {format(parseISO(task.due_date), "EEE, MMM d, yyyy")}
                      {task.due_time && (
                        <>
                          <span className="mx-1">•</span>
                          <Clock3 className="h-3.5 w-3.5" />
                          {task.due_time.slice(0, 5)}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User2 className="h-3.5 w-3.5" />
                      {task.assignee?.full_name || "Unassigned"}
                    </div>
                  </div>

                  {isMine && (
                    <div className="mt-3 inline-flex items-center rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {task.acknowledged ? "Acknowledged" : "Awaiting acknowledgement"}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </section>

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
