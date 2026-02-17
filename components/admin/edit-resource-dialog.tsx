"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, BookText, FolderTree } from "lucide-react"
import { toast } from "sonner"
import type { Resource } from "@/lib/types"

interface EditResourceDialogProps {
  resource: Resource
  categories: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditResourceDialog({ resource, categories, open, onOpenChange }: EditResourceDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useNewCategory, setUseNewCategory] = useState(!categories.includes(resource.category))
  const [selectedCategory, setSelectedCategory] = useState<string>(resource.category)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const category = useNewCategory ? (formData.get("newCategory") as string) : selectedCategory

    if (!category || !category.trim()) {
      setError("Please select or enter a category")
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from("resources")
      .update({
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
      })
      .eq("id", resource.id)

    if (updateError) {
      setError(updateError.message)
      toast.error("Failed to update resource", {
        description: updateError.message
      })
      setLoading(false)
      return
    }

    toast.success("Resource updated successfully")
    onOpenChange(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
              <BookText className="h-3.5 w-3.5" />
              Resource Library
            </div>
            <DialogTitle className="text-xl tracking-tight">Edit Resource</DialogTitle>
            <DialogDescription className="text-sm">Update the resource details while keeping information current.</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" name="title" defaultValue={resource.title} className="bg-white" required />
            </div>

            <div className="space-y-2">
              <Label className="inline-flex items-center gap-2">
                <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                Category
              </Label>
              {categories.length > 0 && !useNewCategory ? (
                <div className="space-y-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="cursor-pointer w-full bg-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem className="cursor-pointer" key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="link" className="h-auto px-0 cursor-pointer" onClick={() => setUseNewCategory(true)}>
                    Or create new category
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    name="newCategory"
                    defaultValue={resource.category}
                    placeholder="e.g., Front Desk, Policies"
                    className="bg-white"
                    required
                  />
                  {categories.length > 0 && (
                    <Button type="button" variant="link" className="h-auto px-0 cursor-pointer" onClick={() => setUseNewCategory(false)}>
                      Select existing category
                    </Button>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-2 rounded-xl border bg-card p-4">
            <Label htmlFor="edit-content">Content</Label>
            <Textarea id="edit-content" name="content" defaultValue={resource.content} rows={8} className="bg-white" required />
          </section>

          {error && <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
