import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Untyped until the Supabase project exists and `lib/types/database.ts` is regenerated
// from it (see that file for the command) — then parameterize as createServerClient<Database>.

// For use in Server Components, Route Handlers, and Server Actions only.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component with no request/response to mutate.
            // Safe to ignore when middleware is refreshing the session on every request.
          }
        },
      },
    },
  );
}

// Bypasses RLS entirely — only for trusted server-side jobs (sync workers, nightly AI
// analysis). Never expose this client or the service role key to the browser.
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
