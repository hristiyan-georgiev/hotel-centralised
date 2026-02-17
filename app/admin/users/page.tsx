import { createClient } from "@/lib/supabase/server"
import { UsersList } from "@/components/admin/users-list"
import { CreateUserButton } from "@/components/admin/create-user-button"
import { Card, CardContent } from "@/components/ui/card"
import type { Profile, Department } from "@/lib/types"
import { Users } from "lucide-react"

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase.from("profiles").select("*, department:departments(*)").order("full_name")

  const { data: departments } = await supabase.from("departments").select("*").order("name")

  return (
    <div className="space-y-6 p-6">
      <Card className="border-border/70 bg-gradient-to-r from-slate-500/10 via-transparent to-transparent">
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Manage Users</h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Oversee account access, staffing roles, and department assignments from one operational workspace.
              </p>
            </div>
          </div>
          <div>
            <CreateUserButton departments={(departments || []) as Department[]} />
          </div>
        </CardContent>
      </Card>

      <UsersList users={(profiles || []) as Profile[]} departments={(departments || []) as Department[]} />
    </div>
  )
}
