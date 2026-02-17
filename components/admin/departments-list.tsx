"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
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
import { Building2, ShieldAlert, Trash2, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Department } from "@/lib/types"

interface DepartmentsListProps {
  departments: Department[]
  userCounts: Record<string, number>
}

type DepartmentFilter = "all" | "staffed" | "unstaffed"

export function DepartmentsList({ departments, userCounts }: DepartmentsListProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<DepartmentFilter>("all")
  const [deleteDepartment, setDeleteDepartment] = useState<Department | null>(null)
  const [deleting, setDeleting] = useState(false)

  const staffedDepartments = departments.filter((department) => (userCounts[department.id] || 0) > 0).length
  const unstaffedDepartments = departments.length - staffedDepartments
  const filteredDepartments = departments.filter((department) => {
    const userCount = userCounts[department.id] || 0
    if (filter === "staffed") return userCount > 0
    if (filter === "unstaffed") return userCount === 0
    return true
  })

  const handleDeleteClick = (dept: Department) => {
    const userCount = userCounts[dept.id] || 0
    
    if (userCount > 0) {
      toast.error("Cannot delete department", {
        description: `${userCount} user(s) are assigned to it. Please reassign them first.`
      })
      return
    }

    setDeleteDepartment(dept)
  }

  const handleDelete = async () => {
    if (!deleteDepartment) return
    setDeleting(true)

    const supabase = createClient()
    const { error } = await supabase.from("departments").delete().eq("id", deleteDepartment.id)
    
    if (error) {
      toast.error("Failed to delete department", {
        description: error.message
      })
    } else {
      toast.success("Department deleted successfully")
    }
    
    setDeleteDepartment(null)
    setDeleting(false)
    router.refresh()
  }

  if (departments.length === 0) {
    return (
      <Card className="border-dashed border-border/80 bg-card/50">
        <CardContent className="py-10">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>No departments yet</EmptyTitle>
              <EmptyDescription>Create your first department to organize your operation structure.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Department directory</h2>
          <p className="text-sm text-muted-foreground">
            {staffedDepartments} staffed, {unstaffedDepartments} awaiting team assignment
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-xl border border-border/70 bg-background/80 p-1">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "ghost"}
            className="cursor-pointer"
            onClick={() => setFilter("all")}
          >
            All
            <Badge variant="secondary" className="ml-2">
              {departments.length}
            </Badge>
          </Button>
          <Button
            size="sm"
            variant={filter === "staffed" ? "default" : "ghost"}
            className="cursor-pointer"
            onClick={() => setFilter("staffed")}
          >
            Staffed
            <Badge variant="secondary" className="ml-2">
              {staffedDepartments}
            </Badge>
          </Button>
          <Button
            size="sm"
            variant={filter === "unstaffed" ? "default" : "ghost"}
            className="cursor-pointer"
            onClick={() => setFilter("unstaffed")}
          >
            Needs staffing
            <Badge variant="secondary" className="ml-2">
              {unstaffedDepartments}
            </Badge>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 bg-card/90">
        <CardContent className="p-0">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_180px_160px_60px] items-center gap-4 border-b bg-muted/30 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
            <span>Department</span>
            <span>Team size</span>
            <span>Status</span>
            <span className="text-right">&nbsp;</span>
          </div>

          {filteredDepartments.length === 0 ? (
            <Empty className="rounded-none border-0 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldAlert className="h-5 w-5" />
                </EmptyMedia>
                <EmptyTitle>No matching departments</EmptyTitle>
                <EmptyDescription>Try another filter to view department records.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button className="cursor-pointer" variant="outline" onClick={() => setFilter("all")}>Show all departments</Button>
              </EmptyContent>
            </Empty>
          ) : (
            filteredDepartments.map((dept) => {
              const userCount = userCounts[dept.id] || 0

              return (
                <div
                  key={dept.id}
                  className="grid gap-3 border-b border-border/70 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.5fr)_180px_160px_60px] md:items-center md:gap-4 md:px-5"
                >
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{dept.name}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {dept.description || "No description provided."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {userCount === 0 ? "No staff assigned" : `${userCount} staff member${userCount > 1 ? "s" : ""}`}
                    </span>
                  </div>

                  <div>
                    <Badge className={cn(userCount === 0 ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : "")} variant={userCount === 0 ? "secondary" : "outline"}>
                      {userCount === 0 ? "Needs staffing" : "Staffed"}
                    </Badge>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteClick(dept)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteDepartment} onOpenChange={() => setDeleteDepartment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDepartment?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
