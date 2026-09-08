"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Citation = { id: string; subject: string; sentAt: string | null };
type Message = { role: "user" | "assistant"; content: string; citations?: Citation[] };

export function ChatPanel({ entitySlug }: { entitySlug: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);

  async function send() {
    const message = input.trim();
    if (!message || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entitySlug, sessionId, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data.sessionId);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer, citations: data.citations },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error ?? "something went wrong"}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error — please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            size="icon"
            className="fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg"
            aria-label="Open AI chat"
          />
        }
      >
        <MessageCircle className="size-5" />
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>AI Chat</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ask about clients, manufacturers, orders, or anything in the synced emails.
              Every answer cites which emails were used.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800",
                )}
              >
                {m.content}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-neutral-300/50 pt-2 dark:border-neutral-600/50">
                    {m.citations.map((c) => (
                      <p key={c.id} className="text-xs text-muted-foreground">
                        📎 {c.subject}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && <p className="text-sm text-muted-foreground">Thinking…</p>}
        </div>

        <div className="flex items-center gap-2 border-t p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask a question…"
            className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="icon" onClick={send} disabled={sending} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
