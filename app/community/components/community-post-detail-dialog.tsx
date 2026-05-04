"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommunityComment, CommunityPost } from "@/app/community/_types";
import CommunityPostDetailContent from "./community-post-detail-content";
import { toast } from "sonner";
import { useCommunityPostLike } from "@/app/community/hooks/use-community-post-like";
import { useAuthStore } from "@/lib/stores/auth-store";

type CommunityPostDetailDialogProps = {
  post: CommunityPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostChange?: (post: CommunityPost) => void;
};

export default function CommunityPostDetailDialog({
  post,
  open,
  onOpenChange,
  onPostChange,
}: CommunityPostDetailDialogProps) {
  const {
    post: dialogPost,
    setPost: setDialogPost,
    liking,
    toggleLike,
  } = useCommunityPostLike({ initialPost: post, onPostChange });
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);
  const [commentValue, setCommentValue] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const openAuthDialog = useAuthStore((state) => state.openAuthDialog);

  // Reply state
  const [replyTarget, setReplyTarget] = useState<CommunityComment | null>(null);
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !post?.id) return;

    setCommentValue("");
    setComments([]);
    setReplyTarget(null);
    setEditingCommentId(null);

    const controller = new AbortController();

    void (async () => {
      try {
        setCommentsLoading(true);
        const response = await fetch(`/api/community/posts/${post.id}/comments?limit=20`, {
          method: "GET",
          signal: controller.signal,
        });

        const data = (await response.json()) as {
          items?: CommunityComment[];
          hasMore?: boolean;
        };

        if (!response.ok) { setComments([]); return; }

        setComments(data.items ?? []);
        setHasMoreComments(Boolean(data.hasMore));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    })();

    return () => { controller.abort(); };
  }, [open, post?.id]);

  const focusCommentBox = () => {
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleToggleLike = async () => { await toggleLike(); };

  // --- Comment submission ---
  // --- Comment submission (top-level only, replies use inline box) ---
  const handleSubmitComment = async () => {
    if (!dialogPost || commentSubmitting) return;
    if (!isLoggedIn) { openAuthDialog(); return; }

    const content = commentValue.trim();
    if (!content) { toast.error("评论内容不能为空"); return; }

    setCommentSubmitting(true);
    try {
      const response = await fetch(`/api/community/posts/${dialogPost.id}/comments`, {
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
        setComments((current) => [...current, data.comment!]);
      }
      if (typeof data.commentCount === "number") {
        const nextCount = data.commentCount;
        setDialogPost((current) =>
          current ? { ...current, commentsCount: nextCount } : current,
        );
      }

      setCommentValue("");
      toast.success("评论已发布");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "评论失败");
    } finally {
      setCommentSubmitting(false);
    }
  };

  // --- Reply ---
  const handleReplyClick = useCallback((comment: CommunityComment) => {
    if (!isLoggedIn) {
      openAuthDialog();
      return;
    }
    setReplyTarget(comment);
  }, [isLoggedIn, openAuthDialog]);

  const handleCancelReply = useCallback(() => { setReplyTarget(null); }, []);

  const handleSubmitReply = useCallback(async (content: string, replyToCommentId: string) => {
    if (!dialogPost || !isLoggedIn) { openAuthDialog(); return; }
    setReplySubmitting(true);
    try {
      const response = await fetch(`/api/community/posts/${dialogPost.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, replyToCommentId }),
      });
      const data = (await response.json()) as { message?: string; comment?: CommunityComment; commentCount?: number };
      if (!response.ok) throw new Error(data.message ?? "回复失败");
      if (data.comment) setComments((current) => [...current, data.comment!]);
      if (typeof data.commentCount === "number") {
        const nextCount = data.commentCount;
        setDialogPost((current) => current ? { ...current, commentsCount: nextCount } : current);
      }
      setReplyTarget(null);
      toast.success("回复已发布");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "回复失败");
    } finally {
      setReplySubmitting(false);
    }
  }, [dialogPost, isLoggedIn, openAuthDialog, setDialogPost]);

  // --- Edit ---
  const handleEditClick = useCallback((comment: CommunityComment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditingContent("");
  }, []);

  const handleSaveEdit = useCallback(async (commentId: string) => {
    if (!editingContent.trim() || !dialogPost) { toast.error("评论内容不能为空"); return; }
    setEditSubmitting(true);
    try {
      const response = await fetch(`/api/community/posts/${dialogPost.id}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingContent.trim() }),
      });
      const data = (await response.json()) as { message?: string; comment?: CommunityComment };
      if (!response.ok) throw new Error(data.message ?? "编辑失败");
      setEditingCommentId(null);
      setEditingContent("");
      if (data.comment) {
        setComments((current) => current.map((c) => (c.id === commentId ? data.comment! : c)));
      }
      toast.success("评论已更新");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "编辑失败");
    } finally {
      setEditSubmitting(false);
    }
  }, [editingContent, dialogPost]);

  // --- Delete ---
  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!dialogPost) return;
    const shouldDelete = window.confirm("确认删除这条评论吗？");
    if (!shouldDelete) return;
    try {
      const response = await fetch(`/api/community/posts/${dialogPost.id}/comments/${commentId}`, { method: "DELETE" });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "删除失败");
      setComments((current) => current.filter((c) => c.id !== commentId));
      setDialogPost((current) => current ? { ...current, commentsCount: Math.max(0, current.commentsCount - 1) } : current);
      toast.success("评论已删除");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    }
  }, [dialogPost, setDialogPost]);

  // --- Load more ---
  const handleLoadMoreComments = useCallback(async () => {
    if (!dialogPost) return;
    setCommentsLoadingMore(true);
    try {
      const response = await fetch(
        `/api/community/posts/${dialogPost.id}/comments?offset=${comments.length}&limit=20`,
        { method: "GET" },
      );
      const data = (await response.json()) as { items?: CommunityComment[]; hasMore?: boolean };
      if (!response.ok) throw new Error("加载失败");
      if (data.items?.length) setComments((current) => [...current, ...data.items!]);
      setHasMoreComments(Boolean(data.hasMore));
    } catch {
      toast.error("加载评论失败");
    } finally {
      setCommentsLoadingMore(false);
    }
  }, [comments.length, dialogPost]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[90dvh] rounded-xl border-y-0 p-0 "
        style={{ width: "60vw", maxWidth: "60vw", height: "90dvh" }}
      >
        <DialogHeader className="h-8">
          <DialogTitle className="sr-only">帖子详情弹窗</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90dvh-84px)]">
          <div>
            {dialogPost ? (
              <CommunityPostDetailContent
                post={dialogPost}
                comments={comments}
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
            ) : (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                暂未找到该帖子内容
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
