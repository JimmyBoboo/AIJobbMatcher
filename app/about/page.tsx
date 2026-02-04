import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <main className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Om oss
        </h1>

        <div className="mt-6 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">AI Jobb Matcher</CardTitle>
              <CardDescription>
                Finn stillinger som passer deg – raskere og enklere
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                AI Jobb Matcher hjelper deg med å finne relevante stillinger
                ut fra CV-en din. Last opp CV én gang, og få en oversikt over
                stillinger som matcher din erfaring, ferdigheter og
                utdanning.
              </p>
              <p>
                Vi bruker stillingsdata fra offentlige kilder og matcher dem
                mot profilen din, slik at du kan fokusere på de treffene som
                betyr mest.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Slik fungerer det</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">1. Last opp CV</strong> –
                Last opp CV-en din (PDF eller DOCX) på dashboard.
              </p>
              <p>
                <strong className="text-foreground">2. Se relevante stillinger</strong> –
                På dashboard får du stillinger som passer profilen din. Du kan
                også bla og søke blant alle stillinger under Stillinger.
              </p>
              <p>
                <strong className="text-foreground">3. Søk på stillingen</strong> –
                Klikk «Se stilling» for å gå til arbeidsgiver eller NAV
                Arbeidsplassen og søke.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Kontakt</CardTitle>
              <CardDescription>
                Spørsmål eller tilbakemeldinger
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Har du forslag eller ønsker å komme i kontakt? Send gjerne en
                e-post eller bruk kontaktmulighetene som legges ut her.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
