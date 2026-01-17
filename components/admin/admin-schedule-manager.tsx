"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, Users, Briefcase, Plus, Wand2 } from "lucide-react"
import type { Profile, Department, Shift, ScheduleEvent, ScheduleTask } from "@/lib/types"
import { AdminShiftsList } from "./admin-shifts-list"
import { AdminEventsList } from "./admin-events-list"
import { AdminTasksList } from "./admin-tasks-list"
import { CreateShiftDialog } from "./create-shift-dialog"
import { CreateEventDialog } from "./create-event-dialog"
import { CreateTaskDialog } from "./create-task-dialog"
import { AutoScheduleGenerator } from "./auto-schedule-generator"

interface AdminScheduleManagerProps {
  shifts: Shift[]
  events: ScheduleEvent[]
  tasks: ScheduleTask[]
  departments: Department[]
  staffMembers: Profile[]
}

export function AdminScheduleManager({ shifts, events, tasks, departments, staffMembers }: AdminScheduleManagerProps) {
  const [activeTab, setActiveTab] = useState("shifts")
  const [showCreateShift, setShowCreateShift] = useState(false)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showAutoSchedule, setShowAutoSchedule] = useState(false)

  const upcomingShifts = shifts.filter((s) => new Date(s.shift_date) >= new Date()).length
  const upcomingEvents = events.filter((e) => new Date(e.event_date) >= new Date()).length
  const pendingTasks = tasks.filter((t) => t.status !== "completed").length

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingShifts}</p>
                <p className="text-sm text-muted-foreground">Upcoming shifts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingEvents}</p>
                <p className="text-sm text-muted-foreground">Upcoming events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                <Briefcase className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingTasks}</p>
                <p className="text-sm text-muted-foreground">Pending tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="shifts" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Shifts</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 w-full sm:w-auto">
            {activeTab === "shifts" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowAutoSchedule(true)}
                  className="flex-1 sm:flex-none bg-transparent"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Auto-Generate Rota
                </Button>
                <Button onClick={() => setShowCreateShift(true)} className="flex-1 sm:flex-none">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shift
                </Button>
              </>
            )}
            {activeTab === "events" && (
              <Button onClick={() => setShowCreateEvent(true)} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            )}
            {activeTab === "tasks" && (
              <Button onClick={() => setShowCreateTask(true)} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="shifts">
          <AdminShiftsList shifts={shifts} departments={departments} staffMembers={staffMembers} />
        </TabsContent>
        <TabsContent value="events">
          <AdminEventsList events={events} departments={departments} />
        </TabsContent>
        <TabsContent value="tasks">
          <AdminTasksList tasks={tasks} departments={departments} staffMembers={staffMembers} />
        </TabsContent>
      </Tabs>

      {/* Create Dialogs */}
      <CreateShiftDialog
        open={showCreateShift}
        onClose={() => setShowCreateShift(false)}
        departments={departments}
        staffMembers={staffMembers}
      />
      <CreateEventDialog open={showCreateEvent} onClose={() => setShowCreateEvent(false)} departments={departments} />
      <CreateTaskDialog
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        departments={departments}
        staffMembers={staffMembers}
      />
      <AutoScheduleGenerator
        open={showAutoSchedule}
        onClose={() => setShowAutoSchedule(false)}
        departments={departments}
        staffMembers={staffMembers}
      />
    </div>
  )
}
