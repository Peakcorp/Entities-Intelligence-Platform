import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScorecardRadarChart } from "@/components/charts/scorecard-radar-chart";
import { ScorecardOverrideDialog } from "@/components/scorecard-override-dialog";
import { getEntityBySlug } from "@/lib/entities";
import { getManufacturers } from "@/lib/supplyx";

export default async function ManufacturersPage({
  params,
}: PageProps<"/[entitySlug]/manufacturers">) {
  const { entitySlug } = await params;
  const entity = await getEntityBySlug(entitySlug);
  if (!entity) return null;

  const manufacturers = await getManufacturers(entity.id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Manufacturer Intelligence Center</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        AI scores update nightly from the last 90 days of emails. Manual overrides always win.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {manufacturers.map((mfg) => {
          const scorecard = mfg.manufacturer_scorecards[0];
          const isManual =
            scorecard &&
            (scorecard.manual_responsiveness != null ||
              scorecard.manual_quality != null ||
              scorecard.manual_price != null ||
              scorecard.manual_reliability != null);

          return (
            <Card key={mfg.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{mfg.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {mfg.country}
                    {mfg.region ? ` · ${mfg.region}` : ""}
                  </p>
                </div>
                <Badge variant={isManual ? "default" : "secondary"}>
                  {isManual ? "Team Verified" : "AI Scored"}
                </Badge>
              </CardHeader>
              <CardContent>
                {scorecard ? (
                  <>
                    <ScorecardRadarChart
                      responsiveness={scorecard.display_responsiveness}
                      quality={scorecard.display_quality}
                      price={scorecard.display_price}
                      reliability={scorecard.display_reliability}
                    />
                    {scorecard.flagged_issues && scorecard.flagged_issues.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {scorecard.flagged_issues.map((issue) => (
                          <Badge key={issue} variant="destructive">
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {scorecard.team_notes && (
                      <p className="mt-2 text-sm text-muted-foreground">{scorecard.team_notes}</p>
                    )}
                    <div className="mt-3 flex justify-end">
                      <ScorecardOverrideDialog
                        scorecardId={scorecard.id}
                        entityId={entity.id}
                        entitySlug={entity.slug}
                        manufacturerName={mfg.name}
                        current={{
                          manual_responsiveness: scorecard.manual_responsiveness,
                          manual_quality: scorecard.manual_quality,
                          manual_price: scorecard.manual_price,
                          manual_reliability: scorecard.manual_reliability,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No scorecard yet.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
