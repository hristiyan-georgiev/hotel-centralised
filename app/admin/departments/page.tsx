import { createClient } from "@/lib/supabase/server"
import { DepartmentsList } from "@/components/admin/departments-list"
import { CreateDepartmentButton } from "@/components/admin/create-department-button"
import type { Department } from "@/lib/types"
import { Building2 } from "lucide-react"

export default async function DepartmentsPage() {
  const supabase = await createClient()

  const { data: departments } = await supabase.from("departments").select("*").order("name")

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
              <p className="text-muted-foreground text-sm">Organise your team by departments</p>
            </div>
          </div>
          <CreateDepartmentButton />
        </div>
      </div>
      <DepartmentsList departments={(departments || []) as Department[]} />
    </div>
  )
}
