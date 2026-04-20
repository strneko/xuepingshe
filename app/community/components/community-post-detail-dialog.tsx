"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommunityComment, CommunityPost } from "@/app/community/_types";
import CommunityPostDetailContent from "./community-post-detail-content";
import { toast } from "sonner";
import { useCommunityPostLike } from "@/app/community/hooks/use-community-post-like";

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
  } = useCommunityPostLike({
    initialPost: post,
    onPostChange,
  });
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentValue, setCommentValue] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open || !post?.id) {
      return;
    }

    setCommentValue("");
    setComments([]);

    const controller = new AbortController();

    void (async () => {
      try {
        setCommentsLoading(true);
        const response = await fetch(`/api/community/posts/${post.id}/comments?limit=100`, {
          method: "GET",
          signal: controller.signal,
        });

        const data = (await response.json()) as {
          items?: CommunityComment[];
        };

        if (!response.ok) {
          setComments([]);
          return;
        }

        setComments(data.items ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [open, post?.id]);

  const focusCommentBox = () => {
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleToggleLike = async () => {
    await toggleLike();
  };

  const handleSubmitComment = async () => {
    if (!dialogPost || commentSubmitting) {
      return;
    }

    const content = commentValue.trim();
    if (!content) {
      toast.error("评论内容不能为空");
      return;
    }

    setCommentSubmitting(true);

    try {
      const response = await fetch(`/api/community/posts/${dialogPost.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data = (await response.json()) as {
        message?: string;
        comment?: CommunityComment;
        commentCount?: number;
      };

      if (!response.ok) {
        throw new Error(data.message ?? "评论失败");
      }

      const comment = data.comment;

      if (comment) {
        setComments((current) => [...current, comment]);
      }

      if (typeof data.commentCount === "number") {
        setDialogPost((current) =>
          current
            ? {
                ...current,
                commentsCount: data.commentCount as number,
              }
            : current,
        );
        onPostChange?.({
          ...dialogPost,
          commentsCount: data.commentCount as number,
        });
      }

      setCommentValue("");
      toast.success("评论已发布");
    } catch (error) {
      const message = error instanceof Error ? error.message : "评论失败";
      toast.error(message);
    } finally {
      setCommentSubmitting(false);
    }
  };

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
                commentValue={commentValue}
                commentSubmitting={commentSubmitting}
                onCommentValueChange={setCommentValue}
                onSubmitComment={handleSubmitComment}
                onFocusCommentBox={focusCommentBox}
                onToggleLike={handleToggleLike}
                liking={liking}
                commentInputRef={commentInputRef}
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
