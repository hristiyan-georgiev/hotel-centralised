"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, UserX, UserCheck, ShieldCheck, Search } from "lucide-react"
import { toast } from "sonner"
import type { Profile, Department } from "@/lib/types"

interface UsersListProps {
  users: Profile[]
  departments: Department[]
}

type FilterType = "all" | "active" | "inactive"

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  )
}

export function UsersList({ users, departments }: UsersListProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>("all")
  const [query, setQuery] = useState("")

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

  const totals = useMemo(() => {
    const active = users.filter((u) => u.is_active).length
    const inactive = users.length - active
    const admins = users.filter((u) => u.role === "admin").length

    return {
      all: users.length,
      active,
      inactive,
      admins,
    }
  }, [users])

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return users.filter((user) => {
      const matchesStatus =
        filter === "all" || (filter === "active" ? user.is_active : !user.is_active)

      if (!matchesStatus) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const searchable = [user.full_name, user.email, user.department?.name || ""]
        .join(" ")
        .toLowerCase()

      return searchable.includes(normalizedQuery)
    })
  }, [users, filter, query])

  if (users.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No users yet. Create your first user account.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="gap-0 py-0">
          <CardContent className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total users</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{totals.all}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardContent className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{totals.active}</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardContent className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Inactive</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{totals.inactive}</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <UserX className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardContent className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Admins</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{totals.admins}</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="gap-0 overflow-hidden py-0">
        <CardContent className="space-y-4 border-b px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className="h-9 cursor-pointer rounded-full px-4"
              >
                All users ({totals.all})
              </Button>
              <Button
                variant={filter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("active")}
                className="h-9 cursor-pointer rounded-full px-4"
              >
                Active ({totals.active})
              </Button>
              <Button
                variant={filter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("inactive")}
                className="h-9 cursor-pointer rounded-full px-4"
              >
                Inactive ({totals.inactive})
              </Button>
            </div>

            <div className="relative w-full lg:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, email, or department"
                className="pl-9"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </CardContent>

        <CardContent className="px-0">
          {filteredUsers.length === 0 ? (
            <div className="py-14 text-center">
              <UserX className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No users match this filter.</p>
              <p className="mt-1 text-sm text-muted-foreground">Try changing the status filter or search term.</p>
            </div>
          ) : (
            <Table className="min-w-[920px]">
              <TableHeader className="bg-muted/35">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6">User</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="pr-6 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const displayName = user.full_name || "Unknown user"

                  return (
                    <TableRow key={user.id} className={!user.is_active ? "bg-muted/20" : ""}>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarFallback
                              className={
                                user.is_active ? "bg-primary/10 font-semibold text-primary" : "font-semibold"
                              }
                            >
                              {getInitials(displayName)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="space-y-0.5">
                            <p className="font-medium text-foreground">{displayName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <Select
                          value={user.department_id || "none"}
                          onValueChange={(value) => updateDepartment(user.id, value)}
                          disabled={updating === user.id}
                        >
                          <SelectTrigger className="h-9 w-[220px] cursor-pointer bg-background">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem className="cursor-pointer" value="none">
                              No department
                            </SelectItem>
                            {departments.map((department) => (
                              <SelectItem className="cursor-pointer" key={department.id} value={department.id}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="py-4">
                        <Select
                          value={user.role}
                          onValueChange={(value) => updateRole(user.id, value as "admin" | "staff")}
                          disabled={updating === user.id}
                        >
                          <SelectTrigger className="h-9 w-[130px] cursor-pointer bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem className="cursor-pointer" value="staff">
                              Staff
                            </SelectItem>
                            <SelectItem className="cursor-pointer" value="admin">
                              Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="py-4 pr-6">
                        <div className="flex items-center justify-end gap-3">
                          <Badge
                            variant={user.is_active ? "secondary" : "outline"}
                            className={
                              user.is_active
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "text-muted-foreground"
                            }
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>

                          <Switch
                            className="cursor-pointer"
                            checked={user.is_active}
                            onCheckedChange={() => toggleActive(user.id, user.is_active)}
                            disabled={updating === user.id}
                          />
                        </div>
                        {updating === user.id && (
                          <p className="mt-1 text-right text-xs text-muted-foreground">Saving changes...</p>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
