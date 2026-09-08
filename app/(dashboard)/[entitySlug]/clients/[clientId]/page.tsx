import { notFound } from "next/navigation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEntityBySlug } from "@/lib/entities";
import { getClientDetail, SATISFACTION_LABELS, STAGE_LABELS, type PipelineStage } from "@/lib/supplyx";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  satisfied: "default",
  neutral: "secondary",
  at_risk: "destructive",
  needs_immediate_attention: "destructive",
};

const TREND_ICON = { improving: TrendingUp, declining: TrendingDown, stable: Minus };

export default async function ClientDetailPage({
  params,
}: PageProps<"/[entitySlug]/clients/[clientId]">) {
  const { entitySlug, clientId } = await params;
  const entity = await getEntityBySlug(entitySlug);
  if (!entity) return null;

  const { client, assessments, deals, emails } = await getClientDetail(entity.id, clientId);
  if (!client) notFound();

  const latest = assessments[0];
  const TrendIcon = latest?.trend ? TREND_ICON[latest.trend as keyof typeof TREND_ICON] : null;
  const openIssuesCount = Array.isArray(latest?.open_issues) ? latest.open_issues.length : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{client.company ?? client.name}</h1>
          <p className="text-sm text-muted-foreground">{client.name}</p>
        </div>
        {latest && (
          <Badge variant={STATUS_VARIANT[latest.status] ?? "secondary"} className="text-sm">
            {SATISFACTION_LABELS[latest.status] ?? latest.status}
          </Badge>
        )}
      </div>

      {latest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Satisfaction assessment
              {TrendIcon && <TrendIcon className="size-4 text-muted-foreground" />}
              <span className="text-sm font-normal text-muted-foreground">{latest.trend}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{latest.narrative}</p>

            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="font-medium">{latest.score}/10</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Days since contact</p>
                <p className="font-medium">{latest.days_since_last_contact}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Open issues</p>
                <p className="font-medium">{openIssuesCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="font-medium">{Math.round((latest.confidence ?? 0) * 100)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.isArray(latest.positive_signals) && latest.positive_signals.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Positive signals</p>
                  <ul className="space-y-1 text-sm">
                    {(latest.positive_signals as string[]).map((s) => (
                      <li key={s}>+ {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(latest.negative_signals) && latest.negative_signals.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Negative signals</p>
                  <ul className="space-y-1 text-sm">
                    {(latest.negative_signals as string[]).map((s) => (
                      <li key={s}>− {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-md border px-3 py-2 text-sm">
              <span className="font-medium">Recommended action: </span>
              {latest.recommended_action}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {deals.map((deal) => (
            <div key={deal.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>{STAGE_LABELS[deal.stage as PipelineStage] ?? deal.stage}</span>
              <span className="text-muted-foreground">
                {deal.deal_value != null ? currency.format(deal.deal_value) : "—"}
              </span>
            </div>
          ))}
          {deals.length === 0 && <p className="text-sm text-muted-foreground">No deals yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent emails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {emails
            .filter((e) => client.contact_emails?.includes(e.from_address ?? ""))
            .map((email) => (
              <div key={email.id} className="rounded-md border px-3 py-2 text-sm">
                <p className="font-medium">{email.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {email.sent_at ? new Date(email.sent_at).toLocaleDateString() : ""}
                </p>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
