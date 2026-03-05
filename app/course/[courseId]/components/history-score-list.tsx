"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleSlash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { HistoryScoreItem, HistoryScorePageResult, ScoreHistoryGranularity } from "../_types";

interface HistoryScoreListProps {
  courseId: string;
}

const GRANULARITY_OPTIONS: { key: ScoreHistoryGranularity; label: string }[] = [
  { key: "semester", label: "学期" },
  { key: "year", label: "年" },
  { key: "month", label: "月" },
  { key: "day", label: "日" },
];

function getScoreTagClass(score: number | null) {
  if (score === null) {
    return "bg-muted text-muted-foreground";
  }
  if (score < 3) {
    return "bg-red-50 text-red-600";
  }
  if (score < 4) {
    return "bg-yellow-50 text-yellow-700";
  }
  return "bg-green-50 text-green-700";
}

function ScoreChip({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
        <CircleSlash2 className="size-3.5" />
      </span>
    );
  }

  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium tabular-nums text-center ${getScoreTagClass(score)}`}>
      {score.toFixed(2)}
    </span>
  );
}

const COLUMNS: { key: keyof HistoryScoreItem; label: string }[] = [
  { key: "timeLabel", label: "时间" },
  { key: "overallScore", label: "综合评分" },
  { key: "attitude", label: "教学态度与师德" },
  { key: "content", label: "教学内容与设计" },
  { key: "method", label: "教学方法与技巧" },
  { key: "effect", label: "教学效果与成果" },
  { key: "interaction", label: "师生互动与氛围" },
  { key: "resource", label: "课程资源与评价" },
  { key: "improve", label: "教学创新与改进" },
];

export default function HistoryScoreList({ courseId }: HistoryScoreListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawGranularity = searchParams.get("granularity");
  const granularity: ScoreHistoryGranularity =
    rawGranularity === "year" || rawGranularity === "month" || rawGranularity === "day" ? rawGranularity : "semester";

  const [items, setItems] = useState<HistoryScoreItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const updateGranularityQuery = useCallback(
    (nextGranularity: ScoreHistoryGranularity) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("granularity", nextGranularity);

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const fetchPage = useCallback(
    async (cursor: string | null, replace: boolean) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          granularity,
          limit: "12",
        });
        if (cursor) {
          params.set("cursor", cursor);
        }

        const response = await fetch(`/api/courses/${courseId}/score-history?${params.toString()}`, {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("加载失败");
        }

        const page: HistoryScorePageResult = await response.json();
        setItems((prev) => {
          if (replace) {
            return page.items;
          }

          const existingIds = new Set(prev.map((item) => item.id));
          const appended = page.items.filter((item) => !existingIds.has(item.id));
          return [...prev, ...appended];
        });
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
        setIsInitialized(true);
      } catch {
        setError("历史评分加载失败，请重试");
      } finally {
        setIsLoading(false);
      }
    },
    [courseId, granularity],
  );

  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    setHasMore(true);
    setError(null);
    setIsInitialized(false);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    void fetchPage(null, true);
  }, [courseId, fetchPage, granularity]);

  const loadMore = useCallback(() => {
    if (!hasMore || !nextCursor || isLoading) {
      return;
    }

    void fetchPage(nextCursor, false);
  }, [fetchPage, hasMore, isLoading, nextCursor]);

  const handleScroll = useCallback(() => {
    const target = containerRef.current;
    if (!target || isLoading || !hasMore) {
      return;
    }

    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceToBottom < 80) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  const footerText = useMemo(() => {
    if (!isInitialized) {
      return null;
    }

    if (isLoading) {
      return "正在加载更多...";
    }

    if (error) {
      return null;
    }

    if (!hasMore) {
      return "已加载全部历史评分";
    }

    return "向下滚动加载更多";
  }, [error, hasMore, isInitialized, isLoading]);

  const handleRetry = useCallback(() => {
    if (items.length === 0) {
      void fetchPage(null, true);
      return;
    }

    if (nextCursor) {
      void fetchPage(nextCursor, false);
    }
  }, [fetchPage, items.length, nextCursor]);

  return (
    <section id="course-score-history" className="space-y-3">
      <div className="flex items-center justify-start">
        <ButtonGroup>
          {GRANULARITY_OPTIONS.map((option) => (
            <Button
              key={option.key}
              size="sm"
              variant={granularity === option.key ? "default" : "outline"}
              onClick={() => updateGranularityQuery(option.key)}
            >
              {option.label}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      <div className="rounded-md border ">
        <div className="overflow-x-auto">
          <div ref={containerRef} className="h-90 overflow-y-auto" onScroll={handleScroll}>
            <table className="w-full min-w-245 border-collapse text-xs">
              <thead className="bg-muted/30">
                <tr>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className="sticky top-0 z-10 border-b bg-muted/30 px-0 py-2 font-medium text-muted-foreground text-center"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className=" py-2 text-muted-foreground whitespace-nowrap text-center">{item.timeLabel}</td>
                    <td className=" py-2 text-center">
                      <ScoreChip score={item.overallScore} />
                    </td>
                    <td className=" py-2 text-center">
                      <ScoreChip score={item.attitude} />
                    </td>
                    <td className="py-2 text-center">
                      <ScoreChip score={item.content} />
                    </td>
                    <td className=" py-2 text-center">
                      <ScoreChip score={item.method} />
                    </td>
                    <td className=" py-2 text-center">
                      <ScoreChip score={item.effect} />
                    </td>
                    <td className=" py-2 text-center">
                      <ScoreChip score={item.interaction} />
                    </td>
                    <td className="py-2 text-center">
                      <ScoreChip score={item.resource} />
                    </td>
                    <td className="py-2 text-center">
                      <ScoreChip score={item.improve} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-center gap-2">
          <p className="text-xs text-destructive">{error}</p>
          <Button size="sm" variant="outline" onClick={handleRetry}>
            重试
          </Button>
        </div>
      )}

      {!error && footerText && <p className="text-center text-xs text-muted-foreground">{footerText}</p>}
    </section>
  );
}
