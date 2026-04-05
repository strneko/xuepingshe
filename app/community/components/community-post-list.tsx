import { CommunityPost } from "@/app/community/_types";
import { Separator } from "@/components/ui/separator";
import CommunityPostCard from "./community-post-card";

type CommunityPostListProps = {
  posts: CommunityPost[];
};

export default function CommunityPostList({ posts }: CommunityPostListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        当前暂无帖子
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      {posts.map((post, index) => (
        <div key={post.id}>
          <div className="px-4 py-4">
            <CommunityPostCard post={post} />
          </div>
          {index < posts.length - 1 ? <Separator /> : null}
        </div>
      ))}
    </section>
  );
}
