-- 1. Helper functions to bypass RLS for context retrieval
create or replace function public.get_my_family_id()
returns uuid
language sql
security definer
stable
as $$
  select family_id from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_role()
returns public.user_role
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 2. Add created_by to families to allow visibility during signup
alter table public.families add column if not exists created_by uuid references auth.users(id);

-- 3. Update Families Policies
drop policy "Users can view their own family" on public.families;
create policy "View own family"
  on public.families for select
  using (
    id = public.get_my_family_id()
    OR
    created_by = auth.uid()
  );

drop policy "Admins can update their family" on public.families;
create policy "Admins can update their family"
  on public.families for update
  using (
    id = public.get_my_family_id() 
    and 
    public.get_my_role() = 'admin_parent'
  );

-- 4. Update Profiles Policies (Fixing the Infinite Recursion)
drop policy "View profiles in same family" on public.profiles;
create policy "View profiles in same family"
  on public.profiles for select
  using (
    family_id = public.get_my_family_id()
  );

drop policy "Admins can update family profiles" on public.profiles;
create policy "Admins can update family profiles"
  on public.profiles for update
  using (
    family_id = public.get_my_family_id()
    and
    public.get_my_role() = 'admin_parent'
  );

-- 5. Update Tasks Policies (Optimized)
drop policy "View tasks policy" on public.tasks;
create policy "View tasks policy"
  on public.tasks for select
  using (
    (
      family_id = public.get_my_family_id() 
      AND 
      public.get_my_role() in ('admin_parent', 'parent')
    )
    OR 
    assigned_to = auth.uid()
  );

drop policy "Parents can create tasks" on public.tasks;
create policy "Parents can create tasks"
  on public.tasks for insert
  with check (
    family_id = public.get_my_family_id()
    AND
    public.get_my_role() in ('admin_parent', 'parent')
  );

drop policy "Parents can update tasks" on public.tasks;
create policy "Parents can update tasks"
  on public.tasks for update
  using (
    family_id = public.get_my_family_id()
    AND
    public.get_my_role() in ('admin_parent', 'parent')
  );

drop policy "Parents can delete tasks" on public.tasks;
create policy "Parents can delete tasks" 
  on public.tasks for delete
  using (
    family_id = public.get_my_family_id()
    AND
    public.get_my_role() in ('admin_parent', 'parent')
  );

-- 6. Update Rewards Store Policies
drop policy "View rewards in same family" on public.rewards_store;
create policy "View rewards in same family"
  on public.rewards_store for select
  using (
    family_id = public.get_my_family_id()
  );

drop policy "Parents manage rewards" on public.rewards_store;
create policy "Parents manage rewards"
  on public.rewards_store for all
  using (
    family_id = public.get_my_family_id()
    AND
    public.get_my_role() in ('admin_parent', 'parent')
  );

-- 7. Update Rewards Redemption Policies
drop policy "View redemptions in family" on public.rewards_redemptions;
create policy "View redemptions in family"
  on public.rewards_redemptions for select
  using (
    family_id = public.get_my_family_id()
  );
