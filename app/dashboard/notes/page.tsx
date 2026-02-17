import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PencilLine } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { NotesList } from "@/components/dashboard/notes-list"
import { CreateNoteButton } from "@/components/dashboard/create-note-button"
import { DatePicker } from "@/components/dashboard/date-picker"
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

  return (
    <div className="min-h-full bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full space-y-6">
        <Card className="border-border/70 bg-gradient-to-r from-slate-500/10 via-transparent to-transparent">
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <PencilLine className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Handover Notes</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Clean, shift-ready records for teams to pick up where the previous team left off.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <DatePicker selectedDate={selectedDate} />
              {profile.department_id && (
                <CreateNoteButton profile={profile as Profile} categories={(categories || []) as Category[]} />
              )}
            </div>
          </CardContent>
        </Card>

        {!profile.department_id ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">You haven&apos;t been assigned to a department yet. Contact your admin.</p>
            </CardContent>
          </Card>
        ) : (
          <NotesList
            notes={(notes || []) as HandoverNote[]}
            currentUserId={user.id}
            categories={(categories || []) as Category[]}
            selectedDate={selectedDate}
            userRole={profile.role}
          />
        )}
      </div>
    </div>
  )
}
