-- Core multi-tenant tables: entities, user_profiles, entity_memberships
-- Owners (is_owner = TRUE) bypass entity-level RLS; employees are scoped to their entity.

create extension if not exists "pgcrypto";
create extension if not exists "vector";
create extension if not exists "pg_trgm";

create table entities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  business_type text not null,
  status text not null default 'active' check (status in ('active', 'placeholder', 'archived')),
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text,
  is_owner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table entity_memberships (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'employee' check (role in ('manager', 'employee', 'it_admin')),
  created_at timestamptz not null default now(),
  unique (entity_id, user_id)
);

create index entity_memberships_user_id_idx on entity_memberships (user_id);
create index entity_memberships_entity_id_idx on entity_memberships (entity_id);

-- Helper functions used by RLS policies across every table in later migrations.

create or replace function is_owner()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_owner from user_profiles where id = auth.uid()), false);
$$;

create or replace function is_entity_member(target_entity_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select is_owner() or exists (
    select 1 from entity_memberships
    where entity_id = target_entity_id and user_id = auth.uid()
  );
$$;

alter table entities enable row level security;
alter table user_profiles enable row level security;
alter table entity_memberships enable row level security;

create policy "Owners see all entities, members see their own" on entities
  for select using (is_owner() or is_entity_member(id));

create policy "Owners manage entities" on entities
  for all using (is_owner()) with check (is_owner());

create policy "Users read own profile, owners read all" on user_profiles
  for select using (id = auth.uid() or is_owner());

create policy "Users update own profile" on user_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Members see own entity memberships, owners see all" on entity_memberships
  for select using (user_id = auth.uid() or is_owner() or is_entity_member(entity_id));

create policy "Owners manage memberships" on entity_memberships
  for insert with check (is_owner());

create policy "Owners update memberships" on entity_memberships
  for update using (is_owner()) with check (is_owner());

create policy "Owners delete memberships" on entity_memberships
  for delete using (is_owner());
