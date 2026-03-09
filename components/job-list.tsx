"use client";

import { useState, useRef, useEffect } from "react";
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

const ITEMS_PER_PAGE = 10;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getVisiblePages(
  currentPage: number,
  totalPages: number
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
  const listRef = useRef<HTMLDivElement>(null);

  const { data, error, isLoading } = useSWR<PaginatedJobsResponse>(
    `/api/jobs`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      refreshInterval: 5 * 60 * 1000,
      keepPreviousData: true, // Keep showing old data while fetching new page
    }
  );

  const allJobs = data?.items ?? [];
  const totalItems = allJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const jobs = allJobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const visiblePages = getVisiblePages(currentPage, totalPages);

  useEffect(() => {
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  if (isLoading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stillinger</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Laster stillinger...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
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
              Lastet inn: {totalItems}
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
                    )
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
  );
}

function JobCard({ job }: { job: JobItem }) {
  const entry = job._feed_entry;

  return (
    <li className="min-w-0 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50 sm:p-5">
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
    </li>
  );
}
