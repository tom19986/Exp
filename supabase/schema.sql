-- ============================================================
-- EXPENSE MANAGER - SUPABASE SCHEMA
-- Run this whole file in Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- CHANNELS ----------
-- A channel is a group. Admin creates it, members join with a join_code.
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text unique not null,
  admin_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'member' check (role in ('admin','member')),
  channel_id uuid references public.channels(id) on delete set null,
  created_at timestamptz default now()
);

-- ---------- CATEGORIES ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.channels(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ---------- SUBCATEGORIES ----------
create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- ---------- EXPENSES / INCOME ----------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.channels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  type text not null check (type in ('income','expense')),
  amount numeric(12,2) not null check (amount > 0),
  description text,
  expense_date date not null default current_date,
  created_at timestamptz default now()
);

create index idx_expenses_channel on public.expenses(channel_id);
create index idx_expenses_date on public.expenses(expense_date);
create index idx_expenses_user on public.expenses(user_id);

-- ---------- PUSH SUBSCRIPTIONS ----------
-- Stores each device's Web Push subscription so a scheduled job
-- (see supabase/functions/send-daily-reminder) can send notifications
-- even when the app/tab is closed.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  reminder_hour_ist int not null default 20, -- 24h clock, IST, when the daily reminder should fire
  created_at timestamptz default now()
);

create index idx_push_subs_user on public.push_subscriptions(user_id);

-- ============================================================
-- HELPER FUNCTION - avoids RLS recursion issues
-- ============================================================
create or replace function public.get_my_channel_id()
returns uuid
language sql
security definer
stable
as $$
  select channel_id from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.channels enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.expenses enable row level security;
alter table public.push_subscriptions enable row level security;

-- CHANNELS
create policy "channel visible to its members/admin"
  on public.channels for select
  using (id = public.get_my_channel_id() or admin_id = auth.uid());

create policy "any signed-in user can create a channel"
  on public.channels for insert
  with check (admin_id = auth.uid());

create policy "admin can update own channel"
  on public.channels for update
  using (admin_id = auth.uid());

-- PROFILES
create policy "see own profile or channel-mates"
  on public.profiles for select
  using (id = auth.uid() or channel_id = public.get_my_channel_id());

create policy "update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- CATEGORIES
create policy "select categories in my channel"
  on public.categories for select
  using (channel_id = public.get_my_channel_id());

create policy "insert categories in my channel"
  on public.categories for insert
  with check (channel_id = public.get_my_channel_id());

create policy "update categories in my channel"
  on public.categories for update
  using (channel_id = public.get_my_channel_id());

create policy "delete categories in my channel"
  on public.categories for delete
  using (channel_id = public.get_my_channel_id());

-- SUBCATEGORIES
create policy "select subcategories in my channel"
  on public.subcategories for select
  using (channel_id = public.get_my_channel_id());

create policy "insert subcategories in my channel"
  on public.subcategories for insert
  with check (channel_id = public.get_my_channel_id());

create policy "update subcategories in my channel"
  on public.subcategories for update
  using (channel_id = public.get_my_channel_id());

create policy "delete subcategories in my channel"
  on public.subcategories for delete
  using (channel_id = public.get_my_channel_id());

-- EXPENSES
create policy "select expenses in my channel"
  on public.expenses for select
  using (channel_id = public.get_my_channel_id());

create policy "insert own expenses in my channel"
  on public.expenses for insert
  with check (channel_id = public.get_my_channel_id() and user_id = auth.uid());

create policy "update own expenses"
  on public.expenses for update
  using (user_id = auth.uid() and channel_id = public.get_my_channel_id());

create policy "delete own expenses"
  on public.expenses for delete
  using (user_id = auth.uid() and channel_id = public.get_my_channel_id());

-- PUSH SUBSCRIPTIONS
create policy "select own push subscriptions"
  on public.push_subscriptions for select
  using (user_id = auth.uid());

create policy "insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (user_id = auth.uid());

create policy "update own push subscriptions"
  on public.push_subscriptions for update
  using (user_id = auth.uid());

create policy "delete own push subscriptions"
  on public.push_subscriptions for delete
  using (user_id = auth.uid());

-- ============================================================
-- DONE. Next steps:
-- 1. Enable Email auth in Supabase Authentication settings
--    (Authentication > Providers > Email). Disable "confirm email"
--    for quicker local testing if you like.
-- 2. Copy your Project URL + anon public key into .env
-- ============================================================
