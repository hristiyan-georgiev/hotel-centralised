"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
import { FolderOpen, Plus, Trash2, FolderKanban } from "lucide-react"

interface ManageCategoriesDialogProps {
  categories: string[]
  categoryMap: Record<string, number>
}

export function ManageCategoriesDialog({ categories, categoryMap }: ManageCategoriesDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return

    const trimmedCategory = newCategory.trim()
    
    if (categories.includes(trimmedCategory)) {
      setError("This category already exists")
      return
    }

    setLoading(true)
    setError(null)

    // Create a placeholder resource with this category (will be visible to admins only)
    const supabase = createClient()
    const { error: insertError } = await supabase.from("resources").insert({
      title: `${trimmedCategory} - Category Placeholder`,
      content: `This is a placeholder resource for the "${trimmedCategory}" category. You can delete this once you add actual resources to this category.`,
      category: trimmedCategory,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setNewCategory("")
    setLoading(false)
    router.refresh()
  }

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return
    setDeleting(true)

    const supabase = createClient()
    
    // Delete all resources in this category
    await supabase.from("resources").delete().eq("category", deleteCategory)

    setDeleteCategory(null)
    setDeleting(false)
    router.refresh()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="cursor-pointer" variant="outline">
            <FolderKanban className="h-4 w-4 mr-2" />
            Manage Categories
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>Add or remove resource categories</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-category">Add New Category</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-category"
                    placeholder="e.g., Front Desk, Policies"
                    value={newCategory}
                    onChange={(e) => {
                      setNewCategory(e.target.value)
                      setError(null)
                    }}
                  />
                  <Button className="cursor-pointer" type="submit" disabled={loading || !newCategory.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </form>

            <div className="space-y-3">
              <Label>Existing Categories ({categories.length})</Label>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {categories.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <FolderOpen className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No categories yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  categories.map((category) => (
                    <Card key={category} className="hover:border-primary/50 transition-colors">
                      <CardContent className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FolderOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{category}</p>
                            <p className="text-xs text-muted-foreground">
                              {categoryMap[category]} resource{categoryMap[category] !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteCategory(category)}
                          className="text-destructive hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{deleteCategory}" category? This will delete all{" "}
              {deleteCategory && categoryMap[deleteCategory]} resource
              {deleteCategory && categoryMap[deleteCategory] !== 1 ? "s" : ""} in this category. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {deleting ? "Deleting..." : "Delete Category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
