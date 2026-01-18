"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Users, Building2, UserX, UserCheck } from "lucide-react"
import { toast } from "sonner"
import type { Profile, Department } from "@/lib/types"

interface UsersListProps {
  users: Profile[]
  departments: Department[]
}

type FilterType = "all" | "active" | "inactive"

export function UsersList({ users, departments }: UsersListProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>("all")

  const updateDepartment = async (userId: string, departmentId: string) => {
    setUpdating(userId)
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({ department_id: departmentId === "none" ? null : departmentId })
      .eq("id", userId)
    
    if (error) {
      toast.error("Failed to update department", {
        description: error.message
      })
    } else {
      toast.success("Department updated")
    }
    
    setUpdating(null)
    router.refresh()
  }

  const updateRole = async (userId: string, role: "admin" | "staff") => {
    setUpdating(userId)
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)
    
    if (error) {
      toast.error("Failed to update role", {
        description: error.message
      })
    } else {
      toast.success("Role updated")
    }
    
    setUpdating(null)
    router.refresh()
  }

  const toggleActive = async (userId: string, currentStatus: boolean) => {
    setUpdating(userId)
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({ is_active: !currentStatus }).eq("id", userId)
    
    if (error) {
      toast.error("Failed to update status", {
        description: error.message
      })
    } else {
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`)
    }
    
    setUpdating(null)
    router.refresh()
  }

  // Filter users based on selected filter
  const filteredUsers = users.filter((user) => {
    if (filter === "active") return user.is_active
    if (filter === "inactive") return !user.is_active
    return true // "all"
  })

  // Calculate counts
  const activeCount = users.filter((u) => u.is_active).length
  const inactiveCount = users.filter((u) => !u.is_active).length

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No users yet. Create your first user account.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
          className="gap-2 cursor-pointer"
        >
          <Users className="h-4 w-4" />
          All
          <Badge variant={filter === "all" ? "secondary" : "outline"} className="ml-1">
            {users.length}
          </Badge>
        </Button>
        <Button
          variant={filter === "active" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("active")}
          className="gap-2 cursor-pointer"
        >
          <UserCheck className="h-4 w-4" />
          Active
          <Badge variant={filter === "active" ? "secondary" : "outline"} className="ml-1">
            {activeCount}
          </Badge>
        </Button>
        <Button
          variant={filter === "inactive" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("inactive")}
          className="gap-2 cursor-pointer"
        >
          <UserX className="h-4 w-4" />
          Inactive
          <Badge variant={filter === "inactive" ? "secondary" : "outline"} className="ml-1">
            {inactiveCount}
          </Badge>
        </Button>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No {filter === "all" ? "" : filter} users found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
          <Card key={user.id} className={!user.is_active ? "opacity-60 border-muted" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full font-medium ${
                    user.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {user.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.full_name}</h3>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge>
                      {!user.is_active && (
                        <Badge variant="outline" className="text-muted-foreground">
                          <UserX className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={user.department_id || "none"}
                      onValueChange={(v) => updateDepartment(user.id, v)}
                      disabled={updating === user.id}
                    >
                      <SelectTrigger className="w-[180px] cursor-pointer">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value="none">No department</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem className="cursor-pointer" key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select
                    value={user.role}
                    onValueChange={(v) => updateRole(user.id, v as "admin" | "staff")}
                    disabled={updating === user.id}
                  >
                    <SelectTrigger className="w-[120px] cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem className="cursor-pointer" value="staff">Staff</SelectItem>
                      <SelectItem className="cursor-pointer" value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <Switch
                      className="cursor-pointer"
                      checked={user.is_active}
                      onCheckedChange={() => toggleActive(user.id, user.is_active)}
                      disabled={updating === user.id}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}
    </>
  )
}
