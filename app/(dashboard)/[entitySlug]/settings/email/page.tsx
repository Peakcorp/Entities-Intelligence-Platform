import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getEntityBySlug } from "@/lib/entities";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  ok: "default",
  syncing: "secondary",
  pending: "secondary",
  error: "destructive",
};

export default async function EmailSettingsPage({
  params,
}: PageProps<"/[entitySlug]/settings/email">) {
  const { entitySlug } = await params;
  const entity = await getEntityBySlug(entitySlug);
  if (!entity) return null;

  const supabase = await createClient();
  const { data: connections } = await supabase
    .from("email_connections")
    .select("id, email_address, provider, sync_status, last_synced_at")
    .eq("entity_id", entity.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Email connections</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect the mailboxes that should feed this entity&apos;s intelligence pipeline.
        Every email is synced incrementally and never deleted, even if removed at the
        source.
      </p>

      <div className="mt-6 space-y-3">
        {(connections ?? []).map((connection) => (
          <Card key={connection.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">{connection.email_address}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {connection.provider}
                  {connection.last_synced_at &&
                    ` · last synced ${new Date(connection.last_synced_at).toLocaleString()}`}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[connection.sync_status] ?? "secondary"}>
                {connection.sync_status}
              </Badge>
            </CardContent>
          </Card>
        ))}

        {(connections ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No mailboxes connected yet.</p>
        )}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Connect a mailbox</CardTitle>
          <CardDescription>
            Microsoft 365 is the primary provider; Gmail is available as a fallback for
            non-Microsoft accounts. See{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              docs/EMAIL_SETUP.md
            </code>{" "}
            for the Azure app registration steps required before this button will work.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button disabled>Connect Microsoft 365</Button>
          <Button variant="outline" disabled>
            Connect Gmail
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
