import { createClient } from "@/lib/supabase/server";
import { PIPELINE_STAGES, STAGE_LABELS, type Deal, type PipelineStage } from "@/lib/supplyx-constants";

export { PIPELINE_STAGES, STAGE_LABELS, SATISFACTION_LABELS } from "@/lib/supplyx-constants";
export type { Deal, PipelineStage } from "@/lib/supplyx-constants";

export async function getDeals(entityId: string): Promise<Deal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select("id, stage, deal_value, expected_close_date, clients(id, name, company)")
    .eq("entity_id", entityId)
    .order("expected_close_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Deal[];
}

export async function updateDealStage(dealId: string, stage: PipelineStage) {
  const supabase = await createClient();
  const { error } = await supabase.from("deals").update({ stage }).eq("id", dealId);
  if (error) throw error;
}

export type UrgentEmail = {
  id: string;
  subject: string | null;
  from_address: string | null;
  sent_at: string | null;
  email_analyses: { urgency_score: number | null; summary: string | null } | null;
};

export async function getExecutiveOverview(entityId: string) {
  const supabase = await createClient();

  const [{ data: deals }, { data: satisfaction }, { data: urgentEmails }] = await Promise.all([
    supabase.from("deals").select("stage, deal_value").eq("entity_id", entityId),
    supabase
      .from("client_satisfaction_assessments")
      .select("status, client_id, clients(name)")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false }),
    supabase
      .from("emails")
      .select("id, subject, from_address, sent_at, email_analyses!inner(urgency_score, summary)")
      .eq("entity_id", entityId)
      .gte("email_analyses.urgency_score", 8)
      .order("sent_at", { ascending: false })
      .limit(10),
  ]);

  const pipelineValue = (deals ?? []).reduce((sum, d) => sum + (d.deal_value ?? 0), 0);
  const activeDeals = (deals ?? []).filter((d) => d.stage !== "closed").length;

  const funnelCounts = PIPELINE_STAGES.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    count: (deals ?? []).filter((d) => d.stage === stage).length,
  }));

  // Latest assessment per client only (created_at desc already ordered, so first wins).
  const seen = new Set<string>();
  const latestByClient = (satisfaction ?? []).filter((row) => {
    if (seen.has(row.client_id)) return false;
    seen.add(row.client_id);
    return true;
  });
  const atRiskClients = latestByClient.filter(
    (row) => row.status === "at_risk" || row.status === "needs_immediate_attention",
  );

  return {
    pipelineValue,
    activeDeals,
    funnelCounts,
    atRiskClients: atRiskClients as unknown as Array<{
      status: string;
      client_id: string;
      clients: { name: string } | null;
    }>,
    urgentEmails: (urgentEmails ?? []) as unknown as UrgentEmail[],
  };
}

export type EmailWithAnalysis = {
  id: string;
  subject: string | null;
  body_text: string | null;
  from_address: string | null;
  to_addresses: string[] | null;
  sent_at: string | null;
  email_analyses: {
    intent: string | null;
    pipeline_stage: string | null;
    sentiment: string | null;
    urgency_score: number | null;
    summary: string | null;
  } | null;
};

export async function searchEmails(entityId: string, query?: string): Promise<EmailWithAnalysis[]> {
  const supabase = await createClient();
  let request = supabase
    .from("emails")
    .select(
      "id, subject, body_text, from_address, to_addresses, sent_at, email_analyses(intent, pipeline_stage, sentiment, urgency_score, summary)",
    )
    .eq("entity_id", entityId)
    .order("sent_at", { ascending: false })
    .limit(50);

  if (query?.trim()) {
    request = request.or(`subject.ilike.%${query}%,body_text.ilike.%${query}%,from_address.ilike.%${query}%`);
  }

  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as unknown as EmailWithAnalysis[];
}

export type ManufacturerWithScorecard = {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  product_categories: string[] | null;
  manufacturer_scorecards: Array<{
    id: string;
    ai_responsiveness: number | null;
    ai_quality: number | null;
    ai_price: number | null;
    ai_reliability: number | null;
    manual_responsiveness: number | null;
    manual_quality: number | null;
    manual_price: number | null;
    manual_reliability: number | null;
    display_responsiveness: number | null;
    display_quality: number | null;
    display_price: number | null;
    display_reliability: number | null;
    team_notes: string | null;
    flagged_issues: string[] | null;
  }>;
};

export async function getManufacturers(entityId: string): Promise<ManufacturerWithScorecard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manufacturers")
    .select(
      "id, name, country, region, product_categories, manufacturer_scorecards(id, ai_responsiveness, ai_quality, ai_price, ai_reliability, manual_responsiveness, manual_quality, manual_price, manual_reliability, display_responsiveness, display_quality, display_price, display_reliability, team_notes, flagged_issues)",
    )
    .eq("entity_id", entityId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as ManufacturerWithScorecard[];
}

export async function overrideScorecard(
  scorecardId: string,
  overrides: {
    manual_responsiveness: number | null;
    manual_quality: number | null;
    manual_price: number | null;
    manual_reliability: number | null;
  },
  note: string,
  entityId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: before } = await supabase
    .from("manufacturer_scorecards")
    .select("manual_responsiveness, manual_quality, manual_price, manual_reliability, manufacturer_id")
    .eq("id", scorecardId)
    .single();

  const { error } = await supabase
    .from("manufacturer_scorecards")
    .update({ ...overrides, updated_by: user?.id ?? null })
    .eq("id", scorecardId);
  if (error) throw error;

  await supabase.from("activity_log").insert({
    entity_id: entityId,
    user_id: user?.id ?? null,
    action: "scorecard_manual_override",
    target_table: "manufacturer_scorecards",
    target_id: before?.manufacturer_id ?? scorecardId,
    before_value: before,
    after_value: overrides,
    note,
  });
}

export type ClientWithSatisfaction = {
  id: string;
  name: string;
  company: string | null;
  contact_emails: string[] | null;
  deals: Array<{ deal_value: number | null; stage: string }>;
  client_satisfaction_assessments: Array<{
    status: string;
    score: number | null;
    trend: string | null;
    narrative: string | null;
    days_since_last_contact: number | null;
    created_at: string;
  }>;
};

export async function getClients(entityId: string): Promise<ClientWithSatisfaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, name, company, contact_emails, deals(deal_value, stage), client_satisfaction_assessments(status, score, trend, narrative, days_since_last_contact, created_at)",
    )
    .eq("entity_id", entityId)
    .order("name");
  if (error) throw error;

  // Keep only the latest assessment per client (created_at desc, take first).
  const rows = (data ?? []) as unknown as ClientWithSatisfaction[];
  return rows.map((c) => ({
    ...c,
    client_satisfaction_assessments: [...c.client_satisfaction_assessments]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 1),
  }));
}

export async function getClientDetail(entityId: string, clientId: string) {
  const supabase = await createClient();
  const [{ data: client }, { data: assessments }, { data: deals }, { data: emails }] = await Promise.all([
    supabase.from("clients").select("*").eq("entity_id", entityId).eq("id", clientId).maybeSingle(),
    supabase
      .from("client_satisfaction_assessments")
      .select("*")
      .eq("entity_id", entityId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("deals")
      .select("id, stage, deal_value, expected_close_date, orders(status, tracking_number)")
      .eq("entity_id", entityId)
      .eq("client_id", clientId),
    supabase
      .from("emails")
      .select("id, subject, sent_at, from_address, email_analyses(sentiment, urgency_score, summary)")
      .eq("entity_id", entityId)
      .order("sent_at", { ascending: false })
      .limit(20),
  ]);

  return { client, assessments: assessments ?? [], deals: deals ?? [], emails: emails ?? [] };
}

export type OrderRow = {
  id: string;
  status: string;
  shipping_method: string | null;
  tracking_number: string | null;
  origin_country: string | null;
  items: Array<{ item: string; qty: number; unit: string }>;
  manufacturers: { name: string } | null;
  deals: { id: string; clients: { name: string } | null } | null;
};

export async function getOrders(entityId: string): Promise<OrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, shipping_method, tracking_number, origin_country, items, manufacturers(name), deals!inner(id, entity_id, clients(name))",
    )
    .eq("deals.entity_id", entityId)
    .order("status");
  if (error) throw error;
  return (data ?? []) as unknown as OrderRow[];
}
