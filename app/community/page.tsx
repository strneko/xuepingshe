"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CommunityAnnouncement, CommunitySortTab, CommunityPost } from "./_types";
import CommunityAnnouncements from "./components/community-announcements";
import CommunityPostDetailDialog from "./components/community-post-detail-dialog";
import CommunityPostList from "./components/community-post-list";
import CommunitySubnav from "./components/community-subnav";
import { useCommunityPostsLike } from "./hooks/use-community-post-like";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const { likingPostIds, toggleLike } = useCommunityPostsLike({ setPosts });
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // 用 ref 保存分页运行态，避免把这些状态放进 loadPosts 依赖后引发 effect 循环。
  const loadingRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const requestSeqRef = useRef(0);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const selectedPost = selectedPostId ? (posts.find((post) => post.id === selectedPostId) ?? null) : null;

  // Admin state
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = Boolean(currentUser?.isAdmin);
  const [announcementFormOpen, setAnnouncementFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<CommunityAnnouncement | null>(null);
  const [announceFormTitle, setAnnounceFormTitle] = useState("");
  const [announceFormHref, setAnnounceFormHref] = useState("");
  const [announceFormPinned, setAnnounceFormPinned] = useState(true);
  const [announceFormSubmitting, setAnnounceFormSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const loadAnnouncements = useCallback(async () => {
    const response = await fetch("/api/community/announcements?limit=20", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { items?: CommunityAnnouncement[] };
    setAnnouncements(data.items ?? []);
  }, []);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  const openNewAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnounceFormTitle("");
    setAnnounceFormHref("");
    setAnnounceFormPinned(true);
    setAnnouncementFormOpen(true);
  };

  const openEditAnnouncement = (item: CommunityAnnouncement) => {
    setEditingAnnouncement(item);
    setAnnounceFormTitle(item.title);
    setAnnounceFormHref(item.href ?? "");
    setAnnounceFormPinned(item.pinned);
    setAnnouncementFormOpen(true);
  };

  const submitAnnounceForm = async () => {
    const title = announceFormTitle.trim();
    if (!title) {
      toast.error("公告标题不能为空");
      return;
    }

    setAnnounceFormSubmitting(true);
    try {
      const isEdit = editingAnnouncement !== null;
      const url = isEdit
        ? `/api/admin/community/announcements/${editingAnnouncement.id}`
        : "/api/admin/community/announcements";
      const method = isEdit ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        title,
        href: announceFormHref.trim() || null,
        pinned: announceFormPinned,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? (isEdit ? "更新失败" : "创建失败"));
        return;
      }

      toast.success(isEdit ? "公告已更新" : "公告已发布");
      setAnnouncementFormOpen(false);
      setEditingAnnouncement(null);
      await loadAnnouncements();
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setAnnounceFormSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (item: CommunityAnnouncement) => {
    if (deleteConfirmId) return;
    setDeleteConfirmId(item.id);
    try {
      const response = await fetch(`/api/admin/community/announcements/${item.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "删除失败");
        return;
      }
      toast.success("公告已删除");
      setDeleteConfirmId(null);
      await loadAnnouncements();
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleMoveAnnouncement = async (item: CommunityAnnouncement, direction: -1 | 1) => {
    const index = announcements.findIndex((a) => a.id === item.id);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= announcements.length) return;

    const target = announcements[targetIndex];
    const newItems = [...announcements];
    newItems[index] = { ...target, sortOrder: item.sortOrder };
    newItems[targetIndex] = { ...item, sortOrder: target.sortOrder };
    setAnnouncements(newItems);

    try {
      await Promise.all([
        fetch(`/api/admin/community/announcements/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: target.sortOrder }),
        }),
        fetch(`/api/admin/community/announcements/${target.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: item.sortOrder }),
        }),
      ]);
    } catch {
      toast.error("排序更新失败");
      await loadAnnouncements();
    }
  };

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

  const handleToggleLike = useCallback(
    async (postId: string) => {
      await toggleLike(postId);
    },
    [toggleLike],
  );

  const handleOpenPost = useCallback(
    (postId: string) => {
      const targetPost = posts.find((post) => post.id === postId);
      if (targetPost) {
        void fetch("/api/profile/browse-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kind: "COMMUNITY_POST",
            targetId: targetPost.id,
            title: targetPost.title,
            href: `/community/${targetPost.id}`,
          }),
          keepalive: true,
        });
      }

      setSelectedPostId(postId);
    },
    [posts],
  );

  const handlePostUpdate = useCallback((nextPost: CommunityPost) => {
    setPosts((current) => current.map((post) => (post.id === nextPost.id ? nextPost : post)));
  }, []);

  return (
    <main className="px-[10vw] space-y-4">
      <CommunitySubnav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={isAdmin}
        onNewAnnouncement={openNewAnnouncement}
      />
      <CommunityAnnouncements
        items={announcements}
        isAdmin={isAdmin}
        onEdit={openEditAnnouncement}
        onDelete={handleDeleteAnnouncement}
        onMoveUp={(item) => void handleMoveAnnouncement(item, -1)}
        onMoveDown={(item) => void handleMoveAnnouncement(item, 1)}
      />
      <CommunityPostList
        posts={posts}
        likingPostIds={likingPostIds}
        onToggleLike={handleToggleLike}
        onOpenPost={handleOpenPost}
      />
      <CommunityPostDetailDialog
        post={selectedPost}
        open={Boolean(selectedPostId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPostId(null);
          }
        }}
        onPostChange={handlePostUpdate}
      />
      {/* Announcement form dialog (admin) */}
      <Dialog
        open={announcementFormOpen}
        onOpenChange={(open) => {
          if (announceFormSubmitting) return;
          setAnnouncementFormOpen(open);
          if (!open) setEditingAnnouncement(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? "编辑公告" : "发布公告"}</DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? "修改公告内容" : "发布一条新的社区公告"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor="announce-title" className="text-xs">公告标题</Label>
              <Input
                id="announce-title"
                value={announceFormTitle}
                onChange={(e) => setAnnounceFormTitle(e.target.value)}
                placeholder="公告标题"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="announce-href" className="text-xs">链接地址（可选）</Label>
              <Input
                id="announce-href"
                value={announceFormHref}
                onChange={(e) => setAnnounceFormHref(e.target.value)}
                placeholder="/community 或其他链接"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="announce-pinned"
                checked={announceFormPinned}
                onCheckedChange={(v) => setAnnounceFormPinned(Boolean(v))}
              />
              <Label htmlFor="announce-pinned" className="text-sm cursor-pointer">置顶</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAnnouncementFormOpen(false);
                setEditingAnnouncement(null);
              }}
              disabled={announceFormSubmitting}
            >
              取消
            </Button>
            <Button onClick={() => void submitAnnounceForm()} disabled={announceFormSubmitting}>
              {announceFormSubmitting ? "提交中..." : editingAnnouncement ? "保存修改" : "发布公告"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog (admin) */}
      <Dialog open={Boolean(deleteConfirmId)} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除公告</DialogTitle>
            <DialogDescription>此操作不可撤销，确认删除该公告吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const item = announcements.find((a) => a.id === deleteConfirmId);
                if (item) void handleDeleteAnnouncement(item);
              }}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div ref={loaderRef} className="py-2 text-center text-xs text-muted-foreground">
        {isLoading ? "加载中..." : hasMore ? "上滑加载更多" : `已展示全部 ${posts.length} 条帖子`}
      </div>
    </main>
  );
}
