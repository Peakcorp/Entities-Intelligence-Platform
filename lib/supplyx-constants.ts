// Pure constants/types shared by server pages and client components. Kept separate from
// lib/supplyx.ts because that file imports the server-only Supabase client (next/headers),
// which breaks the client bundle if a "use client" component imports from it directly.

export const PIPELINE_STAGES = [
  "lead",
  "prospect",
  "quote_sent",
  "negotiation",
  "order_placed",
  "in_production",
  "shipped",
  "delivered",
  "closed",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  lead: "Lead",
  prospect: "Prospect",
  quote_sent: "Quote Sent",
  negotiation: "Negotiation",
  order_placed: "Order Placed",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
  closed: "Closed",
};

export const SATISFACTION_LABELS: Record<string, string> = {
  satisfied: "Satisfied",
  neutral: "Neutral",
  at_risk: "At Risk",
  needs_immediate_attention: "Needs Immediate Attention",
};

export type Deal = {
  id: string;
  stage: PipelineStage;
  deal_value: number | null;
  expected_close_date: string | null;
  clients: { id: string; name: string; company: string | null } | null;
};
