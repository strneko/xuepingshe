export type CommunityAnnouncementItem = {
  id: string;
  title: string;
  href?: string;
  pinned: boolean;
};

export type CommunityPostListItem = {
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
