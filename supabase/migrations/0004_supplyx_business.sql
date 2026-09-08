-- SupplyX business tables. Entity-scoped by entity_id; designed to extend to other entities.

create table manufacturers (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities (id) on delete cascade,
  name text not null,
  country text,
  region text,
  product_categories text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index manufacturers_name_trgm_idx on manufacturers using gin (name gin_trgm_ops);

create table manufacturer_scorecards (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references manufacturers (id) on delete cascade,
  entity_id uuid not null references entities (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  ai_responsiveness numeric(4, 1),
  ai_quality numeric(4, 1),
  ai_price numeric(4, 1),
  ai_reliability numeric(4, 1),
  manual_responsiveness numeric(4, 1),
  manual_quality numeric(4, 1),
  manual_price numeric(4, 1),
  manual_reliability numeric(4, 1),
  display_responsiveness numeric(4, 1)
    generated always as (coalesce(manual_responsiveness, ai_responsiveness)) stored,
  display_quality numeric(4, 1)
    generated always as (coalesce(manual_quality, ai_quality)) stored,
  display_price numeric(4, 1)
    generated always as (coalesce(manual_price, ai_price)) stored,
  display_reliability numeric(4, 1)
    generated always as (coalesce(manual_reliability, ai_reliability)) stored,
  team_notes text,
  flagged_issues text[] not null default '{}',
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (manufacturer_id, period_start, period_end)
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities (id) on delete cascade,
  name text not null,
  company text,
  contact_emails text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table deals (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  stage text not null default 'lead' check (stage in (
    'lead', 'prospect', 'quote_sent', 'negotiation', 'order_placed',
    'in_production', 'shipped', 'delivered', 'closed'
  )),
  deal_value numeric(12, 2),
  assigned_to uuid references auth.users (id),
  expected_close_date date,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deals_client_id_idx on deals (client_id);
create index deals_stage_idx on deals (entity_id, stage);

create table orders (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  manufacturer_id uuid references manufacturers (id),
  items jsonb not null default '[]',
  shipping_method text,
  tracking_number text,
  origin_country text,
  status text not null default 'pending' check (status in (
    'pending', 'confirmed', 'in_production', 'shipped', 'in_customs', 'delivered'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table manufacturers enable row level security;
alter table manufacturer_scorecards enable row level security;
alter table clients enable row level security;
alter table deals enable row level security;
alter table orders enable row level security;

create policy "Entity members access their entity's manufacturers" on manufacturers
  for all using (is_entity_member(entity_id)) with check (is_entity_member(entity_id));

create policy "Entity members access their entity's scorecards" on manufacturer_scorecards
  for all using (is_entity_member(entity_id)) with check (is_entity_member(entity_id));

create policy "Entity members access their entity's clients" on clients
  for all using (is_entity_member(entity_id)) with check (is_entity_member(entity_id));

create policy "Entity members access their entity's deals" on deals
  for all using (is_entity_member(entity_id)) with check (is_entity_member(entity_id));

create policy "Entity members access orders via deal entity" on orders
  for all using (
    exists (select 1 from deals where deals.id = orders.deal_id and is_entity_member(deals.entity_id))
  ) with check (
    exists (select 1 from deals where deals.id = orders.deal_id and is_entity_member(deals.entity_id))
  );
