"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import SearchResultCard from "@/components/search-result-card";

type ResultType = "course" | "teacher";

interface SearchResultItem {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  department: string;
  score: number;
  reviewCount: number;
  snippet: string;
  href: string;
}

interface SearchApiResponse {
  items: SearchResultItem[];
  total: number;
  courseCount: number;
  teacherCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export default function ResultsList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const keyword = searchParams.get("keyword") ?? "";
  const category = searchParams.get("category") ?? "0";
  const sort = searchParams.get("sort") ?? "relevance";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");

  const [items, setItems] = React.useState<SearchResultItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [courseCount, setCourseCount] = React.useState(0);
  const [teacherCount, setTeacherCount] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const isLoadingRef = React.useRef(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.trunc(pageSize) : 20;
  const normalizedKeyword = normalizeText(keyword);

  const updateQuery = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleSortChange = React.useCallback(
    (nextSort: string) => {
      updateQuery({ sort: nextSort, page: "1" });
    },
    [updateQuery],
  );

  const loadMore = React.useCallback(async () => {
    if (!hasMore || isLoadingRef.current) {
      return;
    }

    updateQuery({ page: String(safePage + 1) });
  }, [hasMore, safePage, updateQuery]);

  React.useEffect(() => {
    let isCancelled = false;

    const fetchResults = async () => {
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          keyword,
          category,
          sort,
          page: String(safePage),
          pageSize: String(safePageSize),
        });

        const response = await fetch(`/api/search?${params.toString()}`, { method: "GET" });
        if (!response.ok) {
          throw new Error("加载失败");
        }

        const data: SearchApiResponse = await response.json();
        if (isCancelled) {
          return;
        }

        setItems((prev) => (safePage === 1 ? data.items : [...prev, ...data.items]));
        setTotal(data.total);
        setCourseCount(data.courseCount);
        setTeacherCount(data.teacherCount);
        setHasMore(data.hasMore);
      } catch {
        if (!isCancelled) {
          setItems([]);
          setTotal(0);
          setCourseCount(0);
          setTeacherCount(0);
          setHasMore(false);
        }
      } finally {
        if (!isCancelled) {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      }
    };

    void fetchResults();

    return () => {
      isCancelled = true;
    };
  }, [category, keyword, safePage, safePageSize, sort]);

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
    <div className="space-y-4 overflow-y-auto pb-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          共 {total} 条（课程 {courseCount} / 教师 {teacherCount}）
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={sort === "relevance" ? "default" : "outline"}
            onClick={() => handleSortChange("relevance")}
          >
            相关性
          </Button>
          <Button
            size="sm"
            variant={sort === "score" ? "default" : "outline"}
            onClick={() => handleSortChange("score")}
          >
            评分
          </Button>
          <Button size="sm" variant={sort === "hot" ? "default" : "outline"} onClick={() => handleSortChange("hot")}>
            热度
          </Button>
        </div>
      </div>

      {items.length === 0 && !isLoading && (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          {normalizedKeyword ? "没有匹配结果，试试更短关键词或切换分类" : "请输入关键词开始搜索"}
        </div>
      )}

      <div className="grid gap-3">
        {items.map((item) => (
          <SearchResultCard
            key={item.id}
            href={item.href}
            type={item.type}
            title={item.title}
            subtitle={item.subtitle}
            department={item.department}
            score={item.score}
            reviewCount={item.reviewCount}
            snippet={item.snippet}
            keyword={normalizedKeyword}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="h-8" />
      {isLoading && <div className="py-4 text-center text-sm text-muted-foreground">加载中...</div>}
      {!isLoading && !hasMore && items.length > 0 && (
        <div className="py-2 text-center text-xs text-muted-foreground">已加载全部结果</div>
      )}
    </div>
  );
}
