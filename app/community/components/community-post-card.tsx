import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle } from "lucide-react";
import { CommunityPost } from "@/app/community/_types";
import { formatRelativeTime } from "@/lib/time/format-relative-time";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CommunityPostCardProps = {
  post: CommunityPost;
  liking?: boolean;
  onToggleLike?: (postId: string) => void;
  onOpenPost?: (postId: string) => void;
};

export default function CommunityPostCard({ post, liking = false, onToggleLike, onOpenPost }: CommunityPostCardProps) {
  const handleOpenPost = () => {
    onOpenPost?.(post.id);
  };

  return (
    <article
      className="cursor-pointer space-y-3 rounded-lg transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={handleOpenPost}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpenPost();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <header className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={post.author.avatarUrl ?? ""} alt={post.author.nickname} />
          <AvatarFallback>{post.author.nickname.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{post.author.nickname}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</p>
        </div>
      </header>

      <section className="space-y-3">
        <h3 className="line-clamp-2 text-base font-semibold text-foreground">{post.title}</h3>
        <p className="line-clamp-4 text-sm leading-6 text-foreground/90">{post.content}</p>

        {post.images.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {post.images.slice(0, 3).map((src) => (
              <div key={src} className="overflow-hidden rounded-lg border bg-muted/20">
                <img src={src} alt="帖子配图" className="h-36 w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <footer className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={`${post.id}-${tag}`} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-auto px-1 py-0 text-xs text-muted-foreground",
              post.isLiked && "text-rose-500 hover:text-rose-500",
            )}
            onClick={(event) => {
              event.stopPropagation();
              onToggleLike?.(post.id);
            }}
            disabled={liking}
            aria-label={post.isLiked ? "取消点赞" : "点赞"}
          >
            <Heart className={cn("size-3.5", post.isLiked && "fill-current")} />
            {post.likesCount}
          </Button>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" />
            {post.commentsCount}
          </span>
        </div>
      </footer>
    </article>
  );
}
