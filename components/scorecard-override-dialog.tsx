"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitScorecardOverride } from "@/app/(dashboard)/[entitySlug]/manufacturers/actions";

type Props = {
  scorecardId: string;
  entityId: string;
  entitySlug: string;
  manufacturerName: string;
  current: {
    manual_responsiveness: number | null;
    manual_quality: number | null;
    manual_price: number | null;
    manual_reliability: number | null;
  };
};

export function ScorecardOverrideDialog({ scorecardId, entityId, entitySlug, manufacturerName, current }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Override</DialogTrigger>
      <DialogContent>
        <form
          action={async (formData) => {
            await submitScorecardOverride(formData);
            setOpen(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Override {manufacturerName}&apos;s scorecard</DialogTitle>
            <DialogDescription>
              Manual scores always win over AI scores. This change is logged to the audit trail.
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="scorecardId" value={scorecardId} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="entitySlug" value={entitySlug} />

          <div className="grid grid-cols-2 gap-4 py-4">
            {(
              [
                ["manual_responsiveness", "Responsiveness"],
                ["manual_quality", "Quality"],
                ["manual_price", "Price"],
                ["manual_reliability", "Reliability"],
              ] as const
            ).map(([field, label]) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={field}>{label}</Label>
                <Input
                  id={field}
                  name={field}
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  defaultValue={current[field] ?? undefined}
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note (required — why are you overriding?)</Label>
            <Input id="note" name="note" required placeholder="e.g. New account rep has been excellent…" />
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit">Save override</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
