-- Handover note comments
-- Enables threaded follow-up context for note records.

CREATE TABLE IF NOT EXISTS public.handover_note_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.handover_notes(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.handover_note_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated users can view handover note comments" ON public.handover_note_comments;
DROP POLICY IF EXISTS "Authenticated users can create handover note comments" ON public.handover_note_comments;
DROP POLICY IF EXISTS "Authors and admins can delete handover note comments" ON public.handover_note_comments;

CREATE POLICY "All authenticated users can view handover note comments"
  ON public.handover_note_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create handover note comments"
  ON public.handover_note_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete handover note comments"
  ON public.handover_note_comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_handover_note_comments_note_id
  ON public.handover_note_comments(note_id);

CREATE INDEX IF NOT EXISTS idx_handover_note_comments_created_at
  ON public.handover_note_comments(created_at);
