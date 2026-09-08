import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getEntityBySlug } from "@/lib/entities";
import { searchEmails } from "@/lib/supplyx";

const SENTIMENT_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  positive: "default",
  neutral: "secondary",
  negative: "destructive",
};

export default async function EmailsPage({
  params,
  searchParams,
}: PageProps<"/[entitySlug]/emails">) {
  const { entitySlug } = await params;
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : undefined;

  const entity = await getEntityBySlug(entitySlug);
  if (!entity) return null;

  const emails = await searchEmails(entity.id, query);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Email Intelligence Browser</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Search in plain English. AI metadata (intent, stage, sentiment) is overlaid on every result.
      </p>

      <form className="mt-6" method="get">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search subject, body, or sender…"
          className="max-w-md"
        />
      </form>

      <div className="mt-6 space-y-3">
        {emails.length === 0 && (
          <p className="text-sm text-muted-foreground">No emails match that search.</p>
        )}
        {emails.map((email) => (
          <div key={email.id} className="rounded-lg border bg-white p-4 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{email.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {email.from_address} · {email.sent_at ? new Date(email.sent_at).toLocaleString() : ""}
                </p>
              </div>
              {email.email_analyses?.urgency_score != null && email.email_analyses.urgency_score >= 8 && (
                <Badge variant="destructive" className="shrink-0">
                  Urgency {email.email_analyses.urgency_score}/10
                </Badge>
              )}
            </div>

            {email.email_analyses?.summary && (
              <p className="mt-2 text-sm text-muted-foreground">{email.email_analyses.summary}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {email.email_analyses?.intent && <Badge variant="outline">{email.email_analyses.intent}</Badge>}
              {email.email_analyses?.pipeline_stage && (
                <Badge variant="outline">{email.email_analyses.pipeline_stage.replaceAll("_", " ")}</Badge>
              )}
              {email.email_analyses?.sentiment && (
                <Badge variant={SENTIMENT_VARIANT[email.email_analyses.sentiment] ?? "outline"}>
                  {email.email_analyses.sentiment}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
