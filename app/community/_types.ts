export type CommunitySortTab = "latest-post" | "latest-reply" | "hot";

export type CommunityAnnouncement = {
  id: string;
  title: string;
  href?: string;
  pinned: boolean;
};

export type CommunityPost = {
  id: string;
  title: string;
  authorId: string;
  contentHtml: string;
  author: {
    nickname: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastReplyAt?: string;
  content: string;
  images: string[];
  tags: string[];
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  hotScore: number;
};

export type CommunityComment = {
  id: string;
  content: string;
  replyToCommentId?: string | null;
  createdAt: string;
  author: {
    nickname: string;
    avatarUrl?: string;
  };
};
