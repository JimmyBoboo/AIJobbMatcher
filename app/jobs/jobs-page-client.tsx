"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobsListContent } from "@/components/job-list";
import { getMockPaginatedJobs } from "@/lib/mock/jobs-mock";

const ITEMS_PER_PAGE = 5;

const SORT_OPTIONS = [
  { value: "newest", label: "Nyeste først" },
  { value: "oldest", label: "Eldste først" },
  { value: "title", label: "Tittel A–Å" },
] as const;

const KOMMUNE_OPTIONS = [
  "Alle",
  "Oslo",
  "Bergen",
  "Trondheim",
  "Stavanger",
] as const;

export function JobsPageClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<string>(SORT_OPTIONS[0].value);
  const [kommune, setKommune] = useState<string>(KOMMUNE_OPTIONS[0]);

  const mockData = useMemo(
    () => getMockPaginatedJobs(currentPage, ITEMS_PER_PAGE),
    [currentPage]
  );

  const { items, totalItems, totalPages } = mockData;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="job-search" className="sr-only">
            Søk stillinger
          </Label>
          <Input
            id="job-search"
            type="search"
            placeholder="Søk stillinger..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="w-full sm:w-[180px]">
            <Label htmlFor="kommune-select" className="sr-only">
              Kommune / fylke
            </Label>
            <Select
              value={kommune}
              onValueChange={(value) => setKommune(value)}
            >
              <SelectTrigger id="kommune-select">
                <SelectValue placeholder="Kommune" />
              </SelectTrigger>
              <SelectContent>
                {KOMMUNE_OPTIONS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-[180px]">
            <Label htmlFor="sort-select" className="sr-only">
              Sortering
            </Label>
            <Select value={sort} onValueChange={(value) => setSort(value)}>
              <SelectTrigger id="sort-select">
                <SelectValue placeholder="Sorter" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {totalItems} stilling{totalItems !== 1 ? "er" : ""}
        {totalPages > 1 &&
          ` · Side ${currentPage} av ${totalPages}`}
      </p>

      <JobsListContent
        items={items}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
