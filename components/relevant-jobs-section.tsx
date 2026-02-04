"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JobCard } from "@/components/job-list";
import { getMockPaginatedJobs } from "@/lib/mock/jobs-mock";
import type { CVData } from "@/lib/schemas/cv";

const RELEVANT_JOBS_LIMIT = 6;

interface RelevantJobsSectionProps {
  cvData: CVData | null;
}

/**
 * Viser stillinger som passer CV-en. Bruker mockdata inntil matching er implementert.
 */
export function RelevantJobsSection({ cvData }: RelevantJobsSectionProps) {
  const { items } = getMockPaginatedJobs(1, RELEVANT_JOBS_LIMIT);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Relevante stillinger for deg</CardTitle>
        <CardDescription>
          {cvData
            ? "Basert på din CV – stillinger som matcher din erfaring og kompetanse"
            : "Last opp CV for å se personlige anbefalinger"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {items.map((job) => (
            <JobCard key={job._feed_entry.uuid} job={job} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
