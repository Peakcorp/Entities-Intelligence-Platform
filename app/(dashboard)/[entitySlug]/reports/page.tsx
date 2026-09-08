import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEntityBySlug } from "@/lib/entities";

export default async function ReportsPage({ params }: PageProps<"/[entitySlug]/reports">) {
  const { entitySlug } = await params;
  const entity = await getEntityBySlug(entitySlug);
  if (!entity) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Process Intelligence Report</h1>
        <Badge variant="secondary">Example</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Generated weekly from email + pipeline data (Phase 2). This is a mock of the format so you can
        judge the layout — the real report isn&apos;t wired up yet.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Week of Sept 1–7, 2026</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <section>
            <h3 className="mb-1 font-medium">Employee performance</h3>
            <p className="text-muted-foreground">
              Michael closed 2 deals this week (Sunrise Hospitality fixtures + drapery), averaging a
              4-hour first-response time. Lee&apos;s response time on the Harbor View complaint thread
              slipped to 2 days between follow-ups — flagged below as a bottleneck.
            </p>
          </section>
          <section>
            <h3 className="mb-1 font-medium">Bottlenecks</h3>
            <p className="text-muted-foreground">
              The Harbor View Development complaint (incorrect tile specification) has been open for 9
              days with two unanswered follow-ups. This is the single largest risk to client retention
              this week.
            </p>
          </section>
          <section>
            <h3 className="mb-1 font-medium">Manufacturer issues</h3>
            <p className="text-muted-foreground">
              Anatolia Textiles Group has had two damaged shipments this quarter — worth monitoring
              before the next large order. Milano Marble Works remains slow to quote despite high
              quality scores.
            </p>
          </section>
          <section>
            <h3 className="mb-1 font-medium">Best-practice gap analysis</h3>
            <p className="text-muted-foreground">
              Complaint threads without a second follow-up within 48 hours correlate strongly with
              declining satisfaction scores. Consider an internal SLA: any unresolved complaint gets
              escalated to a manager automatically after 5 days.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
