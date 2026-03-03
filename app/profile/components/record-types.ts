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

export interface LikedRecord {
  id: string;
  title: string;
  author: string;
  likedAt: string;
}

export type HistoryItem = BrowseRecord | ReviewRecord | PostRecord | LikedRecord;

export const EMPTY_TEXT_MAP: Record<UserRecordTab, string> = {
  view: "暂无浏览记录",
  review: "暂无评价记录",
  post: "暂无发帖记录",
  liked: "暂无点赞记录",
};
