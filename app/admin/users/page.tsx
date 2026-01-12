import { createClient } from "@/lib/supabase/server"
import { UsersList } from "@/components/admin/users-list"
import { CreateUserButton } from "@/components/admin/create-user-button"
import type { Profile, Department } from "@/lib/types"

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase.from("profiles").select("*, department:departments(*)").order("full_name")

  const { data: departments } = await supabase.from("departments").select("*").order("name")

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
          <p className="text-muted-foreground">Create accounts and assign departments</p>
        </div>
        <CreateUserButton departments={(departments || []) as Department[]} />
      </div>

      <UsersList users={(profiles || []) as Profile[]} departments={(departments || []) as Department[]} />
    </div>
  )
}
