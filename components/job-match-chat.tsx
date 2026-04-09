"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type JobMatchSearchResult = {
  searchQuery: string;
  replyToUser?: string;
};

type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const WELCOME =
  "Hei! Skriv hva du leter etter, så tilpasser vi søket sammen med CV-en din. For eksempel: «Jeg ønsker stillinger innen IT i Oslo heltid» eller «Lede roller innen salg».";

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface JobMatchChatProps {
  disabled?: boolean;
  isLoading?: boolean;
  onSearch: (opts: { chatMessage?: string }) => Promise<JobMatchSearchResult>;
  className?: string;
}

export function JobMatchChat({
  disabled,
  isLoading,
  onSearch,
  className,
}: JobMatchChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const busy = Boolean(disabled || isLoading || sending);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const appendAssistant = useCallback((content: string) => {
    setMessages((m) => [...m, { id: makeId(), role: "assistant", content }]);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { id: makeId(), role: "user", content: text }]);
    setSending(true);
    try {
      const result = await onSearch({ chatMessage: text });
      const followUp =
        result.replyToUser?.trim() ||
        `Jeg søker etter stillinger som matcher «${result.searchQuery}».`;
      appendAssistant(followUp);
    } catch {
      appendAssistant(
        "Noe gikk galt. Prøv igjen om et øyeblikk, eller skriv ønsket ditt på en annen måte.",
      );
    } finally {
      setSending(false);
    }
  }, [appendAssistant, busy, input, onSearch]);

  const handleCvOnly = useCallback(async () => {
    if (busy) return;
    setSending(true);
    try {
      const result = await onSearch({});
      appendAssistant(
        result.replyToUser?.trim() ||
          `Her er treff basert på CV-en din (søk: «${result.searchQuery}»). Skriv gjerne i chatten hvis du vil snevre inn, for eksempel fylke eller bransje.`,
      );
    } catch {
      appendAssistant("Kunne ikke hente treff. Prøv igjen.");
    } finally {
      setSending(false);
    }
  }, [appendAssistant, busy, onSearch]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm",
        className,
      )}
    >
      <div className="border-b bg-muted/40 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          Chat med jobbsøk
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Beskriv ønsket ditt — vi bruker KI og Pinecone for å finne relevante
          stillinger.
        </p>
      </div>

      <div className="max-h-[min(320px,45vh)] min-h-[200px] space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2 text-sm",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            {msg.role === "assistant" && (
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10"
                aria-hidden
              >
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"
                aria-hidden
              >
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {(isLoading || sending) && (
          <div className="flex gap-2 text-xs text-muted-foreground">
            <Bot className="h-4 w-4 shrink-0 animate-pulse text-primary" />
            <span>Søker i stillingsdatabasen…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-2 border-t bg-muted/20 p-3">
        <Textarea
          placeholder="F.eks. Jeg ønsker stillinger innen IT…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          rows={2}
          className="min-h-[72px] resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          aria-label="Skriv hva slags stillinger du ønsker"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={busy || !input.trim()}
            onClick={() => void handleSend()}
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void handleCvOnly()}
          >
            Match kun fra CV
          </Button>
        </div>
      </div>
    </div>
  );
}
