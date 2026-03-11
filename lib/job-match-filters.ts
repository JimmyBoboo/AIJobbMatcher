/**
 * Shared types and options for matched-job filters (engagement type, county, date).
 * Used by the match API and the matched-jobs filter UI.
 */

export interface JobMatchFilters {
  engagementType: string;
  county: string;
}

/** Sentinel: no county filter (use CV-derived or show all). */
export const COUNTY_ANY = "ANY";

/** Engagement type options for the filter dropdown (value sent to API; empty = all). */
export const ENGAGEMENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Alle" },
  { value: "Heltid", label: "Heltid" },
  { value: "Deltid", label: "Deltid" },
  { value: "Vikariat", label: "Vikariat" },
  { value: "Sommerjobb", label: "Sesong / Sommerjobb" },
  { value: "Praktikk", label: "Praktikk" },
];

/**
 * Map UI engagement type to possible values in the job index (NAV/Arbeidsplassen can use
 * different spellings or combine with "extent"). Used so the filter matches real index data.
 */
export const ENGAGEMENT_TYPE_INDEX_VALUES: Record<string, string[]> = {
  Heltid: [
    "Fast",
    "Heltid",
    "Fulltid",
    "Heltidsstilling",
    "Fulltidsstilling",
    "Heltids stilling",
    "Fulltids stilling",
    "Fast stilling",
    "Full-time",
    "Full time",
  ],
  Deltid: [
    "Deltid",
    "Fast, deltid",
    "Fast, Deltid",
    "Engasjement, deltid",
    "Engasjement, Deltid",
    "Parttid",
    "Deltidsstilling",
    "Parttidsstilling",
    "Deltids stilling",
    "Parttids stilling",
    "Part-time",
    "Part time",
  ],
  Vikariat: ["Vikariat", "Midlertidig"],
  Sommerjobb: [
    "Sommerjobb",
    "Sesong",
    "Sesongarbeid",
    "Sesongstilling",
  ],
  Praktikk: ["Praktikk", "Lærling"],
};

/**
 * Map UI choice (Heltid/Deltid) to possible values in the job index "extent" metadata.
 * NAV PAM sends extent separately from engagementtype; index must store extent for this filter to work.
 */
export const EXTENT_INDEX_VALUES: Record<"Heltid" | "Deltid", string[]> = {
  Heltid: ["Heltid", "100%"],
  Deltid: [
    "Deltid",
    "Prosent",
    "50%",
    "30%",
    "Fast, deltid",
    "Fast, Deltid",
    "Engasjement, deltid",
    "Engasjement, Deltid",
  ],
};

/** County codes used in the Pinecone index (sorted). "Alle fylker" uses COUNTY_ANY. */
export const COUNTIES: string[] = [
  "AGDER",
  "AKERSHUS",
  "BUSKERUD",
  "FINNMARK",
  "INNLANDET",
  "MØRE OG ROMSDAL",
  "NORDLAND",
  "OSLO",
  "ROGALAND",
  "TELEMARK",
  "TROMS",
  "TRØNDELAG",
  "VESTFOLD",
  "VESTLAND",
  "ØSTFOLD",
];
