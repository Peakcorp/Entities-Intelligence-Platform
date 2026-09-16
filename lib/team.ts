import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type MembershipRole = "manager" | "employee" | "it_admin";

export type EntityMember = {
  membershipId: string;
  userId: string;
  email: string | null;
  role: MembershipRole;
  createdAt: string;
};

async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_owner")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_owner) throw new Error("Only owners can manage team members");
  return user;
}

export async function getEntityMembers(entityId: string): Promise<EntityMember[]> {
  await requireOwner();
  const service = createServiceRoleClient();

  const { data: memberships, error } = await service
    .from("entity_memberships")
    .select("id, user_id, role, created_at")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!memberships || memberships.length === 0) return [];

  // The Admin API doesn't support "get users by id list" directly, so fetch a page and
  // filter — fine at this scale (dozens of users, not thousands).
  const { data: userList } = await service.auth.admin.listUsers({ perPage: 200 });
  const emailById = new Map((userList?.users ?? []).map((u) => [u.id, u.email ?? null]));

  return memberships.map((m) => ({
    membershipId: m.id,
    userId: m.user_id,
    email: emailById.get(m.user_id) ?? null,
    role: m.role as MembershipRole,
    createdAt: m.created_at,
  }));
}

export async function inviteMember(entityId: string, email: string, role: MembershipRole) {
  const owner = await requireOwner();
  const service = createServiceRoleClient();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: invited, error: inviteError } = await service.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${siteUrl}/auth/callback` },
  );

  let userId: string;
  if (inviteError) {
    const alreadyExists = /already been registered|already exists/i.test(inviteError.message);
    if (!alreadyExists) throw inviteError;

    const { data: userList } = await service.auth.admin.listUsers({ perPage: 200 });
    const existing = userList?.users.find((u) => u.email === email);
    if (!existing) throw inviteError;
    userId = existing.id;
  } else {
    userId = invited.user.id;
  }

  const { error: membershipError } = await service
    .from("entity_memberships")
    .upsert({ entity_id: entityId, user_id: userId, role }, { onConflict: "entity_id,user_id" });
  if (membershipError) throw membershipError;

  await service.from("activity_log").insert({
    entity_id: entityId,
    user_id: owner.id,
    action: "member_invited",
    target_table: "entity_memberships",
    target_id: userId,
    after_value: { email, role },
    note: null,
  });
}

export async function updateMemberRole(entityId: string, membershipId: string, role: MembershipRole) {
  await requireOwner();
  const service = createServiceRoleClient();
  const { error } = await service
    .from("entity_memberships")
    .update({ role })
    .eq("id", membershipId)
    .eq("entity_id", entityId);
  if (error) throw error;
}

export async function removeMember(entityId: string, membershipId: string) {
  const owner = await requireOwner();
  const service = createServiceRoleClient();

  const { data: membership } = await service
    .from("entity_memberships")
    .select("user_id")
    .eq("id", membershipId)
    .eq("entity_id", entityId)
    .maybeSingle();

  const { error } = await service
    .from("entity_memberships")
    .delete()
    .eq("id", membershipId)
    .eq("entity_id", entityId);
  if (error) throw error;

  await service.from("activity_log").insert({
    entity_id: entityId,
    user_id: owner.id,
    action: "member_removed",
    target_table: "entity_memberships",
    target_id: membership?.user_id ?? null,
    note: null,
  });
}
