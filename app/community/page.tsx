"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CommunitySortTab } from "./_types";
import CommunityAnnouncements from "./components/community-announcements";
import CommunityPostList from "./components/community-post-list";
import CommunitySubnav from "./components/community-subnav";
import { communityPosts } from "@/lib/mocks/community";

const PAGE_SIZE = 8;

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<CommunitySortTab>("latest-post");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const sortedPosts = useMemo(() => {
    const posts = [...communityPosts];

    if (activeTab === "latest-post") {
      return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (activeTab === "latest-reply") {
      return posts.sort((a, b) => {
        const aTime = new Date(a.lastReplyAt ?? a.createdAt).getTime();
        const bTime = new Date(b.lastReplyAt ?? b.createdAt).getTime();
        return bTime - aTime;
      });
    }

    return posts.sort((a, b) => b.hotScore - a.hotScore);
  }, [activeTab]);

  const visiblePosts = useMemo(() => sortedPosts.slice(0, visibleCount), [sortedPosts, visibleCount]);
  const hasMore = visibleCount < sortedPosts.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab]);

  useEffect(() => {
    const target = loaderRef.current;

    if (!target || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) {
          return;
        }

        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, sortedPosts.length));
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: "120px 0px",
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, sortedPosts.length]);

  return (
    <main className="px-[10vw] space-y-4">
      <CommunitySubnav activeTab={activeTab} onTabChange={setActiveTab} />
      <CommunityAnnouncements />
      <CommunityPostList posts={visiblePosts} />
      <div ref={loaderRef} className="py-2 text-center text-xs text-muted-foreground">
        {hasMore ? "加载中..." : `已展示全部 ${sortedPosts.length} 条帖子`}
      </div>
    </main>
  );
}
