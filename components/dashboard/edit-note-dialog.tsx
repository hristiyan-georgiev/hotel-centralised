"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilePenLine, FileText, Loader2, NotebookPen } from "lucide-react"
import { toast } from "sonner"
import type { HandoverNote, Category } from "@/lib/types"

interface EditNoteDialogProps {
  note: HandoverNote
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditNoteDialog({ note, categories, open, onOpenChange }: EditNoteDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: note.title,
    content: note.content,
    priority: note.priority,
    category_id: note.category_id || "",
  })

  useEffect(() => {
    if (open) {
      setFormData({
        title: note.title,
        content: note.content,
        priority: note.priority,
        category_id: note.category_id || "",
      })
      setError(null)
    }
  }, [open, note])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from("handover_notes")
      .update({
        title: formData.title.trim(),
        content: formData.content.trim(),
        priority: formData.priority,
        category_id: formData.category_id || null,
      })
      .eq("id", note.id)

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      toast.error("Failed to update note", {
        description: updateError.message
      })
    } else {
      toast.success("Note updated successfully")
      onOpenChange(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
              <NotebookPen className="h-3.5 w-3.5" />
              Shift Handover
            </div>
            <DialogTitle className="text-xl tracking-tight">Edit Handover Note</DialogTitle>
            <DialogDescription className="text-sm">
              Update the note details so the next shift has the latest and clearest context.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="inline-flex items-center gap-2">
                <FilePenLine className="h-3.5 w-3.5 text-muted-foreground" />
                Title
              </Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content" className="inline-flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Details
              </Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                required
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
                <SelectTrigger className="cursor-pointer w-full bg-white" id="edit-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="low">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#a9a9a9ff" }} />
                    Low
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="normal">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#00a103ff" }} />
                    Normal
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="urgent">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#ff0019ff" }} />
                    Urgent
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger className="cursor-pointer w-full bg-white" id="edit-category">
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
          </section>

          {error && <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button className="cursor-pointer" type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="cursor-pointer" type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
