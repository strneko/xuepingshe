"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/pagination";
import HistoryScoreList from "./history-score-list";
import { Announcement, ResourceItem } from "../_types";

interface CourseTabsProps {
  courseId: string;
  announcements: Announcement[];
  resources: ResourceItem[];
}

export default function CourseTabs({ courseId, announcements, resources }: CourseTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get("tab");
  const activeTab: "announcement" | "resource" | "history" =
    rawTab === "resource" || rawTab === "history" ? rawTab : "announcement";

  const rawPage = Number(searchParams.get("page") ?? "1");
  const requestedPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;

  const pageSize = 3;
  const totalAnnouncementPages = Math.max(1, Math.ceil(announcements.length / pageSize));
  const totalResourcePages = Math.max(1, Math.ceil(resources.length / pageSize));
  const totalPages =
    activeTab === "announcement" ? totalAnnouncementPages : activeTab === "resource" ? totalResourcePages : 1;
  const currentPage = Math.min(requestedPage, totalPages);

  const updateQuery = (nextTab: "announcement" | "resource" | "history", nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);

    if (nextPage <= 1 || nextTab === "history") {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const pagedAnnouncements = useMemo(
    () => announcements.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [announcements, currentPage],
  );
  const pagedResources = useMemo(
    () => resources.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [resources, currentPage],
  );

  const switchTab = (tab: "announcement" | "resource" | "history") => {
    updateQuery(tab, 1);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-start">
        <ButtonGroup>
          <Button
            variant={activeTab === "announcement" ? "default" : "outline"}
            size="sm"
            onClick={() => switchTab("announcement")}
          >
            课程公告
          </Button>
          <Button
            variant={activeTab === "resource" ? "default" : "outline"}
            size="sm"
            onClick={() => switchTab("resource")}
          >
            课程资源
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            size="sm"
            onClick={() => switchTab("history")}
          >
            历史评分
          </Button>
        </ButtonGroup>
      </div>
      {activeTab === "history" ? (
        <HistoryScoreList courseId={courseId} />
      ) : (
        <Card>
          <CardContent className="px-3 pt-6">
            {activeTab === "announcement" ? (
              <section id="course-announcements" className="space-y-3">
                {pagedAnnouncements.map((item, index) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <span className="text-xs text-muted-foreground">{item.publishAt}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.content}</p>
                    {index < pagedAnnouncements.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
                {totalAnnouncementPages > 1 && (
                  <Pagination currentPage={currentPage} totalPages={totalAnnouncementPages} pageParam="page" />
                )}
              </section>
            ) : activeTab === "resource" ? (
              <section id="course-resources" className="space-y-3">
                {pagedResources.map((item, index) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="break-all text-sm font-medium leading-6">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.type}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{item.updatedAt}</span>
                    </div>
                    {index < pagedResources.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
                {totalResourcePages > 1 && (
                  <Pagination currentPage={currentPage} totalPages={totalResourcePages} pageParam="page" />
                )}
              </section>
            ) : null}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
