import { createClient } from "@/lib/supabase/server"
import { DepartmentsList } from "@/components/admin/departments-list"
import { CreateDepartmentButton } from "@/components/admin/create-department-button"
import type { Department } from "@/lib/types"

export default async function DepartmentsPage() {
  const supabase = await createClient()

  const { data: departments } = await supabase.from("departments").select("*").order("name")

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
            <p className="text-muted-foreground mt-1">Organize your team by departments</p>
          </div>
          <CreateDepartmentButton />
        </div>
      </div>
      <DepartmentsList departments={(departments || []) as Department[]} />
    </div>
  )
}
