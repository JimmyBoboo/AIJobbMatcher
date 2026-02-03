import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthCta } from "@/components/auth-cta";
import { FileUp, Sparkles, ListOrdered, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        {/* Hero */}
        <section className="flex flex-col items-center gap-8 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Finn relevante stillinger med AI
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Last opp CV-en din én gang. Få en rangert liste over stillinger som
            matcher erfaring, ferdigheter og preferanser – uten manuelt søk og
            irrelevante treff.
          </p>
          <AuthCta />
        </section>

        {/* Features */}
        <section className="mt-24">
          <h2 className="sr-only">Slik fungerer det</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileUp className="size-5" />
                </div>
                <CardTitle>Last opp CV</CardTitle>
                <CardDescription>
                  Støtte for PDF og DOCX. Last opp én gang i appen.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <CardTitle>AI analyserer og matcher</CardTitle>
                <CardDescription>
                  CV-en struktureres og matches mot stillingsannonser i
                  databasen.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ListOrdered className="size-5" />
                </div>
                <CardTitle>Rangert oversikt</CardTitle>
                <CardDescription>
                  Se de beste treffene først i en oversiktlig liste.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessageSquare className="size-5" />
                </div>
                <CardTitle>Hvorfor matchet det?</CardTitle>
                <CardDescription>
                  For hvert treff får du en forklaring på hvorfor stillingen
                  passer.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
