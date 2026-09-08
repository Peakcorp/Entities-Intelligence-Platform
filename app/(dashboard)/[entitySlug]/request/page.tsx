"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function RequestDashboardPage({
  params,
}: PageProps<"/[entitySlug]/request">) {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");

    const { entitySlug } = await params;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: entity } = await supabase
      .from("entities")
      .select("id")
      .eq("slug", entitySlug)
      .maybeSingle();

    if (entity) {
      await supabase.from("activity_log").insert({
        entity_id: entity.id,
        user_id: user?.id ?? null,
        action: "dashboard_requested",
        target_table: "entities",
        target_id: entity.id,
        note,
      });
    }

    setStatus("sent");
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Need this dashboard sooner?</CardTitle>
          <CardDescription>Tell us why and we&apos;ll prioritize it.</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "sent" ? (
            <p className="text-sm text-muted-foreground">Request received — thank you.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note">What do you need it for?</Label>
                <textarea
                  id="note"
                  required
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button type="submit" className="w-full" disabled={status === "sending"}>
                Submit request
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
