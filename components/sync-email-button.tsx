"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SyncEmailButton({ connectionId }: { connectionId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "syncing" | "error">("idle");

  async function sync() {
    setStatus("syncing");
    try {
      const res = await fetch("/api/sync/emails", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      if (!res.ok) throw new Error();
      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={sync} disabled={status === "syncing"}>
      {status === "syncing" ? "Syncing…" : status === "error" ? "Failed — retry" : "Sync now"}
    </Button>
  );
}
