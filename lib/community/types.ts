export type CommunityAnnouncementItem = {
  id: string;
  title: string;
  href?: string;
  pinned: boolean;
};

export type CommunityPostListItem = {
  id: string;
  title: string;
  author: {
    nickname: string;
    avatarUrl?: string;
  };
  createdAt: string;
  lastReplyAt?: string;
  content: string;
  images: string[];
  tags: string[];
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  hotScore: number;
};
