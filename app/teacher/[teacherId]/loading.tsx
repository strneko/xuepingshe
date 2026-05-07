import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherDetailLoading() {
  return (
    <div className="px-[10vw] py-8 space-y-6">
      {/* Hero */}
      <div className="rounded-xl border p-6 flex flex-col sm:flex-row gap-4 items-start">
        <Skeleton className="size-20 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      {/* Score + reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
