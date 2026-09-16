# Email integration setup (Microsoft 365)

This connects SupplyX team mailboxes (Lee, Michael, etc.) to the platform so their email
is read and analyzed. It uses Microsoft Graph via OAuth2 — each employee authorizes their
own mailbox in a browser popup; the platform never sees or asks for a password.

## What the IT manager needs to do (Azure App Registration)

1. Go to the [Azure Portal](https://portal.azure.com) → **Azure Active Directory** (a.k.a.
   Microsoft Entra ID) → **App registrations** → **New registration**.
2. Name it something like `PeakCorp Intelligence Platform`.
3. Supported account types: **Accounts in this organizational directory only** (single
   tenant — this is a company-internal integration, not a public app).
4. Redirect URI: choose **Web**, and enter:
   ```
   https://entities-intelligence-platform.vercel.app/api/auth/microsoft/callback
   ```
   (Add `http://localhost:3000/api/auth/microsoft/callback` too if anyone will test locally.)
5. Click **Register**.
6. On the app's **Overview** page, copy:
   - **Application (client) ID** → this is `MICROSOFT_CLIENT_ID`
   - **Directory (tenant) ID** → this is `MICROSOFT_TENANT_ID`
7. Go to **Certificates & secrets** → **New client secret**. Copy the secret **value**
   immediately (it's only shown once) → this is `MICROSOFT_CLIENT_SECRET`. Note its
   expiration date — you'll need to rotate it before then.
8. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated
   permissions** → add:
   - `Mail.Read`
   - `Mail.ReadWrite`
   - `offline_access`
   - `User.Read`
9. Click **Grant admin consent for [your organization]** — this requires Global
   Administrator or Privileged Role Administrator. Without this step, employees will hit a
   permissions error when they try to connect their mailbox.

## What to hand back

Give these four values to whoever manages the Vercel project (not by pasting them into
chat with an AI — treat them like passwords):

| Value | Where it came from |
|---|---|
| `MICROSOFT_CLIENT_ID` | App registration Overview page |
| `MICROSOFT_CLIENT_SECRET` | Certificates & secrets |
| `MICROSOFT_TENANT_ID` | App registration Overview page |
| `MICROSOFT_REDIRECT_URI` | `https://entities-intelligence-platform.vercel.app/api/auth/microsoft/callback` |

They go into **Vercel → Project → Settings → Environment Variables**, then redeploy.

## What each employee does (once the above is configured)

1. Sign in to the dashboard with their own invited account.
2. Go to **Settings → Team** (owner-only) isn't relevant here — go to their entity's
   **Settings → Email Settings** page.
3. Click **Connect Microsoft 365** and sign in / consent with their own Microsoft 365
   account.
4. Click **Sync now** to pull their recent mail. This currently does an on-demand pull of
   the last 50 messages per click — see "What's not automated yet" below.

## How tokens are stored

Access and refresh tokens are never stored as plain columns. They're written to Supabase
Vault (`vault_create_secret`/`vault_read_secret`/`vault_update_secret` in
`supabase/migrations/0008_vault_helpers.sql`) and only `email_connections.access_token_secret_id`
/ `refresh_token_secret_id` (a Vault secret UUID) is stored on the row. Only the
service-role key can decrypt them, and it's never exposed to the browser.

## What's not automated yet

- **Incremental/delta sync.** Right now, "Sync now" is a manual, on-demand pull of the
  most recent 50 messages — clicking it again re-checks the same window rather than
  fetching only what's new. The spec calls for delta tokens + a `pg_cron` job running every
  15 minutes; that's still to be built (a Supabase Edge Function using Graph's
  `$deltaToken`, scheduled via `pg_cron`).
- **Initial 24-month backfill.** Not implemented — only recent mail is pulled today.
- **Gmail fallback.** Not built. The Microsoft 365 flow above is the only provider
  supported right now.
- **Attachment extraction.** Not implemented — attachments are flagged (`has_attachments`)
  but not downloaded or OCR'd.
