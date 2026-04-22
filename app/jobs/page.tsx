import { JobList } from "@/components/job-list";

export default function JobsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 rounded-2xl border border-border bg-card/80 px-5 py-6 shadow-sm sm:px-8">
        <h1 className="bg-gradient-to-r from-primary to-brand-dark bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-brand-light dark:to-primary">
          Jobbsøk
        </h1>
        <p className="mt-2 text-muted-foreground">
          Aktive stillinger fra NAV
        </p>
      </div>
      <JobList />
    </div>
  );
}
