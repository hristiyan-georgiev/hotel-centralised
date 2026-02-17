"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format, isBefore, parseISO, startOfDay } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Department, Profile, ScheduleTask } from "@/lib/types"
import { CreateTaskDialog } from "./create-task-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AdminTaskManagerProps {
  tasks: ScheduleTask[]
  departments: Department[]
  staffMembers: Profile[]
}

type TaskStatusFilter = "all" | ScheduleTask["status"]

const statusLabels: Record<ScheduleTask["status"], string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
}

export function AdminTaskManager({ tasks, departments, staffMembers }: AdminTaskManagerProps) {
  const router = useRouter()
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

  const todayStart = startOfDay(new Date())

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const dueDateSort = a.due_date.localeCompare(b.due_date)
      if (dueDateSort !== 0) return dueDateSort

      const timeA = a.due_time ?? "23:59:59"
      const timeB = b.due_time ?? "23:59:59"
      return timeA.localeCompare(timeB)
    })
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return sortedTasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false
      if (departmentFilter !== "all" && task.department_id !== departmentFilter) return false
      if (assigneeFilter === "unassigned" && task.assigned_to !== null) return false
      if (assigneeFilter !== "all" && assigneeFilter !== "unassigned" && task.assigned_to !== assigneeFilter) return false

      if (!query) return true

      return (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.assignee?.full_name?.toLowerCase().includes(query) ||
        task.department?.name?.toLowerCase().includes(query) ||
        task.due_date.includes(query)
      )
    })
  }, [assigneeFilter, departmentFilter, searchQuery, sortedTasks, statusFilter])

  const openTasks = tasks.filter((task) => task.status !== "completed").length
  const urgentTasks = tasks.filter((task) => task.priority === "urgent" && task.status !== "completed").length
  const overdueTasks = tasks.filter((task) => task.status !== "completed" && isBefore(parseISO(task.due_date), todayStart)).length
  const completionRate =
    tasks.length > 0 ? Math.round((tasks.filter((task) => task.status === "completed").length / tasks.length) * 100) : 0

  const handleDeleteTask = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const supabase = createClient()
    await supabase.from("schedule_tasks").delete().eq("id", deleteId)
    setIsDeleting(false)
    setDeleteId(null)
    router.refresh()
  }

  const handleStatusChange = async (taskId: string, status: ScheduleTask["status"]) => {
    setUpdatingTaskId(taskId)
    const supabase = createClient()

    const updates: Record<string, unknown> = {
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    }

    await supabase.from("schedule_tasks").update(updates).eq("id", taskId)
    setUpdatingTaskId(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-slate-500/10 via-transparent to-transparent p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <BriefcaseBusiness className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Task Management</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Assign tasks to employees, monitor progress, and keep shift priorities under control.
              </p>
            </div>
          </div>

          <Button className="cursor-pointer" onClick={() => setShowCreateTask(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Assign task
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border bg-background p-4">
            <div>
              <p className="text-xs text-muted-foreground">Total tasks</p>
              <p className="mt-2 text-2xl font-semibold">{tasks.length}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <div>
              <p className="text-xs text-muted-foreground">Open tasks</p>
              <p className="mt-2 text-2xl font-semibold">{openTasks}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <div>
              <p className="text-xs text-muted-foreground">Urgent tasks</p>
              <p className={cn("mt-2 text-2xl font-semibold", urgentTasks > 0 && "text-destructive")}>{urgentTasks}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <div>
              <p className="text-xs text-muted-foreground">Completion rate</p>
              <p className="mt-2 text-2xl font-semibold">{completionRate}%</p>
            </div>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatusFilter)}>
              <TabsList>
                <TabsTrigger className="cursor-pointer" value="all">
                  All
                </TabsTrigger>
                <TabsTrigger className="cursor-pointer" value="pending">
                  Pending
                </TabsTrigger>
                <TabsTrigger className="cursor-pointer" value="in_progress">
                  In progress
                </TabsTrigger>
                <TabsTrigger className="cursor-pointer" value="completed">
                  Completed
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full xl:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
                placeholder="Search by title, assignee, department, date"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="all">
                  All departments
                </SelectItem>
                {departments.map((department) => (
                  <SelectItem className="cursor-pointer" key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="All assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="all">
                  All assignees
                </SelectItem>
                <SelectItem className="cursor-pointer" value="unassigned">
                  Unassigned
                </SelectItem>
                {staffMembers.map((staff) => (
                  <SelectItem className="cursor-pointer" key={staff.id} value={staff.id}>
                    {staff.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed py-14 text-center">
              <p className="text-base font-semibold">No tasks match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting filters or assign a new task.</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredTasks.map((task) => {
                const isOverdue = task.status !== "completed" && isBefore(parseISO(task.due_date), todayStart)

                return (
                  <article
                    key={task.id}
                    className={cn(
                      "rounded-xl border p-4 shadow-sm",
                      task.status === "completed"
                        ? "border-green-200 bg-green-50/70 dark:border-green-900/40 dark:bg-green-950/20"
                        : task.priority === "urgent"
                          ? "border-red-200 bg-red-50/70 dark:border-red-900/40 dark:bg-red-950/20"
                          : "border-border/70 bg-card",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={task.priority === "urgent" ? "destructive" : task.priority === "low" ? "secondary" : "default"}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
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

                    <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <div className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {format(parseISO(task.due_date), "EEE, MMM d, yyyy")}
                        {task.due_time && ` • ${task.due_time.slice(0, 5)}`}
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5" />
                        {task.assignee?.full_name || "Unassigned"}
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                        {task.department?.name || "No department"}
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {task.acknowledged ? "Acknowledged" : "Not acknowledged"}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Select
                        disabled={updatingTaskId === task.id}
                        value={task.status}
                        onValueChange={(value) => handleStatusChange(task.id, value as ScheduleTask["status"])}
                      >
                        <SelectTrigger className="cursor-pointer bg-background sm:flex-1 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem className="cursor-pointer" value="pending">
                            Pending
                          </SelectItem>
                          <SelectItem className="cursor-pointer" value="in_progress">
                            In progress
                          </SelectItem>
                          <SelectItem className="cursor-pointer" value="completed">
                            Completed
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        className="cursor-pointer text-destructive hover:text-destructive sm:w-auto bg-white"
                        onClick={() => setDeleteId(task.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTaskDialog
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        departments={departments}
        staffMembers={staffMembers}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              This task will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer" onClick={handleDeleteTask} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {overdueTasks > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          {overdueTasks} overdue task{overdueTasks > 1 ? "s" : ""} need immediate follow-up.
        </div>
      )}
    </div>
  )
}
