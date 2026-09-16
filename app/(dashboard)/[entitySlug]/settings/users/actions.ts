"use server";

import { revalidatePath } from "next/cache";
import { inviteMember, removeMember, updateMemberRole, type MembershipRole } from "@/lib/team";

export async function submitInvite(formData: FormData) {
  const entityId = String(formData.get("entityId"));
  const entitySlug = String(formData.get("entitySlug"));
  const email = String(formData.get("email")).trim().toLowerCase();
  const role = String(formData.get("role")) as MembershipRole;

  await inviteMember(entityId, email, role);
  revalidatePath(`/${entitySlug}/settings/users`);
}

export async function changeRole(entityId: string, entitySlug: string, membershipId: string, role: MembershipRole) {
  await updateMemberRole(entityId, membershipId, role);
  revalidatePath(`/${entitySlug}/settings/users`);
}

export async function submitRemove(formData: FormData) {
  const entityId = String(formData.get("entityId"));
  const entitySlug = String(formData.get("entitySlug"));
  const membershipId = String(formData.get("membershipId"));

  await removeMember(entityId, membershipId);
  revalidatePath(`/${entitySlug}/settings/users`);
}
