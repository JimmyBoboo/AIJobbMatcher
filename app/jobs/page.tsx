import { JobsPageClient } from "./jobs-page-client";

export default function JobsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Stillinger</h1>
        <p className="text-muted-foreground mt-1">
          Se og søk etter stillinger
        </p>
      </div>
      <JobsPageClient />
    </div>
  );
}
