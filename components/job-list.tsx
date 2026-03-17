"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { JobItem, PaginatedJobsResponse } from "@/lib/schemas/job-feed";
import type { JobMatchFilters } from "@/lib/job-match-filters";
import { JobFiltersBar, DEFAULT_JOB_FILTERS } from "@/components/job-filters";

const ITEMS_PER_PAGE = 10;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function buildJobsUrl(filters: JobMatchFilters): string {
  const params = new URLSearchParams();
  if (filters.county?.trim()) params.set("county", filters.county.trim());
  if (filters.engagementType?.trim())
    params.set("engagementType", filters.engagementType.trim());
  const qs = params.toString();
  return qs ? `/api/jobs?${qs}` : "/api/jobs";
}

function getVisiblePages(
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

export function JobList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<JobMatchFilters>(DEFAULT_JOB_FILTERS);
  const listRef = useRef<HTMLDivElement>(null);

  const jobsUrl = useMemo(() => buildJobsUrl(filters), [filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const { data, error, isLoading } = useSWR<PaginatedJobsResponse>(
    jobsUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      refreshInterval: 5 * 60 * 1000,
      keepPreviousData: true,
    },
  );

  const rawJobs = data?.items ?? [];
  const industryTrim = filters.industry?.trim().toLowerCase() ?? "";
  const allJobs = useMemo(() => {
    if (!industryTrim) return rawJobs;
    return rawJobs.filter((job) => {
      const title = (job._feed_entry?.title ?? job.title ?? "").toLowerCase();
      const occupation = (job._feed_entry?.occupation ?? "").toLowerCase();
      return title.includes(industryTrim) || occupation.includes(industryTrim);
    });
  }, [rawJobs, industryTrim]);
  const totalItems = allJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const jobs = allJobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const visiblePages = getVisiblePages(currentPage, totalPages);

  useEffect(() => {
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col gap-4">
        <JobFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          disabled={true}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stillinger</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Laster stillinger...
            </p>
          </CardContent>
        </Card>
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
          <CardHeader>
            <CardTitle className="text-base">Stillinger</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">
              {error.message || "Kunne ikke laste stillinger"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <JobFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        disabled={false}
      />
      <Card ref={listRef}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                Stillinger
                {isLoading && (
                  <span className="ml-2 text-sm text-muted-foreground font-normal">
                    Laster...
                  </span>
                )}
              </CardTitle>
              <CardDescription className="mt-1.5">
                {totalItems === rawJobs.length && !industryTrim
                  ? `Lastet inn: ${totalItems}`
                  : `Viser ${totalItems} stillinger`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen aktive stillinger funnet.
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {jobs.map((job, i) => (
                  <JobCard key={`${job._feed_entry.uuid}-${i}`} job={job} />
                ))}
              </ul>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) {
                            setCurrentPage((p) => p - 1);
                          }
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {visiblePages.map((page, idx) =>
                      page === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) {
                            setCurrentPage((p) => p + 1);
                          }
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getJobHref(job: JobItem): string | null {
  const raw = job?.url;
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Full URL: open externally (e.g. public stilling link if feed ever provides one)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  // Relative path (e.g. api/v1/vacancies/{uuid}): open via our app so we use server API key
  const path = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return `/jobs/v?path=${encodeURIComponent(path)}`;
}

function JobCard({ job }: { job: JobItem }) {
  const entry = job._feed_entry;
  const href = getJobHref(job);

  const content = (
    <>
      <div className="flex min-w-0 flex-col gap-2">
        <h3 className="break-words font-semibold text-base leading-tight line-clamp-2">
          {entry.title}
        </h3>
        {entry.businessName && (
          <p className="break-words text-sm font-medium text-muted-foreground line-clamp-1">
            {entry.businessName}
          </p>
        )}
        <div className="flex min-w-0 flex-wrap items-center gap-2 mt-1">
          {entry.municipal && (
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {entry.municipal}
            </span>
          )}
          {entry.sistEndret && (
            <span className="text-xs text-muted-foreground">
              Oppdatert:{" "}
              {new Date(entry.sistEndret).toLocaleDateString("nb-NO")}
            </span>
          )}
        </div>
      </div>
    </>
  );

  const cardClassName =
    "min-w-0 w-full rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50 sm:p-5 block relative z-10 cursor-pointer text-left";

  if (href) {
    const isExternal =
      href.startsWith("http://") || href.startsWith("https://");
    return (
      <li className="relative list-none">
        <a
          href={href}
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className={cardClassName}
          aria-label={`Åpne stilling: ${entry.title}`}
        >
          {content}
        </a>
      </li>
    );
  }

  return <li className={cardClassName}>{content}</li>;
}
