import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  MapPin,
  Briefcase,
  Clock,
  Search,
  Trophy,
} from "lucide-react";
import type { PineconeJobRecord } from "@/lib/schemas/job-feed";

interface MatchedJobsProps {
  matches: PineconeJobRecord[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  onSearch: () => void;
}

const MEDAL_STYLES = [
  { bg: "bg-yellow-500", text: "text-yellow-50", ring: "ring-yellow-400/30", label: "1." },
  { bg: "bg-gray-400", text: "text-gray-50", ring: "ring-gray-300/30", label: "2." },
  { bg: "bg-amber-700", text: "text-amber-50", ring: "ring-amber-600/30", label: "3." },
] as const;

function PodiumCard({ job, rank }: { job: PineconeJobRecord; rank: number }) {
  const style = MEDAL_STYLES[rank];
  const isGold = rank === 0;

  return (
    <a
      href={job.source_url || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex min-w-0 flex-col rounded-xl border-2 p-4 transition-all hover:shadow-md ${
        isGold
          ? "border-yellow-400/50 bg-yellow-50/50 dark:border-yellow-500/30 dark:bg-yellow-950/20"
          : "border-border bg-card hover:border-muted-foreground/30"
      }`}
    >
      <div className="mb-3 flex items-start gap-2">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text} text-sm font-bold ring-4 ${style.ring}`}
        >
          {style.label}
        </div>
        {isGold && <Trophy className="h-4 w-4 shrink-0 text-yellow-500" />}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className={`font-semibold leading-tight line-clamp-2 ${isGold ? "text-base" : "text-sm"}`}>
          {job.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{job.employer}</p>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {job.location && (
          <span className="inline-flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {job.location}
          </span>
        )}
        {job.engagement_type && (
          <span className="inline-flex items-center gap-0.5">
            <Briefcase className="h-3 w-3" />
            {job.engagement_type}
          </span>
        )}
        {job.application_due && (
          <span className="inline-flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {job.application_due}
          </span>
        )}
      </div>

      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Se annonse <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}

function ListRow({ job, rank }: { job: PineconeJobRecord; rank: number }) {
  return (
    <a
      href={job.source_url || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <span className="w-5 text-center text-sm font-semibold text-muted-foreground">
        {rank}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium leading-tight group-hover:text-primary">
          {job.title}
        </span>
        <span className="text-xs text-muted-foreground">{job.employer}</span>
      </div>
      <div className="hidden gap-2 text-xs text-muted-foreground sm:flex">
        {job.location && (
          <span className="inline-flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {job.location}
          </span>
        )}
        {job.application_due && (
          <span className="inline-flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {job.application_due}
          </span>
        )}
      </div>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}

export function MatchedJobs({
  matches,
  isLoading,
  error,
  hasSearched,
  onSearch,
}: MatchedJobsProps) {
  // Initial state: no search has been triggered yet
  if (!isLoading && !error && !hasSearched) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">Finn jobber som matcher din profil</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vi analyserer CV-en din og finner de beste stillingene for deg
            </p>
          </div>
          <Button onClick={onSearch} size="lg" className="mt-1 gap-2">
            <Search className="h-4 w-4" />
            Finn relevante jobber
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex min-w-0 flex-col rounded-xl border-2 border-border p-4"
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-1 h-3 w-3/4" />
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={onSearch} size="sm">
            Prøv igjen
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0 && hasSearched) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-6">
          <p className="text-sm text-muted-foreground">
            Ingen treff funnet. Prøv å oppdater CV-en din med mer informasjon.
          </p>
          <Button variant="outline" onClick={onSearch} size="sm">
            Søk igjen
          </Button>
        </CardContent>
      </Card>
    );
  }

  const podium = matches.slice(0, 3);
  const rest = matches.slice(3);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Topp {matches.length} matcher</h2>
        <Button
          variant="outline"
          onClick={onSearch}
          size="sm"
          className="w-fit gap-1.5"
        >
          <Search className="h-3.5 w-3.5" />
          Søk på nytt
        </Button>
      </div>

      {/* Podium — top 3 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {podium.map((job, i) => (
          <PodiumCard key={job._id} job={job} rank={i} />
        ))}
      </div>

      {/* Rest of the list */}
      {rest.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Flere matcher
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {rest.map((job, i) => (
              <ListRow key={job._id} job={job} rank={i + 4} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
