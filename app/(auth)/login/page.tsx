"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>PeakCorp Intelligence</CardTitle>
          <CardDescription>
            Sign in with the email address your entity administrator invited you with.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "sent" ? (
            <p className="text-sm text-muted-foreground">
              Check {email} for a sign-in link.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@supplyx.io"
                />
              </div>
              <Button type="submit" className="w-full" disabled={status === "sending"}>
                {status === "sending" ? "Sending link…" : "Send sign-in link"}
              </Button>
              {status === "error" && (
                <p className="text-sm text-destructive">
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
