"use client";

import * as React from "react";
import HistoryList from "./components/history-list";
import RecordTabs, { UserRecordTab } from "./components/record-tabs";
import Pagination from "@/components/pagination";
import UserInfoCard from "@/components/user-info-card";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSearchParams } from "next/navigation";
import {
  BrowseRecord,
  CommentRecord,
  FollowerRecord,
  FollowRecord,
  LikedRecord,
  PostRecord,
  ReviewRecord,
} from "./components/record-types";

type ProfileResponse = {
  browseRecords: BrowseRecord[];
  reviewRecords: ReviewRecord[];
  postRecords: PostRecord[];
  commentRecords: CommentRecord[];
  likedRecords: LikedRecord[];
  followingRecords: FollowRecord[];
  followerRecords: FollowerRecord[];
  message?: string;
};

const EMPTY_PROFILE_DATA: Omit<ProfileResponse, "message"> = {
  browseRecords: [],
  reviewRecords: [],
  postRecords: [],
  commentRecords: [],
  likedRecords: [],
  followingRecords: [],
  followerRecords: [],
};

const PAGE_SIZE = 5;

const isValidTab = (tab: string | null): tab is UserRecordTab =>
  tab === "view" ||
  tab === "review" ||
  tab === "post" ||
  tab === "comment" ||
  tab === "liked" ||
  tab === "following" ||
  tab === "followers";

export default function UserInfo() {
  const user = useAuthStore((state) => state.user);
  const searchParams = useSearchParams();
  const [profileData, setProfileData] = React.useState(EMPTY_PROFILE_DATA);
  const [loading, setLoading] = React.useState(true);
  const tabParam = searchParams.get("tab");
  const activeTab: UserRecordTab = isValidTab(tabParam) ? tabParam : "view";
  const rawPage = Number(searchParams.get("page") ?? "1");

  React.useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/profile", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          setProfileData(EMPTY_PROFILE_DATA);
          return;
        }

        const data = (await response.json()) as ProfileResponse;
        setProfileData({
          browseRecords: data.browseRecords ?? [],
          reviewRecords: data.reviewRecords ?? [],
          postRecords: data.postRecords ?? [],
          commentRecords: data.commentRecords ?? [],
          likedRecords: data.likedRecords ?? [],
          followingRecords: data.followingRecords ?? [],
          followerRecords: data.followerRecords ?? [],
        });
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setProfileData(EMPTY_PROFILE_DATA);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  const recordsByTab = {
    view: profileData.browseRecords,
    review: profileData.reviewRecords,
    post: profileData.postRecords,
    comment: profileData.commentRecords,
    liked: profileData.likedRecords,
    following: profileData.followingRecords,
    followers: profileData.followerRecords,
  };

  const activeRecords = recordsByTab[activeTab];
  const totalPages = Math.max(1, Math.ceil(activeRecords.length / PAGE_SIZE));
  const currentPage = Number.isFinite(rawPage) ? Math.min(Math.max(1, rawPage), totalPages) : 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pagedRecords = activeRecords.slice(start, start + PAGE_SIZE);

  return (
    <div className="px-[10vw] py-8">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-6">
          <UserInfoCard
            user={user}
            followingCount={profileData.followingRecords.length}
            followerCount={profileData.followerRecords.length}
          />
        </div>

        <div className="flex-1">
          <Card>
            <CardContent className="space-y-4 pb-6 pt-0">
              {loading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">个人中心数据加载中...</div>
              ) : (
                <>
                  <RecordTabs activeTab={activeTab} />
                  <HistoryList tab={activeTab} items={pagedRecords} />
                  <Pagination currentPage={currentPage} totalPages={totalPages} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
