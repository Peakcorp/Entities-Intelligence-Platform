import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEntityBySlug } from "@/lib/entities";

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

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{entity.name} Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The full Executive Overview (KPI tiles, pipeline funnel, activity heatmap, urgency
        flags) ships in Phase 3, once email ingestion and AI processing are live.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Get started</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect an email account under Settings to begin ingesting SupplyX
            communications.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
