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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CreateResourceDialogProps {
  categories: string[]
}

export function CreateResourceDialog({ categories }: CreateResourceDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useNewCategory, setUseNewCategory] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")

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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: insertError } = await supabase.from("resources").insert({
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      created_by: user?.id,
    })

    if (insertError) {
      setError(insertError.message)
      toast.error("Failed to create resource", {
        description: insertError.message
      })
      setLoading(false)
      return
    }

    toast.success("Resource created successfully")
    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Resource</DialogTitle>
          <DialogDescription>Add a new procedure, policy, or reference document.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g., Check-In Procedure" required />
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
                <Input name="newCategory" placeholder="e.g., Front Desk, Policies, Emergency" required />
                {categories.length > 0 && (
                  <Button type="button" variant="link" className="px-0 h-auto cursor-pointer" onClick={() => setUseNewCategory(false)}>
                    Select existing category
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Enter the resource content, procedures, or instructions..."
              rows={8}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Resource
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
