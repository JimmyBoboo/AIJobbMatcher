"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowLeft, FileDown, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCvPdf } from "@/lib/cv-to-pdf";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CVData } from "@/lib/schemas/cv";

export function CvBuilderClient() {
  const [input, setInput] = useState("");
  const [finishError, setFinishError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [savedCvData, setSavedCvData] = useState<CVData | null>(null);

  const { messages, sendMessage, status, error: chatError } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/cv-builder/chat",
      credentials: "include",
    }),
  });

  const initialAskSent = useRef(false);
  useEffect(() => {
    if (initialAskSent.current || messages.length > 0 || status !== "ready") return;
    initialAskSent.current = true;
    sendMessage({ text: "Hei, jeg vil gjerne lage en CV." });
  }, [messages.length, status, sendMessage]);

  const assistantCount = messages.filter((m) => m.role === "assistant").length;
  const canFinish = assistantCount >= 2;
  const isBusy = status === "submitted" || status === "streaming" || isFinishing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isBusy) return;
    sendMessage({ text: trimmed });
    setInput("");
    setFinishError(null);
  };

  const handleFinishAndSave = async () => {
    if (!canFinish || isBusy) return;
    setFinishError(null);
    setIsFinishing(true);
    try {
      const extractRes = await fetch("/api/cv-builder/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages }),
      });
      if (!extractRes.ok) {
        const err = await extractRes.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "Kunne ikke lage CV fra samtalen"
        );
      }
      const { cvData } = (await extractRes.json()) as { cvData: CVData };

      const saveRes = await fetch("/api/cv/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cvData }),
      });
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "Kunne ikke lagre CV"
        );
      }
      setSavedCvData(cvData);
    } catch (e) {
      setFinishError(
        e instanceof Error ? e.message : "Noe gikk galt. Prøv igjen."
      );
    } finally {
      setIsFinishing(false);
    }
  };

  if (savedCvData) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tilbake til dashboard
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              CV er lagret
            </CardTitle>
            <CardDescription>
              CV-en din er lagret. Last ned som PDF eller gå til dashboard for
              å se stillingsmatcher.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={() => downloadCvPdf(savedCvData)}
              className="w-full gap-2"
            >
              <FileDown className="h-4 w-4" />
              Last ned som PDF
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">Gå til dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tilbake til dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Lag egen CV med AI
          </CardTitle>
          <CardDescription>
            Svær på spørsmålene under. AI hjelper deg med å fylle ut erfaring,
            utdanning og ferdigheter. Når du er klar, klikk «Fullfør og lagre
            CV».
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {chatError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {chatError.message}
            </p>
          )}

          <div className="flex max-h-[400px] flex-col gap-3 overflow-y-auto rounded-lg border bg-muted/30 p-3">
            {messages.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                AI stiller første spørsmål nå…
              </p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" && (
                    <span className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3" /> AI
                    </span>
                  )}
                  <div className="whitespace-pre-wrap">
                    {message.parts.map((part, i) =>
                      part.type === "text" ? (
                        <span key={`${message.id}-${i}`}>{part.text}</span>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv svaret ditt her..."
              disabled={isBusy}
              className="flex-1"
            />
            <Button type="submit" disabled={isBusy} size="icon">
              {(status === "submitted" || status === "streaming") && !isFinishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {canFinish && (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleFinishAndSave}
                disabled={isBusy}
                className="w-full"
              >
                {isFinishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Lagrer CV...
                  </>
                ) : (
                  "Fullfør og lagre CV"
                )}
              </Button>
              {finishError && (
                <p className="text-center text-sm text-destructive">
                  {finishError}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
