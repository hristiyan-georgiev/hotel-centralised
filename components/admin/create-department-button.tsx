"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Plus } from "lucide-react"
import { toast } from "sonner"

export function CreateDepartmentButton() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.from("departments").insert({
      name,
      description: description || null,
    })

    setIsLoading(false)

    if (error) {
      setError(error.message)
      toast.error("Failed to create department", {
        description: error.message
      })
    } else {
      toast.success("Department created successfully")
      setOpen(false)
      setName("")
      setDescription("")
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          New Department
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Team Structure
            </div>
            <DialogTitle className="text-xl tracking-tight">Create Department</DialogTitle>
            <DialogDescription className="text-sm">
              Add a clear department so team ownership, reporting, and staffing are easy to manage.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="grid gap-2.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Front Office"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-white"
                required
              />
              <p className="text-xs text-muted-foreground">Use a simple, recognizable department name.</p>
            </div>

            <div className="grid gap-2.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe this department's scope and responsibilities"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] resize-none bg-white"
              />
              <p className="text-xs text-muted-foreground">Helpful for larger teams with multiple service areas.</p>
            </div>
          </section>

          {error && <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
            <Button className="cursor-pointer" type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="cursor-pointer" type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Department"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
