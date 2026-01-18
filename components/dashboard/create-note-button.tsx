"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import type { Profile, Category } from "@/lib/types"

interface CreateNoteButtonProps {
  profile: Profile
  categories: Category[]
}

export function CreateNoteButton({ profile, categories }: CreateNoteButtonProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState<"low" | "normal" | "urgent">("normal")
  const [categoryId, setCategoryId] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    setCategoryId(categories[0]?.id || "")
  }, [categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile.department_id) return

    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from("handover_notes").insert({
      author_id: profile.id,
      department_id: profile.department_id,
      category_id: categoryId || null,
      title,
      content,
      priority,
      note_date: new Date().toISOString().split("T")[0],
    })

    setIsLoading(false)

    if (error) {
      toast.error("Failed to create note", {
        description: error.message
      })
    } else {
      toast.success("Note created successfully")
      setOpen(false)
      setTitle("")
      setContent("")
      setPriority("normal")
      setCategoryId("")
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Handover Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Brief summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content">Details</Label>
            <Textarea
              id="content"
              placeholder="Provide full details for the next shift..."
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="low">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#a9a9a9ff" }} />
                    Low</SelectItem>
                  <SelectItem className="cursor-pointer" value="normal">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#00a103ff" }} />
                    Normal</SelectItem>
                  <SelectItem className="cursor-pointer" value="urgent">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#ff0019ff" }} />
                    Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem className="cursor-pointer" key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button className="cursor-pointer" type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="cursor-pointer" type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
