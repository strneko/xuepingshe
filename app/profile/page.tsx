"use client";

import HistoryList from "./components/history-list";
import RecordTabs, { UserRecordTab } from "./components/record-tabs";
import Pagination from "@/components/pagination";
import UserInfoCard from "@/components/user-info-card";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSearchParams } from "next/navigation";
import { BrowseRecord, LikedRecord, PostRecord, ReviewRecord } from "./components/record-types";

const browseRecords: BrowseRecord[] = [
  { id: "b1", courseName: "高等数学", visitedAt: "2026-03-01 10:20" },
  { id: "b2", courseName: "大学英语", visitedAt: "2026-02-28 19:10" },
  { id: "b3", courseName: "计算机基础", visitedAt: "2026-02-27 08:40" },
];

const reviewRecords: ReviewRecord[] = [
  { id: "r1", courseName: "计算机基础", score: "4.8", reviewedAt: "2026-03-01 11:00" },
  { id: "r2", courseName: "高等数学", score: "4.6", reviewedAt: "2026-02-24 15:35" },
];

const postRecords: PostRecord[] = [
  { id: "p1", title: "关于评教截止时间的提醒", liked: 12, postedAt: "2026-02-26 09:15" },
  { id: "p2", title: "推荐一门高质量选修课", liked: 26, postedAt: "2026-02-20 21:40" },
  { id: "p3", title: "一周课程反馈总结", liked: 8, postedAt: "2026-02-18 12:05" },
  { id: "p4", title: "关于课堂互动的建议", liked: 14, postedAt: "2026-02-15 18:30" },
];

const likedRecords: LikedRecord[] = [
  { id: "l1", title: "高数老师讲课节奏建议", author: "小王", likedAt: "2026-03-02 20:16" },
  { id: "l2", title: "英语课口语练习心得", author: "小李", likedAt: "2026-03-01 09:42" },
  { id: "l3", title: "机基实验课答疑合集", author: "小陈", likedAt: "2026-02-27 14:08" },
  { id: "l4", title: "体育课考核标准说明", author: "小赵", likedAt: "2026-02-25 16:50" },
];

const PAGE_SIZE = 2;

const isValidTab = (tab: string | null): tab is UserRecordTab =>
  tab === "view" || tab === "review" || tab === "post" || tab === "liked";

export default function UserInfo() {
  const user = useAuthStore((state) => state.user);
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: UserRecordTab = isValidTab(tabParam) ? tabParam : "view";
  const rawPage = Number(searchParams.get("page") ?? "1");

  const recordsByTab = {
    view: browseRecords,
    review: reviewRecords,
    post: postRecords,
    liked: likedRecords,
  };

  const activeRecords = recordsByTab[activeTab];
  const totalPages = Math.max(1, Math.ceil(activeRecords.length / PAGE_SIZE));
  const currentPage = Number.isFinite(rawPage) ? Math.min(Math.max(1, rawPage), totalPages) : 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pagedRecords = activeRecords.slice(start, start + PAGE_SIZE);

  return (
    <div className="px-[10vw] py-8">
      <div className="flex items-start gap-6">
        <div className="w-64 shrink-0">
          <UserInfoCard user={user} />
        </div>

        <div className="flex-1">
          <Card>
            <CardContent className="space-y-4 py-6">
              <RecordTabs activeTab={activeTab} />
              <HistoryList tab={activeTab} items={pagedRecords} />
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
