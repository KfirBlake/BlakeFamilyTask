-- Migration: Create Master Task Bank and link to Tasks
-- Migration Version: 20261010000000

-- 1. Create master_task_bank table
create table if not exists public.master_task_bank (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  default_stars integer default 5 not null check (default_stars >= 1),
  icon_key text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.master_task_bank enable row level security;

-- 3. RLS Policies for master_task_bank
drop policy if exists "View master task bank in family" on public.master_task_bank;
create policy "View master task bank in family"
  on public.master_task_bank for select
  using (
    family_id = public.get_my_family_id()
  );

drop policy if exists "Parents insert master task bank" on public.master_task_bank;
create policy "Parents insert master task bank"
  on public.master_task_bank for insert
  with check (
    family_id = public.get_my_family_id()
    and
    public.get_my_role() in ('admin_parent', 'parent')
  );

drop policy if exists "Parents update master task bank" on public.master_task_bank;
create policy "Parents update master task bank"
  on public.master_task_bank for update
  using (
    family_id = public.get_my_family_id()
    and
    public.get_my_role() in ('admin_parent', 'parent')
  )
  with check (
    family_id = public.get_my_family_id()
    and
    public.get_my_role() in ('admin_parent', 'parent')
  );

drop policy if exists "Parents delete master task bank" on public.master_task_bank;
create policy "Parents delete master task bank"
  on public.master_task_bank for delete
  using (
    family_id = public.get_my_family_id()
    and
    public.get_my_role() in ('admin_parent', 'parent')
  );

-- 4. Add master_task_id column to tasks table
alter table public.tasks
  add column if not exists master_task_id uuid references public.master_task_bank(id) on delete set null;

-- 5. Create partial unique index on tasks for batch deduplication
create unique index if not exists idx_tasks_master_child_date
  on public.tasks (master_task_id, assigned_to, due_date)
  where master_task_id is not null;
