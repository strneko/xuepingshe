"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/pagination";
import HistoryScoreList from "./history-score-list";
import { Announcement, ResourceItem } from "../_types";
import CourseResourceUpload from "./course-resource-upload";

interface CourseTabsProps {
  courseId: string;
  announcements: Announcement[];
  resources: ResourceItem[];
}

export default function CourseTabs({ courseId, announcements, resources }: CourseTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [resourceItems, setResourceItems] = useState<ResourceItem[]>(resources);

  useEffect(() => {
    setResourceItems(resources);
  }, [resources]);

  const rawTab = searchParams.get("tab");
  const activeTab: "announcement" | "resource" | "history" =
    rawTab === "resource" || rawTab === "history" ? rawTab : "announcement";

  const rawPage = Number(searchParams.get("page") ?? "1");
  const requestedPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;

  const pageSize = 3;
  const totalAnnouncementPages = Math.max(1, Math.ceil(announcements.length / pageSize));
  const totalResourcePages = Math.max(1, Math.ceil(resourceItems.length / pageSize));
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
    () => resourceItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [resourceItems, currentPage],
  );

  const switchTab = (tab: "announcement" | "resource" | "history") => {
    updateQuery(tab, 1);
  };

  const openResourceDownload = (resourceId: string) => {
    window.open(`/api/resources/${resourceId}/download`, "_blank", "noopener,noreferrer");
  };

  const deleteResourceItem = async (resourceId: string) => {
    const confirmed = window.confirm("确认删除该资源吗？删除后不可恢复。");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/resources/${resourceId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      window.alert("删除失败，请稍后重试");
      return;
    }

    setResourceItems((current) => current.filter((item) => item.id !== resourceId));
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
                <CourseResourceUpload
                  courseId={courseId}
                  onUploaded={(item) => {
                    setResourceItems((current) => [item, ...current]);
                  }}
                />
                {pagedResources.map((item, index) => (
                  <div key={item.id} className="space-y-2">
                    <div className="group flex items-start gap-3 rounded-lg border border-transparent px-3 py-2 transition-all duration-200 hover:border-border hover:bg-muted/60 hover:shadow-sm">
                      <button
                        type="button"
                        onClick={() => openResourceDownload(item.id)}
                        className="flex min-w-0 flex-1 items-start justify-between gap-4 text-left focus-visible:outline-none"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="break-all text-sm font-medium leading-6 transition-colors group-hover:text-primary">
                              {item.name}
                            </p>
                            <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                          </div>
                          <p className="text-xs text-muted-foreground">{item.type}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                          {item.updatedAt}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteResourceItem(item.id)}
                        className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        aria-label={`删除资源 ${item.name}`}
                        title="删除资源"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
