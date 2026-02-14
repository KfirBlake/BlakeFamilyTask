-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Create tables

-- Families
create table public.families (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles
create type public.user_role as enum ('admin_parent', 'parent', 'child');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid references public.families(id) on delete restrict, -- Strict link to family
  full_name text not null,
  display_name text,
  role user_role not null default 'child',
  email text,
  phone text,
  avatar_url text,
  age int,
  stars_balance int default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks
create type public.task_status as enum ('pending', 'waiting_approval', 'approved');

create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  icon_key text,
  due_date date,
  status task_status default 'pending' not null,
  completed_at timestamp with time zone,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamp with time zone,
  stars_value int default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Rewards Store
create table public.rewards_store (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  name text not null,
  description text,
  icon_key text,
  price int default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Rewards Redemptions
create table public.rewards_redemptions (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null, -- The child who redeemed
  assigned_to uuid references public.profiles(id) on delete set null, -- Optional if needed? Usually same as created_by
  reward_id uuid references public.rewards_store(id) on delete set null,
  rewarded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.rewards_store enable row level security;
alter table public.rewards_redemptions enable row level security;

-- 3. RLS Policies

-- Helper function to get current user's family_id
-- NOTE: Using a recursive policy or a function can be tricky.
-- For simplicity and performance, we join with profiles check.

-- Families:
-- Anyone can create a family (on signup).
create policy "Anyone can create a family"
  on public.families for insert
  with check (true);

-- Users can view their own family.
create policy "Users can view their own family"
  on public.families for select
  using (
    id in (
      select family_id from public.profiles where id = auth.uid()
    )
  );
-- Admin parents can update their family.
create policy "Admins can update their family"
  on public.families for update
  using (
      id in (
          select family_id from public.profiles
          where id = auth.uid() and role = 'admin_parent'
      )
  );

-- Profiles:
-- Users can view profiles in their family.
create policy "View profiles in same family"
  on public.profiles for select
  using (
    family_id in (
      select family_id from public.profiles where id = auth.uid()
    )
  );

-- Users can insert their own profile (during signup flow).
-- But they need to be able to set family_id.
create policy "Insert own profile"
  on public.profiles for insert
  with check (
    auth.uid() = id
  );

-- Users can update their own profile.
create policy "Update own profile"
  on public.profiles for update
  using ( auth.uid() = id );
  
-- Admins can update profiles in their family.
create policy "Admins can update family profiles"
  on public.profiles for update
  using (
    family_id in (
      select family_id from public.profiles where id = auth.uid() and role = 'admin_parent'
    )
  );

-- Tasks:
-- View tasks: Parents and Admin Parents can view all tasks in their family. Children can view their own tasks.
create policy "View tasks policy" 
  on public.tasks for select
  using (
    family_id in (
      select family_id from public.profiles 
      where id = auth.uid() and role in ('admin_parent', 'parent')
    )
    OR 
    assigned_to = auth.uid()
  );

-- Create tasks: Parents and Admin Parents.
create policy "Parents can create tasks"
  on public.tasks for insert
  with check (
    family_id in (
      select family_id from public.profiles 
      where id = auth.uid() and role in ('admin_parent', 'parent')
    )
  );

-- Update tasks:
-- Parents can update any task in family.
-- Children can request approval (change status to waiting_approval).
create policy "Parents can update tasks"
  on public.tasks for update
  using (
    family_id in (
      select family_id from public.profiles 
      where id = auth.uid() and role in ('admin_parent', 'parent')
    )
  );

create policy "Children can request approval" 
  on public.tasks for update
  using ( 
    assigned_to = auth.uid() 
    AND status = 'pending' 
  )
  with check (
    status = 'waiting_approval'
  );

create policy "Parents can delete tasks" 
  on public.tasks for delete
  using (
    family_id in (select family_id from public.profiles where id = auth.uid() and role in ('admin_parent', 'parent'))
  );

-- Rewards Store:
-- View items in same family.
create policy "View rewards in same family"
  on public.rewards_store for select
  using (
    family_id in (
      select family_id from public.profiles where id = auth.uid()
    )
  );

-- Manage rewards: Parents only.
create policy "Parents manage rewards"
  on public.rewards_store for all
  using (
    family_id in (
      select family_id from public.profiles 
      where id = auth.uid() and role in ('admin_parent', 'parent')
    )
  );

-- Rewards Redemptions:
-- Create: Child can redeem if balance sufficient (this logic should be in API/Trigger, but RLS allows insert).
create policy "Children can redeem rewards"
  on public.rewards_redemptions for insert
  with check (
    created_by = auth.uid()
    and
    family_id in (select family_id from public.profiles where id = auth.uid())
  );
  
-- View redemptions: Family members.
create policy "View redemptions in family"
  on public.rewards_redemptions for select
  using (
    family_id in (
      select family_id from public.profiles where id = auth.uid()
    )
  );

-- 4. Triggers (Optional but good for data integrity)

-- Deduct stars on redemption
create or replace function public.handle_reward_redemption() 
returns trigger as $$
declare
  item_price int;
  child_balance int;
begin
  select price into item_price from public.rewards_store where id = new.reward_id;
  select stars_balance into child_balance from public.profiles where id = new.created_by;
  
  if child_balance < item_price then
    raise exception 'Insufficient stars balance';
  end if;
  
  update public.profiles 
  set stars_balance = stars_balance - item_price
  where id = new.created_by;
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_reward_redemption
  before insert on public.rewards_redemptions
  for each row execute procedure public.handle_reward_redemption();

-- Add stars on task approval
create or replace function public.handle_task_approval()
returns trigger as $$
begin
  if new.status = 'approved' and old.status != 'approved' then
    update public.profiles
    set stars_balance = stars_balance + new.stars_value
    where id = new.assigned_to;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_task_approval
  after update on public.tasks
  for each row execute procedure public.handle_task_approval();
