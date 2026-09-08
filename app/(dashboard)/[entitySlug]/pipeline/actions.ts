"use server";

import { revalidatePath } from "next/cache";
import { updateDealStage, type PipelineStage } from "@/lib/supplyx";

export async function changeDealStage(dealId: string, stage: PipelineStage, entitySlug: string) {
  await updateDealStage(dealId, stage);
  revalidatePath(`/${entitySlug}/pipeline`);
  revalidatePath(`/${entitySlug}`);
}
