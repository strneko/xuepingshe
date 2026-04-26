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
  commentsLoading?: boolean;
  authorProfile: UserProfile;
  followingCount?: number;
  followerCount?: number;
  onPostChange?: (post: CommunityPost) => void;
  onDeleted?: () => void;
};

export default function CommunityPostDetailShell({
  post: initialPost,
  comments,
  commentsLoading = false,
  authorProfile,
  followingCount,
  followerCount,
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
  const [commentItems, setCommentItems] = React.useState<CommunityComment[]>(comments);
  const [commentValue, setCommentValue] = React.useState("");
  const [commentSubmitting, setCommentSubmitting] = React.useState(false);
  const commentInputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const isOwner = Boolean(currentUserId && post?.authorId && currentUserId === post.authorId);

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
  }, [commentSubmitting, commentValue, isLoggedIn, openAuthDialog, post.id, setPost]);

  const handleOpenMore = React.useCallback(() => {
    document.getElementById("post-more")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleDeletePost = React.useCallback(() => {
    void (async () => {
      if (!post || deleting) {
        return;
      }

      const shouldDelete = window.confirm("确认删除这篇帖子吗？删除后将无法恢复。");
      if (!shouldDelete) {
        return;
      }

      setDeleting(true);

      try {
        const response = await fetch(`/api/community/posts/${post.id}`, {
          method: "DELETE",
        });

        const data = (await response.json()) as { message?: string };
        if (!response.ok) {
          throw new Error(data.message ?? "删除失败");
        }

        toast.success(data.message ?? "帖子已删除");
        onDeleted?.();
        if (!onDeleted) {
          router.push("/community");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "删除失败";
        toast.error(message);
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
          commentValue={commentValue}
          commentSubmitting={commentSubmitting}
          onCommentValueChange={setCommentValue}
          onSubmitComment={handleSubmitComment}
          onFocusCommentBox={focusCommentBox}
          onToggleLike={handleToggleLike}
          liking={liking}
          commentInputRef={commentInputRef}
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
            followingCount={followingCount}
            followerCount={followerCount}
          />
        </div>
      </aside>
    </div>
  );
}
