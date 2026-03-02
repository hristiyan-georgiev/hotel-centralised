-- Ensure deleting a department does not fail when complaints reference it.
-- Existing complaints keep history but lose department linkage.

ALTER TABLE public.complaints
  DROP CONSTRAINT IF EXISTS complaints_department_id_fkey;

ALTER TABLE public.complaints
  ADD CONSTRAINT complaints_department_id_fkey
  FOREIGN KEY (department_id)
  REFERENCES public.departments(id)
  ON DELETE SET NULL;
