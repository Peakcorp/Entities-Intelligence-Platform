import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEntityBySlug } from "@/lib/entities";
import { getClients, SATISFACTION_LABELS } from "@/lib/supplyx";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  satisfied: "default",
  neutral: "secondary",
  at_risk: "destructive",
  needs_immediate_attention: "destructive",
};

export default async function ClientsPage({ params }: PageProps<"/[entitySlug]/clients">) {
  const { entitySlug } = await params;
  const entity = await getEntityBySlug(entitySlug);
  if (!entity) return null;

  const clients = await getClients(entity.id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Client Directory</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Profiles, project history, and AI-derived satisfaction — with evidence, not guesses.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {clients.map((client) => {
          const totalValue = client.deals.reduce((sum, d) => sum + (d.deal_value ?? 0), 0);
          const assessment = client.client_satisfaction_assessments[0];

          return (
            <Link key={client.id} href={`/${entity.slug}/clients/${client.id}`}>
              <Card className="h-full transition-colors hover:border-neutral-400 dark:hover:border-neutral-600">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{client.company ?? client.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{client.name}</p>
                  </div>
                  {assessment && (
                    <Badge variant={STATUS_VARIANT[assessment.status] ?? "secondary"}>
                      {SATISFACTION_LABELS[assessment.status] ?? assessment.status}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>{client.deals.length} deals · {currency.format(totalValue)} total</p>
                  {assessment?.days_since_last_contact != null && (
                    <p>Last contact: {assessment.days_since_last_contact} days ago</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
