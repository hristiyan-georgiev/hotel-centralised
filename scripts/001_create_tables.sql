-- 1. CLEANUP (Optional but recommended to ensure a fresh start)
-- We drop existing policies to avoid conflicts when re-running the script
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view notes from their department" ON public.handover_notes;
DROP POLICY IF EXISTS "Users can create notes for their department" ON public.handover_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.handover_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.handover_notes;
DROP POLICY IF EXISTS "Admins can manage all notes" ON public.handover_notes;

-- 2. CREATE HELPER FUNCTIONS
-- This function bypasses RLS to check roles, preventing infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- This helper gets the current user's department ID without triggering RLS loops
CREATE OR REPLACE FUNCTION public.get_my_department()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT department_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. TABLES (Kept as per your original schema)
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.handover_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_notes ENABLE ROW LEVEL SECURITY;

-- 5. UPDATED POLICIES (Recursion-Free)

-- Departments
CREATE POLICY "Anyone can view departments" ON public.departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage departments" ON public.departments
  FOR ALL TO authenticated USING (is_admin());

-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated USING (is_admin());

-- Categories
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL TO authenticated USING (is_admin());

-- Handover Notes
CREATE POLICY "Users can view notes from their department" ON public.handover_notes
  FOR SELECT TO authenticated USING (
    department_id = get_my_department() OR is_admin()
  );

CREATE POLICY "Users can create notes for their department" ON public.handover_notes
  FOR INSERT TO authenticated WITH CHECK (
    author_id = auth.uid() AND (department_id = get_my_department() OR is_admin())
  );

CREATE POLICY "Users can update own notes" ON public.handover_notes
  FOR UPDATE TO authenticated USING (author_id = auth.uid() OR is_admin());

CREATE POLICY "Users can delete own notes" ON public.handover_notes
  FOR DELETE TO authenticated USING (author_id = auth.uid() OR is_admin());

-- 6. DATA SEEDING
INSERT INTO public.categories (name, color) VALUES
  ('Guest Issue', '#ef4444'),
  ('Maintenance', '#f59e0b'),
  ('VIP', '#8b5cf6'),
  ('General', '#6b7280'),
  ('Housekeeping', '#10b981'),
  ('Restaurant', '#3b82f6')
ON CONFLICT (name) DO NOTHING;
