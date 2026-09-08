# Owner account setup

Owner accounts (`is_owner = true`) bypass entity-level RLS entirely and see every
entity, connection, and email. There are exactly two: Eli Tene and Gil Priel.

## 1. Invite via Supabase Auth

Auth users can't be created by a plain SQL insert — use the Supabase dashboard
(Authentication → Users → Invite user) or the Admin API:

```bash
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/invite" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "eli@peakcorp.example"}'
```

Repeat for Gil's email address.

## 2. Mark them as owners

After each accepts the invite, a row appears in `auth.users`. Insert (or upsert) the
matching `user_profiles` row with `is_owner = true`:

```sql
insert into user_profiles (id, full_name, is_owner)
values ('<auth-user-id-from-step-1>', 'Eli Tene', true)
on conflict (id) do update set is_owner = true;
```

Owners do not need rows in `entity_memberships` — `is_entity_member()` and every RLS
policy in this project already short-circuits on `is_owner()`.

## 3. Enable MFA

Owners should enrol an authenticator app under their account settings once the
platform's account settings page ships (Phase 3+). Until then, enable TOTP MFA
directly from the Supabase Auth dashboard for each owner's user.
