import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberRoleSelect } from "@/components/member-role-select";
import { createClient } from "@/lib/supabase/server";
import { getEntityBySlug } from "@/lib/entities";
import { getEntityMembers } from "@/lib/team";
import { submitInvite, submitRemove } from "./actions";

export default async function TeamSettingsPage({
  params,
}: PageProps<"/[entitySlug]/settings/users">) {
  const { entitySlug } = await params;
  const entity = await getEntityBySlug(entitySlug);
  if (!entity) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_owner")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (!profile?.is_owner) {
    redirect(`/${entity.slug}`);
  }

  const members = await getEntityMembers(entity.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Invite-only access. Only people you add here can sign in and see {entity.name}&apos;s
        data — anyone else who tries the sign-in page is rejected before an email is even sent.
      </p>

      <div className="mt-6 space-y-3">
        {members.map((member) => (
          <div
            key={member.membershipId}
            className="flex items-center justify-between gap-3 rounded-md border bg-white px-4 py-3 dark:bg-neutral-900"
          >
            <span className="text-sm font-medium">{member.email ?? member.userId}</span>
            <div className="flex items-center gap-2">
              <MemberRoleSelect
                entityId={entity.id}
                entitySlug={entity.slug}
                membershipId={member.membershipId}
                role={member.role}
              />
              <form action={submitRemove}>
                <input type="hidden" name="entityId" value={entity.id} />
                <input type="hidden" name="entitySlug" value={entity.slug} />
                <input type="hidden" name="membershipId" value={member.membershipId} />
                <Button type="submit" variant="ghost" size="sm">
                  Remove
                </Button>
              </form>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-sm text-muted-foreground">No team members yet.</p>
        )}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Invite someone</CardTitle>
          <CardDescription>
            They&apos;ll get an email invite. Once they accept, they can sign in with a magic
            link — no password needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitInvite} className="flex items-end gap-3">
            <input type="hidden" name="entityId" value={entity.id} />
            <input type="hidden" name="entitySlug" value={entity.slug} />
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="name@supplyx.io" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select name="role" defaultValue="employee">
                <SelectTrigger id="role" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="it_admin">IT Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Send invite</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
