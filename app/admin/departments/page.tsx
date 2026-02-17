import { createClient } from "@/lib/supabase/server"
import { DepartmentsList } from "@/components/admin/departments-list"
import { CreateDepartmentButton } from "@/components/admin/create-department-button"
import { Card, CardContent } from "@/components/ui/card"
import type { Department } from "@/lib/types"
import { Building2, ClipboardList, Users } from "lucide-react"

export default async function DepartmentsPage() {
  const supabase = await createClient()

  const { data: departmentsData } = await supabase.from("departments").select("*").order("name")
  const { data: profiles } = await supabase
    .from("profiles")
    .select("department_id")
    .not("department_id", "is", null)

  const departments = (departmentsData || []) as Department[]

  const userCounts = (profiles || []).reduce((acc, profile) => {
    if (profile.department_id) {
      acc[profile.department_id] = (acc[profile.department_id] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const totalAssignedStaff = Object.values(userCounts).reduce((sum, count) => sum + count, 0)
  const unstaffedDepartments = departments.filter((department) => (userCounts[department.id] || 0) === 0).length

  return (
    <div className="space-y-6 p-6">
      <Card className="border-border/70 bg-gradient-to-r from-slate-500/10 via-transparent to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Manage Departments</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Structure your hotel teams with clear departments and keep staffing visibility in one place.
                </p>
              </div>
            </div>

            <CreateDepartmentButton />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Card className="border-border/70 bg-white shadow-none">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Departments</p>
                  <p className="mt-1 text-2xl font-semibold">{departments.length}</p>
                </div>
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-white shadow-none">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned staff</p>
                  <p className="mt-1 text-2xl font-semibold">{totalAssignedStaff}</p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-white shadow-none">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Need staffing</p>
                  <p className="mt-1 text-2xl font-semibold">{unstaffedDepartments}</p>
                </div>
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <DepartmentsList departments={departments} userCounts={userCounts} />
    </div>
  )
}
