"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Search, CheckCircle2, Clock3, User, Pencil, Trash2, AlertTriangle, ListFilter, NotebookText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EditNoteDialog } from "./edit-note-dialog"
import type { HandoverNote, Category } from "@/lib/types"
import { cn } from "@/lib/utils"

interface NotesListProps {
  notes: HandoverNote[]
  currentUserId: string
  categories: Category[]
  selectedDate: string
  userRole?: string
}

type ViewFilter = "all" | "urgent" | "mine"

const priorityStyles = {
  urgent: {
    badge: "bg-red-500/10 text-red-700 border-red-500/25 dark:text-red-300",
    sideBorder: "border-l-red-500/70",
  },
  normal: {
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-300",
    sideBorder: "border-l-amber-500/60",
  },
  low: {
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-300",
    sideBorder: "border-l-emerald-500/60",
  },
}

export function NotesList({ notes, currentUserId, categories, selectedDate, userRole }: NotesListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<ViewFilter>("all")
  const [editNote, setEditNote] = useState<HandoverNote | null>(null)
  const [deleteNote, setDeleteNote] = useState<HandoverNote | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canManage = userRole === "admin" || userRole === "manager"

  const filterNotes = (list: HandoverNote[]) => {
    if (!searchQuery) return list
    const query = searchQuery.toLowerCase()

    return list.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.author?.full_name?.toLowerCase().includes(query) ||
        note.category?.name?.toLowerCase().includes(query),
    )
  }

  const allNotes = filterNotes(notes)
  const urgentNotes = allNotes.filter((n) => n.priority === "urgent")
  const mineNotes = allNotes.filter((n) => n.author_id === currentUserId)
  const visibleNotes =
    activeFilter === "urgent" ? urgentNotes : activeFilter === "mine" ? mineNotes : allNotes

  const myNotesCount = notes.filter((n) => n.author_id === currentUserId).length
  const selectedDateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  })

  const filterOptions = [
    {
      value: "all" as const,
      label: "All notes",
      helper: "Complete handover stream",
      count: allNotes.length,
      icon: NotebookText,
    },
    {
      value: "urgent" as const,
      label: "Urgent only",
      helper: "Needs immediate attention",
      count: urgentNotes.length,
      icon: AlertTriangle,
    },
    {
      value: "mine" as const,
      label: "Written by you",
      helper: "Track your own updates",
      count: mineNotes.length,
      icon: CheckCircle2,
    },
  ]

  const handleDelete = async () => {
    if (!deleteNote) return
    setDeleting(true)

    const supabase = createClient()
    const { error } = await supabase.from("handover_notes").delete().eq("id", deleteNote.id)

    if (error) {
      toast.error("Failed to delete note", { description: error.message })
    } else {
      toast.success("Note deleted successfully")
    }

    setDeleting(false)
    setDeleteNote(null)
    router.refresh()
  }

  const NoteCard = ({ note }: { note: HandoverNote }) => (
    <Card
      className={cn(
        "group border-l-4 border border-border/70 bg-card/90 transition-all hover:border-border hover:shadow-sm",
        priorityStyles[note.priority].sideBorder,
      )}
    >
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold leading-tight text-foreground">{note.title}</h3>
              <Badge variant="outline" className={`text-xs font-medium ${priorityStyles[note.priority].badge}`}>
                {note.priority === "urgent" && <AlertTriangle className="h-3 w-3 mr-1" />}
                {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)}
              </Badge>
              {note.category && (
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${note.category.color}15`,
                    color: note.category.color,
                    borderColor: `${note.category.color}30`,
                  }}
                  className="border text-xs"
                >
                  {note.category.name}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {note.author?.full_name || "Unknown"}
              </span>
              <span className="flex items-center gap-1">
                <Clock3 className="h-3 w-3" />
                {new Date(note.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                {" • "}
                {new Date(note.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {canManage && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit note ${note.title}`}
                className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setEditNote(note)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete note ${note.title}`}
                className="h-8 w-8 text-destructive hover:text-destructive opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setDeleteNote(note)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{note.content}</p>
      </CardContent>
    </Card>
  )

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
        <aside className="space-y-4 xl:sticky xl:top-5 xl:h-fit">
          <Card className="border-border bg-card shadow-none">
            <CardContent className="space-y-4 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search handover notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  <ListFilter className="h-3.5 w-3.5" />
                  View options
                </div>
                <div className="space-y-2">
                  {filterOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setActiveFilter(option.value)}
                        className={cn(
                          "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                          activeFilter === option.value
                            ? "border-border bg-muted"
                            : "border-border/70 bg-background/70 hover:bg-muted/40 cursor-pointer",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.helper}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-6 min-w-6 justify-center px-2 text-xs">
                              {option.count}
                            </Badge>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/70 p-3 text-xs leading-relaxed text-muted-foreground">
                Handovers for <span className="font-medium text-foreground">{selectedDateLabel}</span>.
                <br />
                You created <span className="font-medium text-foreground">{myNotesCount}</span> note
                {myNotesCount !== 1 ? "s" : ""} this day.
              </div>

            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4">
          <Card className="border-border bg-card shadow-none">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Current focus</p>
                <p className="text-lg font-semibold text-foreground">
                  {activeFilter === "urgent" ? "Urgent handover items" : activeFilter === "mine" ? "Your handover notes" : "All handover notes"}
                </p>
              </div>
              <Badge variant="outline" className="px-3 py-1 text-sm">
                {visibleNotes.length} result{visibleNotes.length !== 1 ? "s" : ""}
              </Badge>
            </CardContent>
          </Card>

          {visibleNotes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  {activeFilter === "urgent" ? (
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  ) : (
                    <NotebookText className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <p className="mb-1 text-lg font-medium">
                  {activeFilter === "urgent" ? "No urgent notes" : "No notes found"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term to locate the handover information."
                    : "There are no records for this view on the selected date."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {visibleNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </section>
      </div>

      {editNote && (
        <EditNoteDialog
          note={editNote}
          categories={categories}
          open={!!editNote}
          onOpenChange={(open) => !open && setEditNote(null)}
        />
      )}

      <AlertDialog open={!!deleteNote} onOpenChange={() => setDeleteNote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteNote?.title}&quot;? This action cannot be undone.
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
    </>
  )
}
