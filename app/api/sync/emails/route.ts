import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { listRecentMessages, refreshAccessToken } from "@/lib/microsoft-graph";

async function classifyEmail(subject: string, bodyText: string) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 400,
        system:
          "You classify procurement/business emails for SupplyX Inc. Respond with ONLY a JSON object, " +
          'no prose: {"intent": string, "pipeline_stage": one of ' +
          '["lead","prospect","quote_sent","negotiation","order_placed","in_production","shipped","delivered","closed"], ' +
          '"sentiment": "positive"|"neutral"|"negative", "urgency_score": 1-10, "summary": "one sentence"}',
        messages: [{ role: "user", content: `Subject: ${subject}\n\nBody: ${bodyText.slice(0, 3000)}` }],
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json.content?.[0]?.text ?? "";
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const { connectionId } = await request.json();
  if (!connectionId) return NextResponse.json({ error: "connectionId is required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const service = createServiceRoleClient();
  const { data: connection } = await service
    .from("email_connections")
    .select("id, entity_id, email_address, access_token_secret_id, refresh_token_secret_id")
    .eq("id", connectionId)
    .single();
  if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

  // Confirm the caller actually belongs to this connection's entity (RLS-equivalent check,
  // since this route runs with the service role and must enforce it manually).
  const { data: membership } = await supabase
    .from("entities")
    .select("id")
    .eq("id", connection.entity_id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: accessToken } = await service.rpc("vault_read_secret", {
    secret_id: connection.access_token_secret_id,
  });

  const { MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID } = process.env;

  let messages;
  try {
    messages = await listRecentMessages(accessToken, 50);
  } catch {
    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !MICROSOFT_TENANT_ID) {
      await service.from("email_connections").update({ sync_status: "error" }).eq("id", connectionId);
      return NextResponse.json({ error: "Access token expired and refresh isn't configured" }, { status: 500 });
    }
    const { data: refreshToken } = await service.rpc("vault_read_secret", {
      secret_id: connection.refresh_token_secret_id,
    });
    const refreshed = await refreshAccessToken({
      tenantId: MICROSOFT_TENANT_ID,
      clientId: MICROSOFT_CLIENT_ID,
      clientSecret: MICROSOFT_CLIENT_SECRET,
      refreshToken,
    });
    await service.rpc("vault_update_secret", {
      secret_id: connection.access_token_secret_id,
      new_secret: refreshed.access_token,
    });
    if (refreshed.refresh_token) {
      await service.rpc("vault_update_secret", {
        secret_id: connection.refresh_token_secret_id,
        new_secret: refreshed.refresh_token,
      });
    }
    messages = await listRecentMessages(refreshed.access_token, 50);
  }

  let inserted = 0;
  for (const message of messages) {
    const bodyText = message.body?.content ?? message.bodyPreview ?? "";
    const { data: email, error } = await service
      .from("emails")
      .upsert(
        {
          entity_id: connection.entity_id,
          connection_id: connection.id,
          external_id: message.id,
          thread_id: message.conversationId,
          subject: message.subject,
          body_text: bodyText,
          from_address: message.from?.emailAddress?.address ?? null,
          to_addresses: (message.toRecipients ?? []).map((r) => r.emailAddress.address),
          sent_at: message.receivedDateTime,
          has_attachments: message.hasAttachments,
          is_processed: false,
        },
        { onConflict: "connection_id,external_id", ignoreDuplicates: true },
      )
      .select("id")
      .maybeSingle();

    if (error || !email) continue;
    inserted += 1;

    const analysis = await classifyEmail(message.subject ?? "", bodyText);
    if (analysis) {
      await service.from("email_analyses").insert({
        email_id: email.id,
        intent: analysis.intent,
        pipeline_stage: analysis.pipeline_stage,
        sentiment: analysis.sentiment,
        urgency_score: analysis.urgency_score,
        summary: analysis.summary,
        confidence_score: 0.75,
        model_used: "claude-3-haiku-20240307",
      });
    }
    await service.from("emails").update({ is_processed: true }).eq("id", email.id);
  }

  await service
    .from("email_connections")
    .update({ sync_status: "ok", last_synced_at: new Date().toISOString() })
    .eq("id", connectionId);

  return NextResponse.json({ synced: inserted, total: messages.length });
}
