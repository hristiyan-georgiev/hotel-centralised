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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>Update the resource details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" name="title" defaultValue={resource.title} required />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            {categories.length > 0 && !useNewCategory ? (
              <div className="space-y-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="cursor-pointer w-full">
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
                <Button type="button" variant="link" className="px-0 h-auto cursor-pointer" onClick={() => setUseNewCategory(true)}>
                  Or create new category
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  name="newCategory"
                  defaultValue={resource.category}
                  placeholder="e.g., Front Desk, Policies"
                  required
                />
                {categories.length > 0 && (
                  <Button type="button" variant="link" className="px-0 h-auto cursor-pointer" onClick={() => setUseNewCategory(false)}>
                    Select existing category
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-content">Content</Label>
            <Textarea id="edit-content" name="content" defaultValue={resource.content} rows={8} required />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
