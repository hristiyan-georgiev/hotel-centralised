-- Migration: Restrict note editing/deletion to management only
-- This script:
-- 1. Adds 'manager' role to the system
-- 2. Creates helper function to check if user is management (admin or manager)
-- 3. Updates RLS policies to restrict UPDATE and DELETE of notes to management only

-- 1. Update role constraint to include 'manager'
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'manager', 'staff'));

-- 2. Create helper function to check if user is management
CREATE OR REPLACE FUNCTION public.is_management()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Drop old policies
DROP POLICY IF EXISTS "Users can update own notes" ON public.handover_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.handover_notes;

-- 4. Create new policies that only allow management to edit/delete
CREATE POLICY "Only management can update notes" ON public.handover_notes
  FOR UPDATE TO authenticated USING (is_management());

CREATE POLICY "Only management can delete notes" ON public.handover_notes
  FOR DELETE TO authenticated USING (is_management());
