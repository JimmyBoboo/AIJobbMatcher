"use client";

import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JobsListContent } from "@/components/job-list";
import { JobDetailPanel } from "@/components/job-detail-panel";
import { getAllMockJobs } from "@/lib/mock/jobs-mock";
import type { JobItem } from "@/lib/schemas/job-feed";

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

function useFilterOptions(jobs: JobItem[]) {
  return useMemo(() => {
    const bransje = new Set<string>();
    const arbeidssprak = new Set<string>();
    const ansettelsesform = new Set<string>();
    const omrade = new Set<string>();
    const heltidDeltid = new Set<string>();
    const sektor = new Set<string>();
    for (const job of jobs) {
      const e = job._feed_entry;
      if (e.bransje) bransje.add(e.bransje);
      e.arbeidssprak?.forEach((s) => arbeidssprak.add(s));
      if (e.ansettelsesform) ansettelsesform.add(e.ansettelsesform);
      if (e.municipal) omrade.add(e.municipal);
      if (e.heltidDeltid) heltidDeltid.add(e.heltidDeltid);
      if (e.sektor) sektor.add(e.sektor);
    }
    return {
      bransje: Array.from(bransje).sort(),
      arbeidssprak: Array.from(arbeidssprak).sort(),
      ansettelsesform: Array.from(ansettelsesform).sort(),
      omrade: Array.from(omrade).sort(),
      heltidDeltid: Array.from(heltidDeltid).sort(),
      sektor: Array.from(sektor).sort(),
    };
  }, [jobs]);
}

function filterJobs(
  jobs: JobItem[],
  filters: {
    bransje: string[];
    arbeidssprak: string[];
    ansettelsesform: string[];
    omrade: string[];
    heltidDeltid: string[];
    sektor: string[];
  }
): JobItem[] {
  return jobs.filter((job) => {
    const e = job._feed_entry;
    if (
      filters.bransje.length > 0 &&
      (!e.bransje || !filters.bransje.includes(e.bransje))
    )
      return false;
    if (filters.arbeidssprak.length > 0) {
      const match = e.arbeidssprak?.some((s) =>
        filters.arbeidssprak.includes(s)
      );
      if (!match) return false;
    }
    if (
      filters.ansettelsesform.length > 0 &&
      (!e.ansettelsesform ||
        !filters.ansettelsesform.includes(e.ansettelsesform))
    )
      return false;
    if (
      filters.omrade.length > 0 &&
      (!e.municipal || !filters.omrade.includes(e.municipal))
    )
      return false;
    if (
      filters.heltidDeltid.length > 0 &&
      (!e.heltidDeltid || !filters.heltidDeltid.includes(e.heltidDeltid))
    )
      return false;
    if (
      filters.sektor.length > 0 &&
      (!e.sektor || !filters.sektor.includes(e.sektor))
    )
      return false;
    return true;
  });
}

export function JobsPageClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<string>(SORT_OPTIONS[0].value);
  const [kommune, setKommune] = useState<string>(KOMMUNE_OPTIONS[0]);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [filterBransje, setFilterBransje] = useState<string[]>([]);
  const [filterArbeidssprak, setFilterArbeidssprak] = useState<string[]>([]);
  const [filterAnsettelsesform, setFilterAnsettelsesform] = useState<string[]>(
    []
  );
  const [filterOmrade, setFilterOmrade] = useState<string[]>([]);
  const [filterHeltidDeltid, setFilterHeltidDeltid] = useState<string[]>([]);
  const [filterSektor, setFilterSektor] = useState<string[]>([]);

  const allJobs = useMemo(() => getAllMockJobs(), []);
  const filterOptions = useFilterOptions(allJobs);

  const filters = useMemo(
    () => ({
      bransje: filterBransje,
      arbeidssprak: filterArbeidssprak,
      ansettelsesform: filterAnsettelsesform,
      omrade: filterOmrade,
      heltidDeltid: filterHeltidDeltid,
      sektor: filterSektor,
    }),
    [
      filterBransje,
      filterArbeidssprak,
      filterAnsettelsesform,
      filterOmrade,
      filterHeltidDeltid,
      filterSektor,
    ]
  );

  const filteredJobs = useMemo(
    () => filterJobs(allJobs, filters),
    [allJobs, filters]
  );

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredJobs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredJobs, currentPage]);

  const totalFiltered = filteredJobs.length;
  const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE) || 1;

  const toggleFilter = useCallback(
    (
      setter: React.Dispatch<React.SetStateAction<string[]>>,
      value: string,
      checked: boolean
    ) => {
      setter((prev) =>
        checked ? [...prev, value] : prev.filter((v) => v !== value)
      );
      setCurrentPage(1);
    },
    []
  );

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
        {totalFiltered} stilling{totalFiltered !== 1 ? "er" : ""}
        {totalPages > 1 && ` · Side ${currentPage} av ${totalPages}`}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="min-w-0 order-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filtrer på stillinger</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
            {filterOptions.bransje.length > 0 && (
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="text-muted-foreground hover:text-foreground">
                  Bransje
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pb-3 pl-1">
                  <div className="flex flex-col gap-2">
                    {filterOptions.bransje.map((v) => (
                      <label
                        key={v}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={filterBransje.includes(v)}
                          onCheckedChange={(checked) =>
                            toggleFilter(setFilterBransje, v, checked === true)
                          }
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            {filterOptions.arbeidssprak.length > 0 && (
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="text-muted-foreground hover:text-foreground">
                  Arbeidsspråk
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pb-3 pl-1">
                  <div className="flex flex-col gap-2">
                    {filterOptions.arbeidssprak.map((v) => (
                      <label
                        key={v}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={filterArbeidssprak.includes(v)}
                          onCheckedChange={(checked) =>
                            toggleFilter(
                              setFilterArbeidssprak,
                              v,
                              checked === true
                            )
                          }
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            {filterOptions.ansettelsesform.length > 0 && (
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="text-muted-foreground hover:text-foreground">
                  Ansettelsesform
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pb-3 pl-1">
                  <div className="flex flex-col gap-2">
                    {filterOptions.ansettelsesform.map((v) => (
                      <label
                        key={v}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={filterAnsettelsesform.includes(v)}
                          onCheckedChange={(checked) =>
                            toggleFilter(
                              setFilterAnsettelsesform,
                              v,
                              checked === true
                            )
                          }
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            {filterOptions.omrade.length > 0 && (
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="text-muted-foreground hover:text-foreground">
                  Område i kart
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pb-3 pl-1">
                  <div className="flex flex-col gap-2">
                    {filterOptions.omrade.map((v) => (
                      <label
                        key={v}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={filterOmrade.includes(v)}
                          onCheckedChange={(checked) =>
                            toggleFilter(setFilterOmrade, v, checked === true)
                          }
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            {filterOptions.heltidDeltid.length > 0 && (
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="text-muted-foreground hover:text-foreground">
                  Heltid/deltid
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pb-3 pl-1">
                  <div className="flex flex-col gap-2">
                    {filterOptions.heltidDeltid.map((v) => (
                      <label
                        key={v}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={filterHeltidDeltid.includes(v)}
                          onCheckedChange={(checked) =>
                            toggleFilter(
                              setFilterHeltidDeltid,
                              v,
                              checked === true
                            )
                          }
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            {filterOptions.sektor.length > 0 && (
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="text-muted-foreground hover:text-foreground">
                  Sektor
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pb-3 pl-1">
                  <div className="flex flex-col gap-2">
                    {filterOptions.sektor.map((v) => (
                      <label
                        key={v}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={filterSektor.includes(v)}
                          onCheckedChange={(checked) =>
                            toggleFilter(setFilterSektor, v, checked === true)
                          }
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 flex flex-col gap-4 order-2">
          <JobsListContent
            items={paginatedItems}
            totalItems={totalFiltered}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            selectedJobId={selectedJob?._feed_entry.uuid ?? null}
            onSelectJob={setSelectedJob}
          />
        </div>

        <div className="min-w-0 order-3">
          <JobDetailPanel job={selectedJob} />
        </div>
      </div>
    </div>
  );
}
