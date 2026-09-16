-- Thin wrappers around Supabase Vault so OAuth tokens are never stored in plain columns
-- (spec section 05: "All OAuth tokens stored via Supabase Vault"). The `vault` schema
-- isn't exposed over the API, so these security-definer functions in `public` are the
-- only way the app (via the service-role client) reads or writes a token.

create or replace function vault_create_secret(secret text, secret_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  new_id uuid;
begin
  new_id := vault.create_secret(secret, secret_name);
  return new_id;
end;
$$;

create or replace function vault_read_secret(secret_id uuid)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  secret_value text;
begin
  select decrypted_secret into secret_value
  from vault.decrypted_secrets
  where id = secret_id;
  return secret_value;
end;
$$;

create or replace function vault_update_secret(secret_id uuid, new_secret text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
begin
  perform vault.update_secret(secret_id, new_secret);
end;
$$;

-- Only the service role calls these (never anon/authenticated) — the app never exposes
-- them to the browser, but revoke broadly anyway as defense in depth.
revoke execute on function vault_create_secret(text, text) from public, anon, authenticated;
revoke execute on function vault_read_secret(uuid) from public, anon, authenticated;
revoke execute on function vault_update_secret(uuid, text) from public, anon, authenticated;
grant execute on function vault_create_secret(text, text) to service_role;
grant execute on function vault_read_secret(uuid) to service_role;
grant execute on function vault_update_secret(uuid, text) to service_role;
