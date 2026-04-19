"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CommunityAnnouncement, CommunitySortTab, CommunityPost } from "./_types";
import CommunityAnnouncements from "./components/community-announcements";
import CommunityPostList from "./components/community-post-list";
import CommunitySubnav from "./components/community-subnav";

const PAGE_SIZE = 8;

function mapSortTabToApiValue(tab: CommunitySortTab) {
  if (tab === "latest-reply") {
    return "latest-reply";
  }

  if (tab === "hot") {
    return "hottest";
  }

  return "latest-post";
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<CommunitySortTab>("latest-post");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // 用 ref 保存分页运行态，避免把这些状态放进 loadPosts 依赖后引发 effect 循环。
  const loadingRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const requestSeqRef = useRef(0);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadPosts = useCallback(
    async (options?: { reset?: boolean }) => {
      const isReset = Boolean(options?.reset);

      if (loadingRef.current) {
        return;
      }

      if (!isReset && !hasMoreRef.current) {
        return;
      }

      loadingRef.current = true;
      setIsLoading(true);
      const requestSeq = ++requestSeqRef.current;

      try {
        const query = new URLSearchParams({
          sort: mapSortTabToApiValue(activeTab),
          limit: String(PAGE_SIZE),
        });

        const nextCursor = isReset ? null : cursorRef.current;
        if (nextCursor) {
          query.set("cursor", nextCursor);
        }

        const response = await fetch(`/api/community/posts?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          items?: CommunityPost[];
          nextCursor?: string | null;
          hasMore?: boolean;
        };

        // 只接受最后一次请求，避免旧响应把新 tab 或新分页结果覆盖掉。
        if (requestSeq !== requestSeqRef.current) {
          return;
        }

        const nextItems = data.items ?? [];
        setPosts((current) => (isReset ? nextItems : [...current, ...nextItems]));

        const nextCursorValue = data.nextCursor ?? null;
        const nextHasMore = Boolean(data.hasMore);

        cursorRef.current = nextCursorValue;
        hasMoreRef.current = nextHasMore;

        setHasMore(nextHasMore);
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [activeTab],
  );

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/community/announcements?limit=5", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { items?: CommunityAnnouncement[] };
      setAnnouncements(data.items ?? []);
    })();
  }, []);

  useEffect(() => {
    setPosts([]);
    setHasMore(true);

    cursorRef.current = null;
    hasMoreRef.current = true;
    loadingRef.current = false;

    void loadPosts({ reset: true });
  }, [activeTab, loadPosts]);

  useEffect(() => {
    const target = loaderRef.current;

    if (!target || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting || loadingRef.current || !hasMoreRef.current) {
          return;
        }

        void loadPosts();
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: "120px 0px",
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadPosts]);

  return (
    <main className="px-[10vw] space-y-4">
      <CommunitySubnav activeTab={activeTab} onTabChange={setActiveTab} />
      <CommunityAnnouncements items={announcements} />
      <CommunityPostList posts={posts} />
      <div ref={loaderRef} className="py-2 text-center text-xs text-muted-foreground">
        {isLoading ? "加载中..." : hasMore ? "上滑加载更多" : `已展示全部 ${posts.length} 条帖子`}
      </div>
    </main>
  );
}
