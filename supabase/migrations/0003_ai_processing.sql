-- AI processing layer: classification results and vector embeddings for RAG.

create table email_analyses (
  id uuid primary key default gen_random_uuid(),
  email_id uuid not null references emails (id) on delete cascade,
  intent text,
  pipeline_stage text,
  sentiment text,
  urgency_score smallint check (urgency_score between 1 and 10),
  summary text,
  extracted_entities jsonb not null default '{}',
  action_items text[] not null default '{}',
  key_dates jsonb not null default '{}',
  confidence_score numeric(3, 2) check (confidence_score between 0 and 1),
  model_used text,
  created_at timestamptz not null default now(),
  unique (email_id)
);

create table email_embeddings (
  id uuid primary key default gen_random_uuid(),
  email_id uuid not null references emails (id) on delete cascade,
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  unique (email_id)
);

create index email_embeddings_ivfflat_idx
  on email_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table email_analyses enable row level security;
alter table email_embeddings enable row level security;

create policy "Entity members see analyses for their entity's emails" on email_analyses
  for select using (
    exists (
      select 1 from emails
      where emails.id = email_analyses.email_id and is_entity_member(emails.entity_id)
    )
  );

create policy "Entity members write analyses for their entity's emails" on email_analyses
  for all using (
    exists (
      select 1 from emails
      where emails.id = email_analyses.email_id and is_entity_member(emails.entity_id)
    )
  );

create policy "Entity members see embeddings for their entity's emails" on email_embeddings
  for select using (
    exists (
      select 1 from emails
      where emails.id = email_embeddings.email_id and is_entity_member(emails.entity_id)
    )
  );

create policy "Entity members write embeddings for their entity's emails" on email_embeddings
  for all using (
    exists (
      select 1 from emails
      where emails.id = email_embeddings.email_id and is_entity_member(emails.entity_id)
    )
  );
