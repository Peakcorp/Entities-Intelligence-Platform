import { createClient } from "@/lib/supabase/server";

export type EntityStatus = "active" | "placeholder" | "archived";

export type EntitySummary = {
  id: string;
  slug: string;
  name: string;
  business_type: string;
  status: EntityStatus;
};

// Owners get every entity; employees/managers get only the ones they're a member of.
// This relies entirely on RLS (entities policy in 0001_core_multitenant.sql) rather than
// filtering in application code, so it stays correct even if called from a new page later.
export async function getVisibleEntities(): Promise<EntitySummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entities")
    .select("id, slug, name, business_type, status")
    .order("status", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as EntitySummary[];
}

export async function getEntityBySlug(slug: string): Promise<EntitySummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entities")
    .select("id, slug, name, business_type, status")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as EntitySummary | null;
}
