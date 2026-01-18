import { createClient } from "@/lib/supabase/server"
import { UsersList } from "@/components/admin/users-list"
import { CreateUserButton } from "@/components/admin/create-user-button"
import type { Profile, Department } from "@/lib/types"
import { Users } from "lucide-react"

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase.from("profiles").select("*, department:departments(*)").order("full_name")

  const { data: departments } = await supabase.from("departments").select("*").order("name")

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
            <p className="text-muted-foreground text-sm">Create accounts and assign departments</p>
          </div>
        </div>
        <CreateUserButton departments={(departments || []) as Department[]} />
      </div>

      <UsersList users={(profiles || []) as Profile[]} departments={(departments || []) as Department[]} />
    </div>
  )
}
