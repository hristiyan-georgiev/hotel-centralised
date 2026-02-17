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
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl">
          <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
            <DialogHeader className="space-y-2 text-left">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
                <FolderKanban className="h-3.5 w-3.5" />
                Resource Library
              </div>
              <DialogTitle className="text-xl tracking-tight">Manage Categories</DialogTitle>
              <DialogDescription className="text-sm">
                Create and organize resource categories so policies and procedures stay easy to find.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 p-6">
            <section className="space-y-3 rounded-xl border bg-card p-4">
              <form onSubmit={handleAddCategory} className="space-y-2.5">
                <Label htmlFor="new-category">Add New Category</Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    id="new-category"
                    placeholder="e.g., Front Desk, Policies"
                    value={newCategory}
                    className="h-11 flex-1 bg-white"
                    onChange={(e) => {
                      setNewCategory(e.target.value)
                      setError(null)
                    }}
                  />
                  <Button className="cursor-pointer" type="submit" disabled={loading || !newCategory.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                {error && <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              </form>
            </section>

            <section className="space-y-3 rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <Label>Existing Categories</Label>
                <Badge variant="secondary">{categories.length}</Badge>
              </div>

              <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {categories.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                      <FolderOpen className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">No categories yet</p>
                      <p className="text-xs text-muted-foreground">Create your first category to start organizing resources.</p>
                    </CardContent>
                  </Card>
                ) : (
                  categories.map((category) => (
                    <Card key={category} className="border-border/70 transition-colors hover:border-primary/40">
                      <CardContent className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg border bg-background/90 p-2">
                            <FolderOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium leading-none">{category}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {categoryMap[category]} resource{categoryMap[category] !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteCategory(category)}
                          className="cursor-pointer text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>
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
