import { MyCard } from "@/components/mycard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type RecommendedListProps = {
  className?: string;
  items: number[];
  onRefresh: () => void;
  isRefreshing?: boolean;
};

export default function RecommendedList({ className, items, onRefresh, isRefreshing = false }: RecommendedListProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="relative flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-items-center mb-5 mt-2">
        <Button className="absolute right-0 top-0 w-[50px]" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? "..." : "刷新"}
        </Button>
        {isRefreshing
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="w-full max-w-sm">
                <Skeleton className="aspect-video w-full" />
                <div className="space-y-3 px-6 py-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="px-6 pb-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))
          : items.map((itemId) => <MyCard key={itemId} />)}
      </div>
    </div>
  );
}
