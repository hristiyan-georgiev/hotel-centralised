"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Trash2, Building2, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Department } from "@/lib/types"

interface DepartmentsListProps {
  departments: Department[]
}

export function DepartmentsList({ departments }: DepartmentsListProps) {
  const router = useRouter()
  const [userCounts, setUserCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [deleteDepartment, setDeleteDepartment] = useState<Department | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load user counts for each department
  useState(() => {
    const loadUserCounts = async () => {
      const supabase = createClient()
      const { data: profiles } = await supabase
        .from("profiles")
        .select("department_id")
        .not("department_id", "is", null)

      const counts: Record<string, number> = {}
      profiles?.forEach((profile) => {
        if (profile.department_id) {
          counts[profile.department_id] = (counts[profile.department_id] || 0) + 1
        }
      })
      setUserCounts(counts)
      setLoading(false)
    }
    loadUserCounts()
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
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No departments yet</h3>
          <p className="text-muted-foreground">Create your first department to organise your team</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {departments.map((dept) => {
        const userCount = userCounts[dept.id] || 0
        
        return (
          <Card 
            key={dept.id} 
            className="hover:shadow-md transition-shadow group"
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate">{dept.name}</h3>
                    {dept.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {dept.description}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive -mt-1 cursor-pointer"
                  onClick={() => handleDeleteClick(dept)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {loading ? "..." : userCount === 0 ? "No staff" : `${userCount} staff member${userCount !== 1 ? 's' : ''}`}
                </span>
                {userCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {userCount}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
      
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
    </div>
  )
}
