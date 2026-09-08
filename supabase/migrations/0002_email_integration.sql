-- Email integration: connections and durable email storage.
-- Emails are never deleted, even if removed from the provider (mark is_archived instead).

create table email_connections (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  email_address text not null,
  provider text not null check (provider in ('microsoft', 'google')),
  -- Tokens are never stored in plaintext columns: these hold Supabase Vault secret ids.
  access_token_secret_id uuid,
  refresh_token_secret_id uuid,
  sync_cursor text,
  sync_status text not null default 'pending' check (sync_status in ('pending', 'syncing', 'ok', 'error')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_id, email_address)
);

create table emails (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities (id) on delete cascade,
  connection_id uuid not null references email_connections (id) on delete cascade,
  external_id text not null,
  thread_id text,
  subject text,
  body_text text,
  body_html text,
  from_address text,
  to_addresses text[] not null default '{}',
  sent_at timestamptz,
  has_attachments boolean not null default false,
  attachment_urls text[] not null default '{}',
  is_processed boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (connection_id, external_id)
);

create index emails_entity_id_idx on emails (entity_id);
create index emails_thread_id_idx on emails (thread_id);
create index emails_is_processed_idx on emails (is_processed) where is_processed = false;
create index emails_from_address_trgm_idx on emails using gin (from_address gin_trgm_ops);

alter table email_connections enable row level security;
alter table emails enable row level security;

create policy "Entity members see their entity's connections" on email_connections
  for select using (is_entity_member(entity_id));

create policy "Entity members manage their own connections" on email_connections
  for all using (is_entity_member(entity_id) and (user_id = auth.uid() or is_owner()))
  with check (is_entity_member(entity_id) and (user_id = auth.uid() or is_owner()));

create policy "Entity members see their entity's emails" on emails
  for select using (is_entity_member(entity_id));

create policy "Service role writes emails" on emails
  for insert with check (is_entity_member(entity_id));

create policy "Entity members update their entity's emails" on emails
  for update using (is_entity_member(entity_id)) with check (is_entity_member(entity_id));
