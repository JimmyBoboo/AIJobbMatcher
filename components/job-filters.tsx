"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JobMatchFilters } from "@/lib/job-match-filters";
import { ENGAGEMENT_TYPE_OPTIONS, COUNTIES } from "@/lib/job-match-filters";

export const DEFAULT_JOB_FILTERS: JobMatchFilters = {
  engagementType: "",
  county: "",
  industry: "",
};

export function JobFiltersBar({
  filters,
  onFiltersChange,
  disabled = false,
}: {
  filters: JobMatchFilters;
  onFiltersChange: (f: JobMatchFilters) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 px-4 py-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Stillingsform</Label>
        <Select
          value={filters.engagementType || "alle"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              engagementType: value === "alle" ? "" : value,
            })
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-[140px]" size="sm">
            <SelectValue placeholder="Alle" />
          </SelectTrigger>
          <SelectContent>
            {ENGAGEMENT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || "alle"} value={opt.value || "alle"}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Fylke</Label>
        <Select
          value={filters.county || "any"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              county: value === "any" ? "" : value,
            })
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-[180px]" size="sm">
            <SelectValue placeholder="Alle fylker" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Alle fylker</SelectItem>
            {COUNTIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Bransje / yrke</Label>
        <Input
          type="search"
          placeholder="F.eks. IT, helse, salg"
          value={filters.industry ?? ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, industry: e.target.value })
          }
          disabled={disabled}
          className="w-[180px]"
        />
      </div>
    </div>
  );
}
