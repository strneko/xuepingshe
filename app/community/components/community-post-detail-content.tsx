"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, ExternalLink, Loader2 } from "lucide-react";
import { PhotoSlider } from "react-photo-view";
import { CommunityComment, CommunityPost } from "@/app/community/_types";
import { CommentTreeItem, buildCommentTree } from "@/lib/community/comment-tree";
import { formatRelativeTime } from "@/lib/time/format-relative-time";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import ReportButton from "./report-button";

type CommunityPostDetailContentProps = {
  post: CommunityPost;
  hideHeader?: boolean;
  comments?: CommunityComment[];
  commentsLoading?: boolean;
  hasMoreComments?: boolean;
  commentsLoadingMore?: boolean;
  commentValue?: string;
  commentSubmitting?: boolean;
  replyTarget?: CommunityComment | null;
  replySubmitting?: boolean;
  editingCommentId?: string | null;
  editingContent?: string;
  editSubmitting?: boolean;
  currentUserId?: string | null;
  onCommentValueChange?: (value: string) => void;
  onSubmitComment?: () => void;
  onFocusCommentBox?: () => void;
  onToggleLike?: () => void;
  liking?: boolean;
  commentInputRef?: React.RefObject<HTMLTextAreaElement | null>;
  onReplyClick?: (comment: CommunityComment) => void;
  onCancelReply?: () => void;
  onSubmitReply?: (content: string, replyToCommentId: string) => void;
  onEditClick?: (comment: CommunityComment) => void;
  onCancelEdit?: () => void;
  onEditingContentChange?: (content: string) => void;
  onSaveEdit?: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onLoadMoreComments?: () => void;
};

function CommentNode({
  item,
  depth,
  postId,
  currentUserId,
  replyTarget,
  replySubmitting,
  editingCommentId,
  editingContent,
  editSubmitting,
  onReplyClick,
  onCancelReply,
  onSubmitReply,
  onEditClick,
  onCancelEdit,
  onEditingContentChange,
  onSaveEdit,
  onDeleteComment,
}: {
  item: CommentTreeItem;
  depth: number;
  postId: string;
  currentUserId?: string | null;
  replyTarget?: CommunityComment | null;
  replySubmitting?: boolean;
  editingCommentId?: string | null;
  editingContent?: string;
  editSubmitting?: boolean;
  onReplyClick?: (comment: CommunityComment) => void;
  onCancelReply?: () => void;
  onSubmitReply?: (content: string, replyToCommentId: string) => void;
  onEditClick?: (comment: CommunityComment) => void;
  onCancelEdit?: () => void;
  onEditingContentChange?: (content: string) => void;
  onSaveEdit?: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
}) {
  const isOwner = Boolean(currentUserId && item.authorId === currentUserId);
  const isEditing = editingCommentId === item.id;
  const isReplying = replyTarget?.id === item.id;
  const hasReplies = item.replies.length > 0;
  const [replyValue, setReplyValue] = React.useState("");
  const [showReplies, setShowReplies] = React.useState(false);
  const replyTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const replyButtonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (isReplying) {
      setShowReplies(true);
      replyTextareaRef.current?.focus();
    }
  }, [isReplying]);

  // 关闭回复框后，焦点回到该评论的回复按钮
  const prevIsReplyingRef = React.useRef(isReplying);
  React.useEffect(() => {
    const wasReplying = prevIsReplyingRef.current;
    prevIsReplyingRef.current = isReplying;
    if (wasReplying && !isReplying && replyButtonRef.current) {
      replyButtonRef.current.focus();
    }
  }, [isReplying]);

  const handleSubmitReply = () => {
    const trimmed = replyValue.trim();
    if (!trimmed || !onSubmitReply) return;
    onSubmitReply(trimmed, item.id);
    setReplyValue("");
  };

  const comment: CommunityComment = {
    id: item.id,
    content: item.content,
    authorId: item.authorId,
    replyToCommentId: item.replyToCommentId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    author: item.author,
  };

  return (
    <div className={cn(depth > 0 && "ml-6 border-l-2 border-muted pl-4")}>
      <article className="rounded-xl border bg-muted/20 px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{item.author.nickname}</span>
          <span>
            {item.updatedAt !== item.createdAt
              ? `编辑于 ${formatRelativeTime(item.updatedAt)}`
              : formatRelativeTime(item.createdAt)}
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editingContent ?? item.content}
              onChange={(e) => onEditingContentChange?.(e.target.value)}
              className="min-h-20 resize-none text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onCancelEdit} disabled={editSubmitting}>
                取消
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => onSaveEdit?.(item.id)}
                disabled={editSubmitting || !(editingContent ?? "").trim()}
              >
                {editSubmitting ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-6 text-foreground/90">{item.content}</p>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              ref={replyButtonRef}
              type="button"
              variant="ghost"
              size="sm"
              className="px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onReplyClick?.(comment)}
            >
              回复
            </Button>
            {hasReplies && !showReplies ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowReplies(true)}
              >
                展开 {item.replies.length} 条回复
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            {isOwner && !isEditing ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onEditClick?.(comment)}
                >
                  编辑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteComment?.(item.id)}
                >
                  删除
                </Button>
              </>
            ) : null}
            <ReportButton reportType="COMMENT" targetPostId={postId} targetCommentId={item.id} />
          </div>
        </div>

        {showReplies ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowReplies(false)}
          >
            收起回复
          </Button>
        ) : null}

        {isReplying ? (
          <div className="mt-3 space-y-2">
            <Textarea
              ref={replyTextareaRef}
              value={replyValue}
              onChange={(e) => setReplyValue(e.target.value)}
              placeholder={`回复 @${replyTarget?.author.nickname ?? "匿名同学"}...`}
              className="min-h-20 resize-none text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onCancelReply} disabled={replySubmitting}>
                取消
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmitReply}
                disabled={replySubmitting || !replyValue.trim()}
              >
                {replySubmitting ? "发送中..." : "回复"}
              </Button>
            </div>
          </div>
        ) : null}
      </article>

      {showReplies && hasReplies ? (
        <div className="mt-3 space-y-3">
          {item.replies.map((child) => (
            <CommentNode
              key={child.id}
              item={child}
              depth={depth + 1}
              postId={postId}
              currentUserId={currentUserId}
              replyTarget={replyTarget}
              replySubmitting={replySubmitting}
              editingCommentId={editingCommentId}
              editingContent={editingContent}
              editSubmitting={editSubmitting}
              onReplyClick={onReplyClick}
              onCancelReply={onCancelReply}
              onSubmitReply={onSubmitReply}
              onEditClick={onEditClick}
              onCancelEdit={onCancelEdit}
              onEditingContentChange={onEditingContentChange}
              onSaveEdit={onSaveEdit}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CommunityPostDetailContent({
  post,
  hideHeader = false,
  comments = [],
  commentsLoading = false,
  hasMoreComments = false,
  commentsLoadingMore = false,
  commentValue = "",
  commentSubmitting = false,
  replyTarget = null,
  replySubmitting = false,
  editingCommentId = null,
  editingContent = "",
  editSubmitting = false,
  currentUserId = null,
  onCommentValueChange = () => {},
  onSubmitComment = () => {},
  onFocusCommentBox = () => {},
  onToggleLike = () => {},
  liking = false,
  commentInputRef,
  onReplyClick = () => {},
  onCancelReply = () => {},
  onSubmitReply = () => {},
  onEditClick = () => {},
  onCancelEdit = () => {},
  onEditingContentChange = () => {},
  onSaveEdit = () => {},
  onDeleteComment = () => {},
  onLoadMoreComments = () => {},
}: CommunityPostDetailContentProps) {
  const isEdited = post.updatedAt !== post.createdAt;
  const timeText = isEdited
    ? `编辑于 ${formatRelativeTime(post.updatedAt)}`
    : `发布于 ${formatRelativeTime(post.createdAt)}`;

  const tree = React.useMemo(() => buildCommentTree(comments), [comments]);
  const previewImages = React.useMemo(
    () => post.images.map((src, index) => ({ key: `${post.id}-${index}`, src })),
    [post.id, post.images],
  );
  const [previewIndex, setPreviewIndex] = React.useState(0);
  const [previewVisible, setPreviewVisible] = React.useState(false);

  React.useEffect(() => {
    setPreviewVisible(false);
    setPreviewIndex(0);
  }, [post.id]);

  const handleContentClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (post.images.length === 0) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target || target.tagName !== "IMG") {
        return;
      }

      const rawSrc = target.getAttribute("src") ?? "";
      const resolvedSrc = rawSrc || (target as HTMLImageElement).src;
      let index = post.images.findIndex((item) => item === rawSrc);
      if (index === -1) {
        index = post.images.findIndex((item) => item === resolvedSrc);
      }
      if (index >= 0) {
        setPreviewIndex(index);
        setPreviewVisible(true);
      }
    },
    [post.images],
  );

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
              <p className="text-xs text-muted-foreground">{timeText}</p>
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
          {hideHeader ? <p className="text-xs text-muted-foreground">{timeText}</p> : null}
        </div>

        <div
          className="rounded-2xl border bg-muted/20 p-5 text-sm leading-7 text-foreground/90 [&_img]:max-w-full [&_img]:max-h-96 [&_img]:cursor-zoom-in [&_img]:rounded-lg [&_img]:object-contain"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          onClick={handleContentClick}
        />

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
            <ReportButton reportType="POST" targetPostId={post.id} />
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
          ) : tree.length > 0 ? (
            <>
              {tree.map((item) => (
                <CommentNode
                  key={item.id}
                  item={item}
                  depth={0}
                  postId={post.id}
                  currentUserId={currentUserId}
                  replyTarget={replyTarget}
                  replySubmitting={replySubmitting}
                  editingCommentId={editingCommentId}
                  editingContent={editingContent}
                  editSubmitting={editSubmitting}
                  onReplyClick={onReplyClick}
                  onCancelReply={onCancelReply}
                  onSubmitReply={onSubmitReply}
                  onEditClick={onEditClick}
                  onCancelEdit={onCancelEdit}
                  onEditingContentChange={onEditingContentChange}
                  onSaveEdit={onSaveEdit}
                  onDeleteComment={onDeleteComment}
                />
              ))}
              {hasMoreComments ? (
                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onLoadMoreComments}
                    disabled={commentsLoadingMore}
                  >
                    {commentsLoadingMore ? <Loader2 className="size-4 animate-spin" /> : null}
                    加载更多评论
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              暂无评论，快来发表第一条评论吧。
            </div>
          )}
        </div>
      </section>

      {previewImages.length > 0 ? (
        <PhotoSlider
          images={previewImages}
          visible={previewVisible}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          onClose={() => setPreviewVisible(false)}
          maskOpacity={0.5}
        />
      ) : null}
    </article>
  );
}
