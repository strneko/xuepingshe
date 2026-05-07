import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="px-[10vw] py-8 space-y-6">
      {/* User card */}
      <div className="rounded-xl border p-6 flex items-center gap-4">
        <Skeleton className="size-16 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-4 mt-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
      {/* Teacher profile card */}
      <div className="rounded-xl border p-6 space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-4 w-full" />
      </div>
      {/* History tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-16 rounded-lg" />
        ))}
      </div>
      {/* History items */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
