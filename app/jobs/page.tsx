import { JobList } from "@/components/job-list";

export default function JobsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Jobbsøk</h1>
        <p className="text-muted-foreground mt-1">Aktive stillinger fra NAV</p>
      </div>
      <JobList />
    </div>
  );
}
