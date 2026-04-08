import { Skeleton } from "@/components/ui/skeleton";

export function CvDataViewSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
        </div>
        <div className="shrink-0 border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3">
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}
