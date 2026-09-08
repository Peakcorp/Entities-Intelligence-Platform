-- Client Satisfaction Intelligence (spec section 05a).
-- Re-assessed every sync cycle; manual overrides are audited via activity_log.

create table client_satisfaction_assessments (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  status text not null check (status in ('satisfied', 'neutral', 'at_risk', 'needs_immediate_attention')),
  score numeric(3, 1) check (score between 1 and 10),
  trend text check (trend in ('improving', 'stable', 'declining')),
  narrative text,
  positive_signals jsonb not null default '[]',
  negative_signals jsonb not null default '[]',
  open_issues jsonb not null default '[]',
  days_since_last_contact int,
  recommended_action text,
  confidence numeric(3, 2) check (confidence between 0 and 1),
  is_manual_override boolean not null default false,
  override_note text,
  overridden_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index client_satisfaction_client_id_idx on client_satisfaction_assessments (client_id, created_at desc);
create index client_satisfaction_status_idx on client_satisfaction_assessments (entity_id, status);

alter table client_satisfaction_assessments enable row level security;

create policy "Entity members access their entity's satisfaction assessments"
  on client_satisfaction_assessments
  for all using (is_entity_member(entity_id)) with check (is_entity_member(entity_id));
