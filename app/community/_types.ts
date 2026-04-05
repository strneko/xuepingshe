export type CommunitySortTab = "latest-post" | "latest-reply" | "hot";

export type CommunityAnnouncement = {
  id: string;
  title: string;
  href?: string;
  pinned: true;
};

export type CommunityPost = {
  id: string;
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
  commentsCount: number;
  hotScore: number;
};
