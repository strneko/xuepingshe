"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ellipsis, Heart, MessageCircle } from "lucide-react";

import UserInfoCard from "@/components/user-info-card";
import { Button } from "@/components/ui/button";
import { CommunityComment, CommunityPost } from "@/app/community/_types";
import { UserProfile, useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";
import { useCommunityPostLike } from "@/app/community/hooks/use-community-post-like";
import CommunityPostEditDialog from "./community-post-edit-dialog";

import CommunityPostDetailContent from "./community-post-detail-content";

type CommunityPostDetailShellProps = {
  post: CommunityPost;
  comments: CommunityComment[];
  hasMoreComments?: boolean;
  commentsLoading?: boolean;
  authorProfile: UserProfile;
  followingCount?: number;
  followerCount?: number;
  authorFollowed?: boolean;
  onPostChange?: (post: CommunityPost) => void;
  onDeleted?: () => void;
};

export default function CommunityPostDetailShell({
  post: initialPost,
  comments: initialComments,
  hasMoreComments: initialHasMore = false,
  commentsLoading = false,
  authorProfile,
  followingCount,
  followerCount,
  authorFollowed = false,
  onPostChange,
  onDeleted,
}: CommunityPostDetailShellProps) {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { post, setPost, liking, toggleLike } = useCommunityPostLike({ initialPost, onPostChange });
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const openAuthDialog = useAuthStore((state) => state.openAuthDialog);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [commentItems, setCommentItems] = React.useState<CommunityComment[]>(initialComments);
  const [commentValue, setCommentValue] = React.useState("");
  const [commentSubmitting, setCommentSubmitting] = React.useState(false);
  const commentInputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const isOwner = Boolean(currentUserId && post?.authorId && currentUserId === post.authorId);

  // Comment pagination
  const [hasMoreComments, setHasMoreComments] = React.useState(initialHasMore);
  const [commentsLoadingMore, setCommentsLoadingMore] = React.useState(false);

  // Reply state
  const [replyTarget, setReplyTarget] = React.useState<CommunityComment | null>(null);
  const [replySubmitting, setReplySubmitting] = React.useState(false);

  // Edit state
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null);
  const [editingContent, setEditingContent] = React.useState("");
  const [editSubmitting, setEditSubmitting] = React.useState(false);

  React.useEffect(() => {
    setCommentItems(initialComments);
    setHasMoreComments(initialHasMore);
  }, [initialComments, initialHasMore]);

  const handleToggleLike = React.useCallback(async () => {
    await toggleLike();
  }, [toggleLike]);

  const focusCommentBox = React.useCallback(() => {
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // --- Comment submission (top-level only, replies use inline box) ---
  const handleSubmitComment = React.useCallback(async () => {
    if (commentSubmitting) return;
    if (!isLoggedIn) {
      openAuthDialog();
      return;
    }

    const content = commentValue.trim();
    if (!content) {
      toast.error("评论内容不能为空");
      return;
    }

    setCommentSubmitting(true);

    try {
      const response = await fetch(`/api/community/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = (await response.json()) as {
        message?: string;
        comment?: CommunityComment;
        commentCount?: number;
      };

      if (!response.ok) throw new Error(data.message ?? "评论失败");

      if (data.comment) {
        setCommentItems((current) => [...current, data.comment!]);
      }
      if (typeof data.commentCount === "number") {
        const nextCount = data.commentCount;
        setPost((current) => ({ ...current, commentsCount: nextCount }));
      }

      setCommentValue("");
      toast.success("评论已发布");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "评论失败");
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentSubmitting, commentValue, isLoggedIn, openAuthDialog, post.id, setPost]);

  // --- Reply ---
  const handleReplyClick = React.useCallback(
    (comment: CommunityComment) => {
      if (!isLoggedIn) {
        openAuthDialog();
        return;
      }
      setReplyTarget(comment);
    },
    [isLoggedIn, openAuthDialog],
  );

  const handleCancelReply = React.useCallback(() => {
    setReplyTarget(null);
  }, []);

  const handleSubmitReply = React.useCallback(
    async (content: string, replyToCommentId: string) => {
      if (!isLoggedIn) {
        openAuthDialog();
        return;
      }
      setReplySubmitting(true);

      try {
        const response = await fetch(`/api/community/posts/${post.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, replyToCommentId }),
        });

        const data = (await response.json()) as {
          message?: string;
          comment?: CommunityComment;
          commentCount?: number;
        };

        if (!response.ok) throw new Error(data.message ?? "评论失败");

        if (data.comment) {
          setCommentItems((current) => [...current, data.comment!]);
        }
        if (typeof data.commentCount === "number") {
          const nextCount = data.commentCount;
          setPost((current) => ({ ...current, commentsCount: nextCount }));
        }

        setReplyTarget(null);
        toast.success("回复已发布");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "回复失败");
      } finally {
        setReplySubmitting(false);
      }
    },
    [isLoggedIn, openAuthDialog, post.id, setPost],
  );

  // --- Edit ---
  const handleEditClick = React.useCallback((comment: CommunityComment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  }, []);

  const handleCancelEdit = React.useCallback(() => {
    setEditingCommentId(null);
    setEditingContent("");
  }, []);

  const handleSaveEdit = React.useCallback(
    async (commentId: string) => {
      if (!editingContent.trim()) {
        toast.error("评论内容不能为空");
        return;
      }
      setEditSubmitting(true);

      try {
        const response = await fetch(`/api/community/posts/${post.id}/comments/${commentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editingContent.trim() }),
        });

        const data = (await response.json()) as { message?: string; comment?: CommunityComment };

        if (!response.ok) throw new Error(data.message ?? "编辑失败");

        setEditingCommentId(null);
        setEditingContent("");

        if (data.comment) {
          setCommentItems((current) => current.map((c) => (c.id === commentId ? data.comment! : c)));
        }
        toast.success("评论已更新");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "编辑失败");
      } finally {
        setEditSubmitting(false);
      }
    },
    [editingContent, post.id],
  );

  // --- Delete ---
  const handleDeleteComment = React.useCallback(
    async (commentId: string) => {
      const shouldDelete = window.confirm("确认删除这条评论吗？");
      if (!shouldDelete) return;

      try {
        const response = await fetch(`/api/community/posts/${post.id}/comments/${commentId}`, {
          method: "DELETE",
        });

        const data = (await response.json()) as { message?: string };

        if (!response.ok) throw new Error(data.message ?? "删除失败");

        setCommentItems((current) => current.filter((c) => c.id !== commentId));
        setPost((current) => ({
          ...current,
          commentsCount: Math.max(0, current.commentsCount - 1),
        }));
        toast.success("评论已删除");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "删除失败");
      }
    },
    [post.id, setPost],
  );

  // --- Load more ---
  const handleLoadMoreComments = React.useCallback(async () => {
    setCommentsLoadingMore(true);
    try {
      const response = await fetch(`/api/community/posts/${post.id}/comments?offset=${commentItems.length}&limit=20`, {
        method: "GET",
      });

      const data = (await response.json()) as {
        items?: CommunityComment[];
        hasMore?: boolean;
      };

      if (!response.ok) throw new Error("加载失败");

      if (data.items?.length) {
        setCommentItems((current) => [...current, ...data.items!]);
      }
      setHasMoreComments(Boolean(data.hasMore));
    } catch {
      toast.error("加载评论失败");
    } finally {
      setCommentsLoadingMore(false);
    }
  }, [commentItems.length, post.id]);

  const handleOpenMore = React.useCallback(() => {
    document.getElementById("post-more")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleDeletePost = React.useCallback(() => {
    void (async () => {
      if (!post || deleting) return;

      const shouldDelete = window.confirm("确认删除这篇帖子吗？删除后将无法恢复。");
      if (!shouldDelete) return;

      setDeleting(true);

      try {
        const response = await fetch(`/api/community/posts/${post.id}`, { method: "DELETE" });

        const data = (await response.json()) as { message?: string };
        if (!response.ok) throw new Error(data.message ?? "删除失败");

        toast.success(data.message ?? "帖子已删除");
        onDeleted?.();
        if (!onDeleted) router.push("/community");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "删除失败");
      } finally {
        setDeleting(false);
      }
    })();
  }, [deleting, onDeleted, post, router]);

  return (
    <div className="grid gap-6 lg:grid-cols-[72px_minmax(0,1fr)_260px]">
      <aside className="hidden lg:block">
        <div className="sticky top-8 rounded-2xl border bg-card p-2 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            className="flex h-auto w-full flex-col items-center gap-1 rounded-xl px-3 py-3 text-xs text-muted-foreground transition hover:bg-muted/60"
            onClick={handleToggleLike}
            disabled={liking}
          >
            <Heart className={post.isLiked ? "size-4 fill-current text-rose-500" : "size-4"} />
            {post.isLiked ? "已点赞" : "点赞"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="mt-1 flex h-auto w-full flex-col items-center gap-1 rounded-xl px-3 py-3 text-xs text-muted-foreground transition hover:bg-muted/60"
            onClick={focusCommentBox}
          >
            <MessageCircle className="size-4" />
            评论
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="mt-1 flex h-auto w-full flex-col items-center gap-1 rounded-xl px-3 py-3 text-xs text-muted-foreground transition hover:bg-muted/60"
            onClick={handleOpenMore}
          >
            <Ellipsis className="size-4" />
            更多
          </Button>
        </div>
      </aside>

      <section className="rounded-2xl border bg-card py-6 shadow-sm">
        {isOwner ? (
          <div className="flex items-center justify-end gap-2 border-b px-6 pb-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              编辑帖子
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => void handleDeletePost()}
              disabled={deleting}
            >
              {deleting ? "删除中..." : "删除帖子"}
            </Button>
          </div>
        ) : null}
        <CommunityPostDetailContent
          post={post}
          hideHeader
          comments={commentItems}
          commentsLoading={commentsLoading}
          hasMoreComments={hasMoreComments}
          commentsLoadingMore={commentsLoadingMore}
          commentValue={commentValue}
          commentSubmitting={commentSubmitting}
          replyTarget={replyTarget}
          replySubmitting={replySubmitting}
          editingCommentId={editingCommentId}
          editingContent={editingContent}
          editSubmitting={editSubmitting}
          currentUserId={currentUserId}
          onCommentValueChange={setCommentValue}
          onSubmitComment={handleSubmitComment}
          onFocusCommentBox={focusCommentBox}
          onToggleLike={handleToggleLike}
          liking={liking}
          commentInputRef={commentInputRef}
          onReplyClick={handleReplyClick}
          onCancelReply={handleCancelReply}
          onSubmitReply={handleSubmitReply}
          onEditClick={handleEditClick}
          onCancelEdit={handleCancelEdit}
          onEditingContentChange={setEditingContent}
          onSaveEdit={handleSaveEdit}
          onDeleteComment={handleDeleteComment}
          onLoadMoreComments={handleLoadMoreComments}
        />
        <CommunityPostEditDialog
          post={post}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={(nextPost) => {
            setPost(nextPost);
            onPostChange?.(nextPost);
          }}
        />
      </section>

      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <UserInfoCard
            user={authorProfile}
            hideActions
            hidePoints
            showFollowButton
            showMessageButton
            initialFollowing={authorFollowed}
          />
        </div>
      </aside>
    </div>
  );
}
