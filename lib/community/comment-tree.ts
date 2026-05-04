export interface CommentTreeItem {
  id: string;
  content: string;
  authorId: string;
  replyToCommentId: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    nickname: string;
    avatarUrl?: string;
  };
  replies: CommentTreeItem[];
}

export function buildCommentTree(
  comments: Array<{
    id: string;
    content: string;
    authorId: string;
    replyToCommentId?: string | null | undefined;
    createdAt: string;
    updatedAt: string;
    author: {
      nickname: string;
      avatarUrl?: string;
    };
  }>,
): CommentTreeItem[] {
  const map = new Map<string, CommentTreeItem>();
  const roots: CommentTreeItem[] = [];

  for (const c of comments) {
    map.set(c.id, { ...c, replyToCommentId: c.replyToCommentId ?? null, replies: [] });
  }

  for (const item of map.values()) {
    const parentId = item.replyToCommentId;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.replies.push(item);
    } else {
      roots.push(item);
    }
  }

  return roots;
}
