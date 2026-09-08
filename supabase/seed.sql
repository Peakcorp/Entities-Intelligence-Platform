-- Seeds the four business entities. Owner accounts (Eli Tene, Gil Priel) are created via
-- Supabase Auth invite (see docs/OWNER_SETUP.md) and are not seeded here since auth.users
-- rows require the auth admin API, not a plain SQL insert.

insert into entities (slug, name, business_type, status, config) values
  ('supplyx', 'SupplyX Inc', 'Procurement of building materials, FF&E, renovation materials', 'active', '{}'),
  ('peak-foreclosure', 'Peak Foreclosure', 'Real estate foreclosure operations', 'placeholder', '{}'),
  ('peak-1031-exchange', 'Peak 1031 Exchange', 'Tax-deferred real estate exchange services', 'placeholder', '{}'),
  ('grand-investment-group', 'Grand Investment Group', 'Investment group operations', 'placeholder', '{}')
on conflict (slug) do nothing;
