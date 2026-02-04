"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const ITEMS_PER_PAGE = 20;

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

export interface JobsListContentProps {
  items: JobItem[];
  totalPages: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function JobsListContent({
  items,
  totalPages,
  totalItems,
  currentPage,
  onPageChange,
}: JobsListContentProps) {
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ingen aktive stillinger funnet.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {items.map((job) => (
                <JobCard key={job._feed_entry.uuid} job={job} />
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
                          onPageChange(currentPage - 1);
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
                            onPageChange(page);
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
                          onPageChange(currentPage + 1);
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

export function JobCard({ job }: { job: JobItem }) {
  const entry = job._feed_entry;
  const excerpt = job.content_text
    ? job.content_text.split(/[.!?]/).filter(Boolean)[0]?.trim()
    : null;
  const excerptWithSuffix =
    excerpt && job.content_text && excerpt.length < job.content_text.length
      ? `${excerpt}.`
      : excerpt;

  return (
    <li className="rounded-lg border bg-card hover:bg-accent/50 transition-colors p-5">
      <div className="flex gap-4">
        {entry.companyLogoUrl && (
          <div className="size-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
            <img
              src={entry.companyLogoUrl}
              alt=""
              className="size-12 object-cover"
              width={48}
              height={48}
            />
          </div>
        )}
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <h3 className="font-semibold text-base leading-tight">
            {entry.title}
          </h3>
          {entry.businessName && (
            <p className="text-sm text-muted-foreground font-medium">
              {entry.businessName}
            </p>
          )}
          {excerptWithSuffix && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {excerptWithSuffix}
            </p>
          )}
          {entry.skills && entry.skills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Ferdigheter
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                {entry.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {entry.municipal && (
              <Badge variant="secondary">{entry.municipal}</Badge>
            )}
            {entry.sistEndret && (
              <span className="text-xs text-muted-foreground">
                Oppdatert:{" "}
                {new Date(entry.sistEndret).toLocaleDateString("nb-NO")}
              </span>
            )}
          </div>
          <div className="mt-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={job.url} target="_blank" rel="noopener noreferrer">
                Se stilling
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

export function JobList() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, error, isLoading } = useSWR<PaginatedJobsResponse>(
    `/api/jobs?page=${currentPage}&limit=${ITEMS_PER_PAGE}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      refreshInterval: 5 * 60 * 1000,
      keepPreviousData: true,
    }
  );

  const jobs = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;
  const visiblePages = getVisiblePages(currentPage, totalPages);

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
    <Card>
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
              {jobs.map((job) => (
                <JobCard key={job._feed_entry.uuid} job={job} />
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
