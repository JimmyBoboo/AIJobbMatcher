import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthCta } from "@/components/auth-cta";
import { Footer } from "@/components/footer";
import { FileUp, Sparkles, ListOrdered, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 shadow-sm backdrop-blur-md">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-light/60 to-transparent" />
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
          <span className="bg-gradient-to-r from-primary via-ai to-brand-dark bg-clip-text text-lg font-bold text-transparent dark:from-brand-light dark:via-ai-light dark:to-primary">
            AI Jobb Matcher
          </span>
          <Button asChild size="sm" className="shadow-sm">
            <Link href="/login">Logg inn</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-20">
        {/* Hero */}
        <section className="relative flex flex-col items-center gap-8 overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-sm sm:px-10 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgb(37_99_235_/_0.14),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_50%,rgb(124_58_237_/_0.1),transparent_50%),radial-gradient(ellipse_50%_40%_at_0%_80%,rgb(96_165_250_/_0.12),transparent_45%)]"
            aria-hidden
          />
          <div className="relative flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge variant="ai">Smart match</Badge>
              <Badge variant="success">AI-anbefalt</Badge>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Finn relevante stillinger med{" "}
              <span className="bg-gradient-to-r from-primary to-ai bg-clip-text text-transparent">
                AI
              </span>
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Last opp CV-en din én gang. Få en rangert liste over stillinger som
              matcher erfaring, ferdigheter og preferanser – uten manuelt søk og
              irrelevante treff.
            </p>
            <AuthCta />
          </div>
        </section>

        {/* Features */}
        <section className="mt-24">
          <h2 className="sr-only">Slik fungerer det</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <FileUp className="size-5" />
                </div>
                <CardTitle>Last opp CV</CardTitle>
                <CardDescription>
                  Støtte for PDF og DOCX. Last opp én gang i appen.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-ai/20 to-ai-light/25 text-ai">
                  <Sparkles className="size-5" />
                </div>
                <CardTitle>AI analyserer og matcher</CardTitle>
                <CardDescription>
                  CV-en struktureres og matches mot stillingsannonser i
                  databasen.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 via-ai/10 to-brand-light/20 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <CardTitle>Lag en egen CV med AI</CardTitle>
                <CardDescription>
                  Bygg CV-en din steg for steg med hjelp fra AI. Fyll inn
                  erfaring, utdanning og ferdigheter, og AI hjelper deg med å
                  fylle ut det som mangler.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-ai/10 text-ai">
                  <MessageSquare className="size-5" />
                </div>
                <CardTitle>Hvorfor matchet det?</CardTitle>
                <CardDescription>
                  For hvert treff får du en forklaring på hvorfor stillingen
                  passer.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="sm:col-span-2 transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start gap-4 sm:gap-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                  <ListOrdered className="size-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <CardTitle>Rangert oversikt</CardTitle>
                  <CardDescription>
                    Se de beste treffene først i en oversiktlig liste.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
