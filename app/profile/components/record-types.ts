import { UserRecordTab } from "./record-tabs";

export interface BrowseRecord {
  id: string;
  courseName: string;
  visitedAt: string;
}

export interface ReviewRecord {
  id: string;
  courseName: string;
  score: string;
  reviewedAt: string;
}

export interface PostRecord {
  id: string;
  title: string;
  liked: number;
  postedAt: string;
}

export interface CommentRecord {
  id: string;
  title: string;
  content: string;
  commentAt: string;
}

export interface LikedRecord {
  id: string;
  title: string;
  author: string;
  likedAt: string;
}

export interface FollowRecord {
  id: string;
  name: string;
  department: string;
  followedAt: string;
}

export interface FollowerRecord {
  id: string;
  name: string;
  introduction: string;
  followedAt: string;
}

export type HistoryItem =
  | BrowseRecord
  | ReviewRecord
  | PostRecord
  | CommentRecord
  | LikedRecord
  | FollowRecord
  | FollowerRecord;

export const EMPTY_TEXT_MAP: Record<UserRecordTab, string> = {
  view: "暂无浏览记录",
  review: "暂无评价记录",
  post: "暂无发帖记录",
  comment: "暂无评论记录",
  liked: "暂无点赞记录",
  following: "暂无关注记录",
  followers: "暂无粉丝记录",
};
