"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Briefcase,
  Clock,
  Search,
  Trophy,
} from "lucide-react";
import type { PineconeJobRecord } from "@/lib/schemas/job-feed";
import { isApplicationOpen } from "@/lib/job-utils";
import type { JobMatchFilters } from "@/lib/job-match-filters";
import {
  JobFiltersBar,
  DEFAULT_JOB_FILTERS,
} from "@/components/job-filters";

interface MatchedJobsProps {
  matches: PineconeJobRecord[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  onSearch: (filters?: JobMatchFilters) => void;
}

const MATCHES_PER_PAGE = 10;
const RECENT_DAYS = 7;
const absoluteDateOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

function parseDate(value: string | undefined | null): Date | null {
  if (value == null || String(value).trim() === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatApplicationDue(value: string | undefined | null): string | null {
  const date = parseDate(value);
  if (date) return date.toLocaleDateString("nb-NO", absoluteDateOptions);
  return value && String(value).trim() ? value : null;
}

function formatPublished(value: string | undefined | null): string | null {
  const date = parseDate(value);
  if (!date) return value && String(value).trim() ? value : null;
  const now = new Date();
  const daysDiff = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysDiff >= 0 && daysDiff <= RECENT_DAYS) {
    const rtf = new Intl.RelativeTimeFormat("nb-NO", { style: "long" });
    return rtf.format(-daysDiff, "day");
  }
  return date.toLocaleDateString("nb-NO", absoluteDateOptions);
}

const MEDAL_STYLES = [
  { bg: "bg-yellow-500", text: "text-yellow-50", ring: "ring-yellow-400/30", label: "1." },
  { bg: "bg-gray-400", text: "text-gray-50", ring: "ring-gray-300/30", label: "2." },
  { bg: "bg-amber-700", text: "text-amber-50", ring: "ring-amber-600/30", label: "3." },
] as const;

function PodiumCard({
  job,
  rank,
}: {
  job: PineconeJobRecord;
  rank: number;
}) {
  const style = MEDAL_STYLES[rank];
  const isGold = rank === 0;
  const formattedPublished = formatPublished(job.published);
  const formattedDue = formatApplicationDue(job.application_due);

  return (
    <Link
      href={`/jobs/${encodeURIComponent(job._id)}`}
      className={`group relative flex min-w-0 flex-col rounded-xl border-2 p-4 text-left transition-all hover:shadow-md cursor-pointer ${
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
        {(() => {
          const engagement = job.engagement_type?.trim() || "";
          const extent =
            job.extent != null && String(job.extent).trim() && String(job.extent).toLowerCase() !== "null"
              ? String(job.extent).trim()
              : "";
          const parts = [engagement, extent].filter(Boolean);
          return parts.length > 0 ? (
            <span className="inline-flex items-center gap-0.5">
              <Briefcase className="h-3 w-3" />
              {parts.join(", ")}
            </span>
          ) : null;
        })()}
        {formattedPublished && (
          <span className="inline-flex items-center gap-0.5">
            <Calendar className="h-3 w-3" />
            {formattedPublished}
          </span>
        )}
        {formattedDue && (
          <span className="inline-flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {formattedDue}
          </span>
        )}
      </div>

      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Se annonse <ExternalLink className="h-3 w-3" />
      </span>
    </Link>
  );
}

function ListRow({
  job,
  rank,
}: {
  job: PineconeJobRecord;
  rank: number;
}) {
  const formattedPublished = formatPublished(job.published);
  const formattedDue = formatApplicationDue(job.application_due);

  return (
    <Link
      href={`/jobs/${encodeURIComponent(job._id)}`}
      className="group flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/50 cursor-pointer"
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
        {formattedPublished && (
          <span className="inline-flex items-center gap-0.5">
            <Calendar className="h-3 w-3" />
            {formattedPublished}
          </span>
        )}
        {formattedDue && (
          <span className="inline-flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {formattedDue}
          </span>
        )}
      </div>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

export function MatchedJobs({
  matches,
  isLoading,
  error,
  hasSearched,
  onSearch,
}: MatchedJobsProps) {
  const [filters, setFilters] = useState<JobMatchFilters>(DEFAULT_JOB_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  const openMatches = matches.filter((j) =>
    isApplicationOpen(j.application_due)
  );
  const rest = openMatches.slice(3);
  const totalRestPages = Math.max(1, Math.ceil(rest.length / MATCHES_PER_PAGE));
  const restPage = rest.slice(
    (currentPage - 1) * MATCHES_PER_PAGE,
    currentPage * MATCHES_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [openMatches.length]);

  useEffect(() => {
    if (currentPage > totalRestPages) setCurrentPage(1);
  }, [currentPage, totalRestPages]);

  const handleSearch = () => onSearch(filters);

  // Initial state: no search has been triggered yet
  if (!isLoading && !error && !hasSearched) {
    return (
      <div className="flex flex-col gap-4">
        <JobFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          disabled={false}
        />
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
            <Button onClick={handleSearch} size="lg" className="mt-1 gap-2">
              <Search className="h-4 w-4" />
              Finn relevante jobber
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <JobFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          disabled={true}
        />
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
      <div className="flex flex-col gap-4">
        <JobFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          disabled={false}
        />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={handleSearch} size="sm">
              Prøv igjen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (openMatches.length === 0 && hasSearched) {
    return (
      <div className="flex flex-col gap-4">
        <JobFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          disabled={false}
        />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-muted-foreground">
              Ingen treff funnet. Prøv å oppdater CV-en din med mer informasjon.
            </p>
            <Button variant="outline" onClick={handleSearch} size="sm">
              Søk igjen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const podium = openMatches.slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <JobFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        disabled={false}
      />
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Topp {openMatches.length} matcher</h2>
        <Button
          variant="outline"
          onClick={handleSearch}
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

      {/* Rest of the list — paginated */}
      {rest.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Flere matcher ({rest.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {restPage.map((job, i) => (
              <ListRow
                key={job._id}
                job={job}
                rank={(currentPage - 1) * MATCHES_PER_PAGE + i + 4}
              />
            ))}
            {totalRestPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage((p) => p - 1);
                      }}
                      className={
                        currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                      }
                      aria-label="Forrige side"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Forrige</span>
                    </PaginationPrevious>
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-2 text-sm text-muted-foreground">
                      Side {currentPage} av {totalRestPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalRestPages)
                          setCurrentPage((p) => p + 1);
                      }}
                      className={
                        currentPage >= totalRestPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                      aria-label="Neste side"
                    >
                      <span className="hidden sm:inline">Neste</span>
                      <ChevronRight className="h-4 w-4" />
                    </PaginationNext>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
