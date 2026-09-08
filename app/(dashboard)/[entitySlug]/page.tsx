import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEntityBySlug } from "@/lib/entities";
import { getExecutiveOverview } from "@/lib/supplyx";
import { PipelineFunnelChart } from "@/components/charts/pipeline-funnel-chart";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default async function EntityOverviewPage({
  params,
}: PageProps<"/[entitySlug]">) {
  const { entitySlug } = await params;
  const entity = await getEntityBySlug(entitySlug);

  if (!entity) return null;

  if (entity.status === "placeholder") {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-md text-center">
          <p className="text-sm font-medium text-muted-foreground">{entity.name}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Coming soon</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This dashboard hasn&apos;t been built yet. Need it sooner? Let us know.
          </p>
          <Link
            href={`/${entity.slug}/request`}
            className="mt-6 inline-block text-sm font-medium underline underline-offset-4"
          >
            Request this dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { pipelineValue, activeDeals, funnelCounts, atRiskClients, urgentEmails } =
    await getExecutiveOverview(entity.id);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{entity.name} Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Executive summary across the procurement pipeline.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active deals</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{activeDeals}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline value</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{currency.format(pipelineValue)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">At-risk clients</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{atRiskClients.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Urgent emails (≥8)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{urgentEmails.length}</CardContent>
        </Card>
      </div>

      {atRiskClients.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
              <AlertTriangle className="size-4" />
              Clients needing attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {atRiskClients.map((row) => (
              <Link
                key={row.client_id}
                href={`/${entity.slug}/clients/${row.client_id}`}
                className="flex items-center justify-between rounded-md border border-red-200 bg-white px-3 py-2 text-sm hover:border-red-300 dark:border-red-900/50 dark:bg-neutral-900"
              >
                <span className="font-medium">{row.clients?.name}</span>
                <Badge variant="destructive">
                  {row.status === "needs_immediate_attention" ? "Needs Immediate Attention" : "At Risk"}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Process pipeline funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineFunnelChart data={funnelCounts} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Urgency flags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {urgentEmails.length === 0 && (
            <p className="text-sm text-muted-foreground">No urgent emails right now.</p>
          )}
          {urgentEmails.map((email) => (
            <div
              key={email.id}
              className="flex items-start justify-between gap-4 rounded-md border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{email.subject}</p>
                <p className="text-muted-foreground">{email.email_analyses?.summary}</p>
              </div>
              <Badge variant="destructive" className="shrink-0">
                {email.email_analyses?.urgency_score}/10
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
