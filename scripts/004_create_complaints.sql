-- Complaints table
create table public.complaints (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  guest_name text,
  room_number text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'urgent')),
  created_by uuid references public.profiles(id),
  assigned_to uuid references public.profiles(id),
  department_id uuid references public.departments(id),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Complaint comments table
create table public.complaint_comments (
  id uuid default gen_random_uuid() primary key,
  complaint_id uuid references public.complaints(id) on delete cascade,
  author_id uuid references public.profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.complaints enable row level security;
alter table public.complaint_comments enable row level security;

-- RLS policies for complaints
create policy "All authenticated users can view complaints"
  on public.complaints for select
  to authenticated
  using (true);

create policy "Authenticated users can create complaints"
  on public.complaints for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated users can update complaints"
  on public.complaints for update
  to authenticated
  using (true);

create policy "Admins can delete complaints"
  on public.complaints for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS policies for comments
create policy "All authenticated users can view comments"
  on public.complaint_comments for select
  to authenticated
  using (true);

create policy "Authenticated users can create comments"
  on public.complaint_comments for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Authors can update their comments"
  on public.complaint_comments for update
  to authenticated
  using (auth.uid() = author_id);

create policy "Authors and admins can delete comments"
  on public.complaint_comments for delete
  to authenticated
  using (
    auth.uid() = author_id or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Indexes for performance
create index complaints_status_idx on public.complaints(status);
create index complaints_created_by_idx on public.complaints(created_by);
create index complaints_department_id_idx on public.complaints(department_id);
create index complaint_comments_complaint_id_idx on public.complaint_comments(complaint_id);
