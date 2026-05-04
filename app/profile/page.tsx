"use client";

import * as React from "react";
import HistoryList from "./components/history-list";
import RecordTabs, { UserRecordTab } from "./components/record-tabs";
import Pagination from "@/components/pagination";
import ProfileCards from "@/components/profile-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";
import type { HistoryItem } from "./components/record-types";

type ProfileResponse = {
  items?: HistoryItem[];
  total?: number;
  page?: number;
  pageSize?: number;
  message?: string;
};

type TabState = {
  items: HistoryItem[];
  total: number;
  loading: boolean;
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
  const searchParams = useSearchParams();
  const [tabState, setTabState] = React.useState<Record<UserRecordTab, TabState>>({
    view: { items: [], total: 0, loading: true },
    review: { items: [], total: 0, loading: true },
    post: { items: [], total: 0, loading: true },
    comment: { items: [], total: 0, loading: true },
    liked: { items: [], total: 0, loading: true },
    following: { items: [], total: 0, loading: true },
    followers: { items: [], total: 0, loading: true },
  });
  const [pageByTab, setPageByTab] = React.useState<Record<UserRecordTab, number>>({
    view: 1,
    review: 1,
    post: 1,
    comment: 1,
    liked: 1,
    following: 1,
    followers: 1,
  });
  const tabParam = searchParams.get("tab");
  const activeTab: UserRecordTab = isValidTab(tabParam) ? tabParam : "view";
  const rawPage = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;

  React.useEffect(() => {
    setPageByTab((current) => ({
      ...current,
      [activeTab]: currentPage,
    }));
  }, [activeTab, currentPage]);

  React.useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        setTabState((current) => ({
          ...current,
          [activeTab]: {
            ...current[activeTab],
            loading: true,
          },
        }));

        const response = await fetch(
          `/api/profile/records?tab=${activeTab}&page=${currentPage}&pageSize=${PAGE_SIZE}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          setTabState((current) => ({
            ...current,
            [activeTab]: {
              ...current[activeTab],
              items: [],
              total: 0,
              loading: false,
            },
          }));
          return;
        }

        const data = (await response.json()) as ProfileResponse;
        setTabState((current) => ({
          ...current,
          [activeTab]: {
            items: data.items ?? [],
            total: data.total ?? 0,
            loading: false,
          },
        }));
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setTabState((current) => ({
          ...current,
          [activeTab]: {
            ...current[activeTab],
            items: [],
            total: 0,
            loading: false,
          },
        }));
      } finally {
        if (!controller.signal.aborted) {
          setTabState((current) => ({
            ...current,
            [activeTab]: {
              ...current[activeTab],
              loading: false,
            },
          }));
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [activeTab, currentPage]);

  const activeState = tabState[activeTab];
  const totalPages = Math.max(1, Math.ceil(activeState.total / PAGE_SIZE));
  const pagedRecords = activeState.items;

  return (
    <div className="px-[10vw] py-8">
      <div className="grid gap-6 xl:grid-cols-[30vw_50vw]">
        <div className="space-y-6">
          <ProfileCards />
        </div>

        <div className="flex-1">
          <Card>
            <CardContent className="space-y-4 pb-6 pt-0">
              {activeState.loading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-[72px] rounded-md" />
                    ))}
                  </div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="flex items-center gap-4 px-5 py-4">
                        <Skeleton className="size-10 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/5" />
                          <Skeleton className="h-3 w-2/5" />
                        </div>
                        <Skeleton className="h-8 w-16 rounded-md shrink-0" />
                      </CardContent>
                    </Card>
                  ))}
                  <div className="flex justify-center gap-1 pt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-8 rounded-md" />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <RecordTabs activeTab={activeTab} pageByTab={pageByTab} />
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
