"use client";

import { useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PIPELINE_STAGES, STAGE_LABELS, type Deal, type PipelineStage } from "@/lib/supplyx-constants";
import { changeDealStage } from "@/app/(dashboard)/[entitySlug]/pipeline/actions";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function DealCard({ deal, entitySlug }: { deal: Deal; entitySlug: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className={isPending ? "opacity-60" : undefined}>
      <CardContent className="space-y-2 p-3">
        <p className="text-sm font-medium leading-tight">{deal.clients?.company ?? deal.clients?.name}</p>
        {deal.deal_value != null && (
          <p className="text-sm text-muted-foreground">{currency.format(deal.deal_value)}</p>
        )}
        {deal.expected_close_date && (
          <p className="text-xs text-muted-foreground">
            Close: {new Date(deal.expected_close_date).toLocaleDateString()}
          </p>
        )}
        <Select
          value={deal.stage}
          onValueChange={(value) =>
            startTransition(() => changeDealStage(deal.id, value as PipelineStage, entitySlug))
          }
        >
          <SelectTrigger size="sm" className="w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
