"use client";

import * as React from "react";
import { Ellipsis, Heart, MessageCircle } from "lucide-react";

import UserInfoCard from "@/components/user-info-card";
import { Button } from "@/components/ui/button";
import { CommunityComment, CommunityPost } from "@/app/community/_types";
import { UserProfile } from "@/lib/stores/auth-store";
import { toast } from "sonner";
import { useCommunityPostLike } from "@/app/community/hooks/use-community-post-like";

import CommunityPostDetailContent from "./community-post-detail-content";

type CommunityPostDetailShellProps = {
  post: CommunityPost;
  comments: CommunityComment[];
  authorProfile: UserProfile;
};

export default function CommunityPostDetailShell({
  post: initialPost,
  comments,
  authorProfile,
}: CommunityPostDetailShellProps) {
  const { post, setPost, liking, toggleLike } = useCommunityPostLike({ initialPost });
  const [commentItems, setCommentItems] = React.useState<CommunityComment[]>(comments);
  const [commentValue, setCommentValue] = React.useState("");
  const [commentSubmitting, setCommentSubmitting] = React.useState(false);
  const commentInputRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    setCommentItems(comments);
  }, [comments]);

  const handleToggleLike = React.useCallback(async () => {
    await toggleLike();
  }, [toggleLike]);

  const focusCommentBox = React.useCallback(() => {
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleSubmitComment = React.useCallback(async () => {
    if (commentSubmitting) {
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
        setCommentItems((current) => [...current, comment]);
      }

      if (typeof data.commentCount === "number") {
        setPost((current) => ({
          ...current,
          commentsCount: data.commentCount as number,
        }));
      }

      setCommentValue("");
      toast.success("评论已发布");
    } catch (error) {
      const message = error instanceof Error ? error.message : "评论失败";
      toast.error(message);
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentSubmitting, commentValue, post.id, setPost]);

  const handleOpenMore = React.useCallback(() => {
    document.getElementById("post-more")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
        <CommunityPostDetailContent
          post={post}
          hideHeader
          comments={commentItems}
          commentValue={commentValue}
          commentSubmitting={commentSubmitting}
          onCommentValueChange={setCommentValue}
          onSubmitComment={handleSubmitComment}
          onFocusCommentBox={focusCommentBox}
          onToggleLike={handleToggleLike}
          liking={liking}
          commentInputRef={commentInputRef}
        />
      </section>

      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <UserInfoCard user={authorProfile} hideActions hidePoints showFollowButton showMessageButton />
        </div>
      </aside>
    </div>
  );
}
