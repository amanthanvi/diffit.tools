import { Skeleton } from "@diffit/ui";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b">
        <Skeleton className="h-full" />
      </div>
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-6 w-2/3" />
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}