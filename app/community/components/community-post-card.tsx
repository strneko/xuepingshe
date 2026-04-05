import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle } from "lucide-react";
import { CommunityPost } from "@/app/community/_types";
import { formatRelativeTime } from "@/lib/time/format-relative-time";

type CommunityPostCardProps = {
  post: CommunityPost;
};

export default function CommunityPostCard({ post }: CommunityPostCardProps) {
  return (
    <article className="space-y-3">
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
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5" />
            {post.likesCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" />
            {post.commentsCount}
          </span>
        </div>
      </footer>
    </article>
  );
}
