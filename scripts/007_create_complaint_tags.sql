-- Complaint tags table
create table public.complaint_tags (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  color text not null default '#6b7280',
  created_at timestamptz default now()
);

-- Complaint tag mappings (many-to-many)
create table public.complaint_tag_mappings (
  id uuid default gen_random_uuid() primary key,
  complaint_id uuid references public.complaints(id) on delete cascade,
  tag_id uuid references public.complaint_tags(id) on delete cascade,
  created_at timestamptz default now(),
  unique(complaint_id, tag_id)
);

-- Insert default tags
insert into public.complaint_tags (name, color) values
  ('Maintenance Issue', '#ef4444'),
  ('Price', '#f59e0b'),
  ('Staff', '#3b82f6'),
  ('Cleanliness', '#8b5cf6'),
  ('Noise', '#ec4899'),
  ('Service', '#10b981'),
  ('Food & Beverage', '#f97316'),
  ('Amenities', '#06b6d4');

-- Enable RLS
alter table public.complaint_tags enable row level security;
alter table public.complaint_tag_mappings enable row level security;

-- RLS policies for complaint_tags
create policy "All authenticated users can view tags"
  on public.complaint_tags for select
  to authenticated
  using (true);

create policy "Admins can manage tags"
  on public.complaint_tags for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS policies for complaint_tag_mappings
create policy "All authenticated users can view tag mappings"
  on public.complaint_tag_mappings for select
  to authenticated
  using (true);

create policy "Authenticated users can create tag mappings"
  on public.complaint_tag_mappings for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete tag mappings"
  on public.complaint_tag_mappings for delete
  to authenticated
  using (true);

-- Create indexes for better performance
create index idx_complaint_tag_mappings_complaint_id on public.complaint_tag_mappings(complaint_id);
create index idx_complaint_tag_mappings_tag_id on public.complaint_tag_mappings(tag_id);
