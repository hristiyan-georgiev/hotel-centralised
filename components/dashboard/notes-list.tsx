"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Trash2, User, Clock, Pencil, AlertTriangle, Calendar, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EditNoteDialog } from "./edit-note-dialog"
import type { HandoverNote, Category } from "@/lib/types"

interface NotesListProps {
  notes: HandoverNote[]
  currentUserId: string
  categories: Category[]
  userRole?: string
}

export function NotesList({ notes, currentUserId, categories, userRole }: NotesListProps) {
  const router = useRouter()
  const [editNote, setEditNote] = useState<HandoverNote | null>(null)
  const [deleteNote, setDeleteNote] = useState<HandoverNote | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteNote) return

    const supabase = createClient()
    const { error } = await supabase.from("handover_notes").delete().eq("id", deleteNote.id)
    
    if (error) {
      toast.error("Failed to delete note", {
        description: error.message
      })
    } else {
      toast.success("Note deleted successfully")
    }
    
    setDeleteNote(null)
    router.refresh()
  }

  const priorityStyles = {
    urgent: "bg-red-500/10 text-red-600 border-red-500/20",
    normal: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    low: "bg-green-500/10 text-green-600 border-green-500/20",
  }

  if (notes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Clock className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-1">No notes for this date</p>
          <p className="text-muted-foreground text-sm">Be the first to add a handover note!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id} className="overflow-hidden hover:border-foreground/20 transition-colors group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-medium text-base text-foreground">{note.title}</h3>
                    {note.priority === "urgent" && (
                      <Badge variant="outline" className={`${priorityStyles[note.priority]} text-xs font-medium`}>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
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
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {note.author?.full_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(note.created_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                {(userRole === 'admin' || userRole === 'manager') && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => setEditNote(note)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => setDeleteNote(note)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{note.content}</p>
            </CardContent>
          </Card>
        ))}
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
              Are you sure you want to delete "{deleteNote?.title}"? This action cannot be undone.
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
