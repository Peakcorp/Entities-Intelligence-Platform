# PeakCorp Intelligence Platform

Multi-entity business intelligence dashboard: ingests and semantically understands
email communications across PeakCorp's companies, extracts actionable business
intelligence, and surfaces it through entity-specific dashboards and an AI chat
interface. Built per `PeakCorp_Intelligence_Platform_Build_Spec_1.docx`.

Entities: **SupplyX Inc** (full build, Phase 1+), Peak Foreclosure, Peak 1031
Exchange, Grand Investment Group (placeholders until their own build phase).

## Stack

Next.js (App Router, TypeScript strict) · Tailwind CSS + shadcn/ui · Zustand +
TanStack Query · Supabase (Postgres + pgvector + Auth + Storage + Edge Functions) ·
Anthropic Claude (chat + bulk classification) · Microsoft Graph / Gmail (email
ingestion).

## Setup

1. `npm install`
2. Create a Supabase project, then copy `.env.example` to `.env.local` and fill in
   the Supabase, Anthropic, and OAuth provider credentials.
3. `npx supabase link --project-ref <ref>` then `npx supabase db push` to run
   `supabase/migrations/` (creates all tables, RLS policies, and enables pgvector)
   and `supabase/seed.sql` (seeds the four entities).
4. Follow [docs/OWNER_SETUP.md](docs/OWNER_SETUP.md) to invite Eli Tene and Gil
   Priel as owner accounts.
5. `npm run dev` — [http://localhost:3000](http://localhost:3000).

## Project layout

- `app/(auth)/login`, `app/auth/callback` — Supabase magic-link auth.
- `app/(dashboard)/[entitySlug]` — entity-scoped dashboard shell; placeholder
  entities render a "Coming soon" page instead of the full dashboard.
- `lib/supabase/` — browser/server/service-role Supabase clients and the
  session-refresh proxy helper.
- `lib/entities.ts` — RLS-backed entity queries (owners see all, employees see
  their own entity only).
- `supabase/migrations/` — full schema: multi-tenant core, email integration, AI
  processing (embeddings + analyses), SupplyX business tables, client satisfaction
  intelligence, chat history, and the audit log.
- `proxy.ts` — Next.js 16's renamed `middleware.ts`; refreshes the Supabase session
  and gatekeeps unauthenticated requests.

## Build phases

See the build spec for the full plan. Phase 0 (this scaffold) delivers the
multi-tenant shell, auth, entity routing, DB schema, and an empty dashboard per
entity. Phases 1-5 (email ingestion, AI processing, the full SupplyX dashboard,
placeholder polish, and security hardening) follow.
