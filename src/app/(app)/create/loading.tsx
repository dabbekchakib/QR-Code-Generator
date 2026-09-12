import { Skeleton } from "@/components/ui/skeleton";

export default function CreateLoading() {
  return (
    <div className="grid lg:grid-cols-2 gap-6" role="status" aria-live="polite" aria-busy="true">
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 max-w-sm rounded-lg mx-auto" />
        <div className="flex justify-center gap-3">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}