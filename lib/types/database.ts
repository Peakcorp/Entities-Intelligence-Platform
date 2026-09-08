// Placeholder until the Supabase project exists and types are generated for real:
//   npx supabase gen types typescript --project-id <id> > lib/types/database.ts
// Keeping this as `any`-free unknowns (not `any`) so TypeScript strict mode still
// catches misuse at call sites instead of silently allowing anything through.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
