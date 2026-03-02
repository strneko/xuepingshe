"use client";

import * as React from "react";
import { DefaultCard } from "@/components/default-card";
import { useSearchParams } from "next/navigation";
import { SearchCategory } from "../page";
// 向下滚动时,如果距离底部不足100px,则加载下一页数据.每页20条数据
// TODO:高亮关键词 排序

export default function ResultsList() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const category = Number(searchParams.get("category") ?? "0");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");

  const [items, setItems] = React.useState<number[]>([]);
  const [nextPage, setNextPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const isLoadingRef = React.useRef(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const fetchPage = React.useCallback(
    async (page: number, reset = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        // TODO: 替换为真实 API，请携带 keyword/category/page/pageSize
        await new Promise((resolve) => setTimeout(resolve, 600));

        const batch = Array.from({ length: pageSize }, (_, i) => category * 100000 + (page - 1) * pageSize + i);
        setItems((prev) => (reset ? batch : [...prev, ...batch]));
        setNextPage(page + 1);
        setHasMore(page < 5);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [category, keyword, pageSize],
  );

  // keyword/category 变化时，只重刷列表
  React.useEffect(() => {
    setItems([]);
    setNextPage(1);
    setHasMore(true);
    void fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = React.useCallback(async () => {
    if (!hasMore) return;
    await fetchPage(nextPage, false);
  }, [fetchPage, hasMore, nextPage]);

  React.useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void loadMore();
        }
      },
      { root: null, rootMargin: "100px", threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div>
      <div className="grid grid-cols-4 place-items-center mb-5 mt-2">
        {items.map((itemId, index) => (
          <DefaultCard key={`${itemId}-${index}`} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-8" />
      {isLoading && <div className="py-4 text-center text-sm text-muted-foreground">加载中...</div>}
    </div>
  );
}
