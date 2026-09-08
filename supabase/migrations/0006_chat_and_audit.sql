-- AI chat history and the full audit trail (activity_log).

create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  cited_email_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index chat_messages_session_id_idx on chat_messages (session_id, created_at);

-- Full audit trail: every scorecard change, connection, override, etc.
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities (id) on delete cascade,
  user_id uuid references auth.users (id),
  action text not null,
  target_table text not null,
  target_id uuid,
  before_value jsonb,
  after_value jsonb,
  note text,
  created_at timestamptz not null default now()
);

create index activity_log_entity_id_idx on activity_log (entity_id, created_at desc);
create index activity_log_target_idx on activity_log (target_table, target_id);

alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table activity_log enable row level security;

create policy "Users access their own chat sessions, owners see all" on chat_sessions
  for all using (user_id = auth.uid() or (is_owner() and is_entity_member(entity_id)))
  with check (user_id = auth.uid());

create policy "Users access messages in their own sessions" on chat_messages
  for all using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and (chat_sessions.user_id = auth.uid() or is_owner())
    )
  );

create policy "Entity members read their entity's activity log" on activity_log
  for select using (is_entity_member(entity_id));

create policy "Entity members write to their entity's activity log" on activity_log
  for insert with check (is_entity_member(entity_id));
