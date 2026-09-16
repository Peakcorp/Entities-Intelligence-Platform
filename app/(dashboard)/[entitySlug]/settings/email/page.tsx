import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SyncEmailButton } from "@/components/sync-email-button";
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
  searchParams,
}: PageProps<"/[entitySlug]/settings/email">) {
  const { entitySlug } = await params;
  const { error, connected } = await searchParams;
  const entity = await getEntityBySlug(entitySlug);
  if (!entity) return null;

  const supabase = await createClient();
  const { data: connections } = await supabase
    .from("email_connections")
    .select("id, email_address, provider, sync_status, last_synced_at")
    .eq("entity_id", entity.id);

  const microsoftConfigured = Boolean(
    process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET && process.env.MICROSOFT_TENANT_ID,
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Email connections</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect the mailboxes that should feed this entity&apos;s intelligence pipeline.
        Every email is synced incrementally and never deleted, even if removed at the
        source.
      </p>

      {typeof error === "string" && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Connection failed: {error}
        </div>
      )}
      {typeof connected === "string" && (
        <div className="mt-4 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          Connected {connected}. Click &quot;Sync now&quot; below to pull its recent emails.
        </div>
      )}

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
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[connection.sync_status] ?? "secondary"}>
                  {connection.sync_status}
                </Badge>
                <SyncEmailButton connectionId={connection.id} />
              </div>
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
            Microsoft 365 is the primary provider; Gmail support is not built yet. See{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/EMAIL_SETUP.md</code>{" "}
            for the Azure app registration steps required before this button will work.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          {microsoftConfigured ? (
            <Button render={<a href={`/api/auth/microsoft/start?entitySlug=${entity.slug}`} />}>
              Connect Microsoft 365
            </Button>
          ) : (
            <Button disabled title="MICROSOFT_CLIENT_ID/SECRET/TENANT_ID aren't set yet">
              Connect Microsoft 365
            </Button>
          )}
          <Button variant="outline" disabled>
            Connect Gmail
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
