-- Issues tracking system
create table public.issues (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'urgent')),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Issue comments table
create table public.issue_comments (
  id uuid default gen_random_uuid() primary key,
  issue_id uuid references public.issues(id) on delete cascade,
  author_id uuid references public.profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.issues enable row level security;
alter table public.issue_comments enable row level security;

-- RLS policies for issues
create policy "All authenticated users can view issues"
  on public.issues for select
  to authenticated
  using (true);

create policy "Authenticated users can create issues"
  on public.issues for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated users can update issues"
  on public.issues for update
  to authenticated
  using (true);

create policy "Admins can delete issues"
  on public.issues for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS policies for issue comments
create policy "All authenticated users can view issue comments"
  on public.issue_comments for select
  to authenticated
  using (true);

create policy "Authenticated users can create issue comments"
  on public.issue_comments for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Users can delete their own issue comments"
  on public.issue_comments for delete
  to authenticated
  using (
    auth.uid() = author_id or 
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Indexes for performance
create index issues_status_idx on public.issues(status);
create index issues_created_by_idx on public.issues(created_by);
create index issue_comments_issue_id_idx on public.issue_comments(issue_id);
