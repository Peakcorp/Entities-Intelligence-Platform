import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ChatRequestBody = {
  entitySlug: string;
  sessionId?: string;
  message: string;
};

// Keyword match over subject/body/summary stands in for the real pgvector semantic
// search (Phase 2) — good enough to demo citations without embeddings wired up yet.
async function findRelevantEmails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entityId: string,
  message: string,
) {
  const keywords = message
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3)
    .slice(0, 6);

  if (keywords.length === 0) return [];

  const orFilter = keywords
    .map((word) => `subject.ilike.%${word}%,body_text.ilike.%${word}%`)
    .join(",");

  const { data } = await supabase
    .from("emails")
    .select("id, subject, from_address, sent_at, email_analyses(summary, intent, urgency_score)")
    .eq("entity_id", entityId)
    .or(orFilter)
    .order("sent_at", { ascending: false })
    .limit(5);

  return data ?? [];
}

function buildFallbackAnswer(message: string, emails: Array<Record<string, unknown>>) {
  if (emails.length === 0) {
    return (
      "I don't have any emails matching that in what's been synced so far — I'd rather say so " +
      "than guess. (Note: this is a keyword-based fallback since ANTHROPIC_API_KEY isn't configured " +
      "yet; once it is, this becomes a real RAG-powered answer over the full email corpus.)"
    );
  }

  const lines = emails.map((email) => {
    const analysis = Array.isArray(email.email_analyses) ? email.email_analyses[0] : email.email_analyses;
    const summary = analysis && typeof analysis === "object" && "summary" in analysis ? analysis.summary : null;
    const sentAt = email.sent_at ? new Date(email.sent_at as string).toLocaleDateString() : "unknown date";
    return `- "${email.subject}" (${sentAt}, from ${email.from_address})${summary ? ` — ${summary}` : ""}`;
  });

  return (
    `Based on ${emails.length} matching email${emails.length > 1 ? "s" : ""}:\n\n${lines.join("\n")}\n\n` +
    "(Keyword-matched fallback — ANTHROPIC_API_KEY isn't configured, so this isn't a full RAG answer yet, " +
    "but the citations below are real rows from your database.)"
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequestBody;
  const { entitySlug, message } = body;
  let { sessionId } = body;

  if (!entitySlug || !message?.trim()) {
    return NextResponse.json({ error: "entitySlug and message are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: entity } = await supabase
    .from("entities")
    .select("id")
    .eq("slug", entitySlug)
    .maybeSingle();
  if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

  if (!sessionId) {
    const { data: session, error } = await supabase
      .from("chat_sessions")
      .insert({ entity_id: entity.id, user_id: user.id, title: message.slice(0, 80) })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    sessionId = session.id;
  }

  await supabase.from("chat_messages").insert({ session_id: sessionId, role: "user", content: message });

  const relevantEmails = await findRelevantEmails(supabase, entity.id, message);
  const citedEmailIds = relevantEmails.map((e) => e.id as string);

  let answer: string;
  if (process.env.ANTHROPIC_API_KEY) {
    const context = relevantEmails
      .map((e) => `Subject: ${e.subject}\nFrom: ${e.from_address}\nDate: ${e.sent_at}`)
      .join("\n\n");
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
        system:
          "You are a business intelligence assistant for SupplyX Inc. Answer only from the provided " +
          "email context. Be specific: cite dates, names, amounts. If you lack information, say so.",
        messages: [{ role: "user", content: `Email context:\n${context}\n\nQuestion: ${message}` }],
      }),
    });
    if (anthropicResponse.ok) {
      const json = await anthropicResponse.json();
      answer = json.content?.[0]?.text ?? "No response generated.";
    } else {
      answer = buildFallbackAnswer(message, relevantEmails);
    }
  } else {
    answer = buildFallbackAnswer(message, relevantEmails);
  }

  await supabase
    .from("chat_messages")
    .insert({ session_id: sessionId, role: "assistant", content: answer, cited_email_ids: citedEmailIds });

  return NextResponse.json({
    sessionId,
    answer,
    citations: relevantEmails.map((e) => ({ id: e.id, subject: e.subject, sentAt: e.sent_at })),
  });
}
