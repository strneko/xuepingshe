import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="px-[10vw] py-8 max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-7 w-24" />
      {/* Filter tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-14 rounded-lg" />
        <Skeleton className="h-8 w-14 rounded-lg" />
        <Skeleton className="h-8 w-14 rounded-lg" />
      </div>
      {/* Notification items */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
          <Skeleton className="size-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-4 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}
