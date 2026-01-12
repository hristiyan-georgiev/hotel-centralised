import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { NotesList } from "@/components/dashboard/notes-list"
import { CreateNoteButton } from "@/components/dashboard/create-note-button"
import { DatePicker } from "@/components/dashboard/date-picker"
import { ClipboardList, AlertCircle, TrendingUp } from "lucide-react"
import type { HandoverNote, Profile, Category } from "@/lib/types"

interface NotesPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, department:departments(*)")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  const selectedDate = params.date || new Date().toISOString().split("T")[0]

  const { data: notes } = await supabase
    .from("handover_notes")
    .select("*, author:profiles(*), category:categories(*), department:departments(*)")
    .eq("note_date", selectedDate)
    .order("created_at", { ascending: false })

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  // Calculate stats
  const totalNotes = notes?.length || 0
  const urgentNotes = notes?.filter((n) => n.priority === "urgent").length || 0
  const myNotes = notes?.filter((n) => n.author_id === user.id).length || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Handover Notes</h1>
          <p className="text-muted-foreground mt-1">Browse and manage daily handover notes</p>
        </div>
        {profile.department_id && (
          <CreateNoteButton profile={profile as Profile} categories={(categories || []) as Category[]} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-600">{totalNotes}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Total Notes</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <ClipboardList className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-red-600">{urgentNotes}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Urgent Priority</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{myNotes}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">My Notes</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DatePicker selectedDate={selectedDate} />

      {!profile.department_id ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You haven't been assigned to a department yet. Contact your admin.</p>
          </CardContent>
        </Card>
      ) : (
        <NotesList 
          notes={(notes || []) as HandoverNote[]} 
          currentUserId={user.id}
          categories={(categories || []) as Category[]}
        />
      )}
    </div>
  )
}
