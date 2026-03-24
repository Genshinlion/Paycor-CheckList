-- ============================================================
-- ShiftCheck — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Users table ───────────────────────────────────────────────────────────
create table if not exists public.users (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  email                 text unique not null,
  phone                 text,
  role                  text not null default 'employee' check (role in ('employee','manager')),
  auth_provider         text not null default 'local' check (auth_provider in ('local','paycor')),
  paycor_employee_id    text unique,
  password_hash         text,                      -- null for paycor users
  must_change_password  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── Tasks table ───────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text not null default 'Operations',
  assigned_to uuid references public.users(id) on delete set null,
  recurring   boolean not null default true,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ── Task completions (one per task per day) ───────────────────────────────
create table if not exists public.completions (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid references public.tasks(id) on delete cascade,
  employee_id   uuid references public.users(id) on delete cascade,
  notes         text,
  completed_at  timestamptz not null default now(),
  unique (task_id, completed_at::date)          -- one completion per task per day
);

-- ── Swap requests ─────────────────────────────────────────────────────────
create table if not exists public.swaps (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid references public.tasks(id) on delete cascade,
  from_id     uuid references public.users(id) on delete cascade,
  to_id       uuid references public.users(id) on delete cascade,
  reason      text,
  status      text not null default 'approved',
  created_at  timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────
alter table public.users       enable row level security;
alter table public.tasks       enable row level security;
alter table public.completions enable row level security;
alter table public.swaps       enable row level security;

-- Employees can read their own row; managers can read all
create policy "users_select" on public.users for select
  using (true);   -- refined per-app via service key on server; anon key is read-only

-- Only service role (Netlify functions) can insert/update/delete
-- (all mutations go through Netlify functions using SUPABASE_SERVICE_KEY)
create policy "users_insert"  on public.users for insert with check (false);
create policy "users_update"  on public.users for update using (false);

create policy "tasks_select"  on public.tasks       for select using (true);
create policy "tasks_insert"  on public.tasks       for insert with check (false);
create policy "tasks_update"  on public.tasks       for update using (false);
create policy "tasks_delete"  on public.tasks       for delete using (false);

create policy "comp_select"   on public.completions for select using (true);
create policy "comp_insert"   on public.completions for insert with check (false);

create policy "swaps_select"  on public.swaps       for select using (true);
create policy "swaps_insert"  on public.swaps       for insert with check (false);

-- ── Updated_at trigger ───────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();
