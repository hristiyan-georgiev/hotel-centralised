"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowRight, Clock, User } from "lucide-react"
import type { HandoverNote } from "@/lib/types"

interface UrgentNotesCardProps {
  notes: HandoverNote[]
}

export function UrgentNotesCard({ notes }: UrgentNotesCardProps) {
  const urgentNotes = notes.filter((n) => n.priority === "urgent").slice(0, 3)

  return (
    <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <CardTitle className="text-lg font-semibold">Urgent Notes</CardTitle>
          </div>
          <Badge variant="destructive" className="font-semibold">
            {urgentNotes.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {urgentNotes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No urgent notes today</p>
          </div>
        ) : (
          <>
            {urgentNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-lg bg-background border border-red-500/20 hover:border-red-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm line-clamp-1">{note.title}</h4>
                  {note.category && (
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: `${note.category.color}15`,
                        color: note.category.color,
                        borderColor: `${note.category.color}30`,
                      }}
                      className="text-xs shrink-0"
                    >
                      {note.category.name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{note.content}</p>
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
            ))}
            <Link href="/dashboard/notes">
              <Button variant="ghost" className="w-full mt-2 gap-2 cursor-pointer">
                View all notes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}
