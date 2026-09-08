import { DealCard } from "@/components/deal-card";
import { getEntityBySlug } from "@/lib/entities";
import { getDeals, PIPELINE_STAGES, STAGE_LABELS } from "@/lib/supplyx";

export default async function PipelinePage({ params }: PageProps<"/[entitySlug]/pipeline">) {
  const { entitySlug } = await params;
  const entity = await getEntityBySlug(entitySlug);
  if (!entity) return null;

  const deals = await getDeals(entity.id);

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Process Pipeline</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        AI sets the initial stage from email signals; your team can override it any time.
      </p>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage);
          return (
            <div key={stage} className="w-64 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-medium">{STAGE_LABELS[stage]}</h2>
                <span className="text-xs text-muted-foreground">{stageDeals.length}</span>
              </div>
              <div className="space-y-2">
                {stageDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} entitySlug={entity.slug} />
                ))}
                {stageDeals.length === 0 && (
                  <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                    Empty
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
