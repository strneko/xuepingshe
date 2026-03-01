"use client";

import * as React from "react";
import { DefaultCard } from "@/components/default-card";

interface SearchPageProps {
  results: number[];
}

// 向下滚动时,如果距离底部不足100px,则加载下一页数据.每页20条数据
// TODO:高亮关键词 排序
export default function ResultsList({ results }: SearchPageProps) {
  const pageSize = results.length || 20;
  const [items, setItems] = React.useState<number[]>(results);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const isLoadingRef = React.useRef(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setItems(results);
    setPage(1);
  }, [results]); //父组件传入新的搜索结果时,重置列表数据和页码

  const hasMore = page < 5;

  const loadMore = React.useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      // TODO: replace with backend API call.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setItems((prev) => {
        const start = prev.length;
        const more = Array.from({ length: pageSize }, (_, index) => start + index);
        return [...prev, ...more];
      });
      setPage((prev) => prev + 1);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [hasMore, pageSize]);

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
