"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, ExternalLink } from "lucide-react";
import { CommunityComment, CommunityPost } from "@/app/community/_types";
import { formatRelativeTime } from "@/lib/time/format-relative-time";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

type CommunityPostDetailContentProps = {
  post: CommunityPost;
  hideHeader?: boolean;
  comments?: CommunityComment[];
  commentsLoading?: boolean;
  commentValue?: string;
  commentSubmitting?: boolean;
  onCommentValueChange?: (value: string) => void;
  onSubmitComment?: () => void;
  onFocusCommentBox?: () => void;
  onToggleLike?: () => void;
  liking?: boolean;
  commentInputRef?: React.RefObject<HTMLTextAreaElement | null>;
};

export default function CommunityPostDetailContent({
  post,
  hideHeader = false,
  comments = [],
  commentsLoading = false,
  commentValue = "",
  commentSubmitting = false,
  onCommentValueChange = () => {},
  onSubmitComment = () => {},
  onFocusCommentBox = () => {},
  onToggleLike = () => {},
  liking = false,
  commentInputRef,
}: CommunityPostDetailContentProps) {
  return (
    <article className="space-y-0">
      {!hideHeader ? (
        <header className="border-b px-6 pb-5">
          <div className="flex items-center gap-3">
            <Avatar className="size-11">
              <AvatarImage src={post.author.avatarUrl ?? ""} alt={post.author.nickname} />
              <AvatarFallback>{post.author.nickname.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{post.author.nickname}</p>
              <p className="text-xs text-muted-foreground">发布于 {formatRelativeTime(post.createdAt)}</p>
            </div>

            <Button asChild variant="outline" size="sm">
              <Link
                href={`/community/${post.id}`}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                <ExternalLink className="size-4" />
                查看原帖
              </Link>
            </Button>
          </div>
        </header>
      ) : null}

      <section className={cn("space-y-4 border-b px-6", hideHeader ? "pb-5" : "py-5")}>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{post.title}</h1>
        </div>

        <div className="rounded-2xl border bg-muted/20 p-5 text-sm leading-7 text-foreground/90">{post.content}</div>

        {post.images.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {post.images.map((src) => (
              <div key={src} className="overflow-hidden rounded-xl border bg-background">
                <img src={src} alt="帖子配图" className="h-44 w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={`${post.id}-${tag}`} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
        <div id="post-actions" className="flex items-center justify-between gap-4  ">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>点赞 {post.likesCount}</span>
            <span>·</span>
            <span>评论 {post.commentsCount}</span>
            <span>·</span>
            <span>热度 {post.hotScore}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("px-2 text-xs", post.isLiked && "text-rose-500 hover:text-rose-500")}
              onClick={onToggleLike}
              disabled={liking}
            >
              <Heart className={cn("size-3.5", post.isLiked && "fill-current")} />
              {post.isLiked ? "已点赞" : "点赞"}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="px-2 text-xs" onClick={onFocusCommentBox}>
              <MessageCircle className="size-3.5" />共 {post.commentsCount} 条评论
            </Button>
          </div>
        </div>
      </section>

      <section id="post-more" className="px-6 py-5">
        <h2 className="mb-4 text-sm font-medium text-foreground">评论区</h2>

        <div className="mb-5 rounded-2xl border bg-background p-4">
          <div className="space-y-3">
            <Textarea
              id="community-comment-box"
              ref={commentInputRef}
              value={commentValue}
              onChange={(event) => onCommentValueChange(event.target.value)}
              placeholder="写下你的评论..."
              className="min-h-24 resize-none"
            />
            <div className="flex justify-end">
              <Button type="button" onClick={onSubmitComment} disabled={commentSubmitting || !commentValue.trim()}>
                {commentSubmitting ? "发送中..." : "发表评论"}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {commentsLoading ? (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              评论加载中...
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <article key={comment.id} className="rounded-xl border bg-muted/20 px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{comment.author.nickname}</span>
                  <span>{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="text-sm leading-6 text-foreground/90">{comment.content}</p>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              暂无评论，快来发表第一条评论吧。
            </div>
          )}
        </div>
      </section>
    </article>
  );
}
