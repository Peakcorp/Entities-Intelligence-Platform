# Email integration setup

Status: **placeholder — full guide ships in Phase 1** (spec section 05, "Email Ingestion
Pipeline"). This stub exists so the Settings → Email page has somewhere to link to.

Phase 1 will document, end to end:

- Azure App Registration (Microsoft Graph): required API permissions
  (`Mail.Read`, `Mail.ReadWrite`, `offline_access`), redirect URI configuration, and
  admin consent steps for an IT manager with no prior Azure experience.
- Google Cloud OAuth consent screen + credentials, for the Gmail fallback path.
- Where the resulting client IDs/secrets go (`.env.example` already lists the variable
  names under `MICROSOFT_*` / `GOOGLE_*`).
- How the initial 24-month backfill and 15-minute delta sync are triggered and
  monitored.
