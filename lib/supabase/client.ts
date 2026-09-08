import { createBrowserClient } from "@supabase/ssr";

// Untyped until the Supabase project exists and `lib/types/database.ts` is regenerated
// from it (see that file for the command) — then parameterize as createBrowserClient<Database>.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
