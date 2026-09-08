"use server";

import { revalidatePath } from "next/cache";
import { overrideScorecard } from "@/lib/supplyx";

export async function submitScorecardOverride(formData: FormData) {
  const scorecardId = String(formData.get("scorecardId"));
  const entityId = String(formData.get("entityId"));
  const entitySlug = String(formData.get("entitySlug"));
  const note = String(formData.get("note") ?? "");

  const parse = (key: string) => {
    const raw = formData.get(key);
    if (raw === null || raw === "") return null;
    return Number(raw);
  };

  await overrideScorecard(
    scorecardId,
    {
      manual_responsiveness: parse("manual_responsiveness"),
      manual_quality: parse("manual_quality"),
      manual_price: parse("manual_price"),
      manual_reliability: parse("manual_reliability"),
    },
    note,
    entityId,
  );

  revalidatePath(`/${entitySlug}/manufacturers`);
}
