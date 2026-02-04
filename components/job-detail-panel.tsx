"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { JobItem } from "@/lib/schemas/job-feed";

interface JobDetailPanelProps {
  job: JobItem | null;
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

export function JobDetailPanel({ job }: JobDetailPanelProps) {
  if (job === null) {
    return (
      <Card className="h-full min-h-[280px] flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground text-center px-4">
            Velg en stilling for å lese annonse
          </p>
        </CardContent>
      </Card>
    );
  }

  const entry = job._feed_entry;
  const oppdatertDato = entry.sistEndret
    ? new Date(entry.sistEndret).toLocaleDateString("nb-NO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const endretDato = job.date_modified
    ? new Date(job.date_modified).toLocaleDateString("nb-NO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 space-y-4 pb-4 border-b">
        <div className="flex gap-4 items-start">
          {entry.companyLogoUrl && (
            <div className="size-16 shrink-0 overflow-hidden rounded-xl border bg-muted">
              <img
                src={entry.companyLogoUrl}
                alt=""
                className="size-16 object-cover"
                width={64}
                height={64}
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl leading-tight">
              {entry.title}
            </CardTitle>
            {entry.businessName && (
              <CardDescription className="mt-1.5 text-base font-medium text-foreground/90">
                {entry.businessName}
              </CardDescription>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {entry.status === "ACTIVE" && (
            <Badge variant="default" className="font-normal">
              Aktiv stilling
            </Badge>
          )}
          {entry.municipal && (
            <Badge variant="secondary">{entry.municipal}</Badge>
          )}
        </div>

        <div className="flex flex-col gap-1 pt-1">
          {oppdatertDato && (
            <InfoRow label="Sist oppdatert" value={oppdatertDato} />
          )}
          {endretDato && endretDato !== oppdatertDato && (
            <InfoRow label="Publisert" value={endretDato} />
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-6 overflow-auto pt-6">
        <DetailSection title="Stillingsinformasjon">
          <div className="flex flex-col gap-1.5">
            <InfoRow label="Stilling" value={entry.title} />
            {entry.bransje && (
              <InfoRow label="Bransje" value={entry.bransje} />
            )}
            {entry.arbeidssprak && entry.arbeidssprak.length > 0 && (
              <InfoRow
                label="Arbeidsspråk"
                value={entry.arbeidssprak.join(", ")}
              />
            )}
            {entry.ansettelsesform && (
              <InfoRow label="Ansettelsesform" value={entry.ansettelsesform} />
            )}
            {entry.municipal && (
              <InfoRow label="Område i kart" value={entry.municipal} />
            )}
            {entry.heltidDeltid && (
              <InfoRow label="Heltid/deltid" value={entry.heltidDeltid} />
            )}
            {entry.sektor && (
              <InfoRow label="Sektor" value={entry.sektor} />
            )}
          </div>
        </DetailSection>

        {job.content_text && (
          <DetailSection title="Om stillingen">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {job.content_text}
            </p>
          </DetailSection>
        )}

        {entry.skills && entry.skills.length > 0 && (
          <DetailSection title="Ferdigheter og kompetanse">
            <p className="text-sm text-muted-foreground mb-3">
              Stillingen krever eller ønsker erfaring med:
            </p>
            <ul className="flex flex-wrap gap-2">
              {entry.skills.map((skill) => (
                <li key={skill}>
                  <Badge
                    variant="secondary"
                    className="font-normal py-1.5 px-2.5"
                  >
                    {skill}
                  </Badge>
                </li>
              ))}
            </ul>
          </DetailSection>
        )}

        <div className="pt-4 border-t flex flex-col gap-3 flex-shrink-0">
          <p className="text-sm text-muted-foreground">
            Søk på stillingen hos NAV for å sende søknad og se full
            stillingsbeskrivelse.
          </p>
          <Button asChild className="w-full sm:w-auto">
            <Link href={job.url} target="_blank" rel="noopener noreferrer">
              Åpne på NAV
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
