"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import HistoryScoreList from "./history-score-list";
import CourseAnnouncementTab from "./course-announcement-tab";
import CourseResourceTab from "./course-resource-tab";
import { Announcement, ResourceItem } from "../_types";

interface CourseTabsProps {
  courseId: string;
  announcements: Announcement[];
  resources: ResourceItem[];
}

type AnnouncementDialogMode = "create" | "edit";

export default function CourseTabs({ courseId, announcements, resources }: CourseTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [announcementItems, setAnnouncementItems] = useState<Announcement[]>(announcements);
  const [resourceItems, setResourceItems] = useState<ResourceItem[]>(resources);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);
  const [announcementDialogMode, setAnnouncementDialogMode] = useState<AnnouncementDialogMode>("create");
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  useEffect(() => {
    setAnnouncementItems(announcements);
  }, [announcements]);

  useEffect(() => {
    setResourceItems(resources);
  }, [resources]);

  const rawTab = searchParams.get("tab");
  const activeTab: "announcement" | "resource" | "history" =
    rawTab === "resource" || rawTab === "history" ? rawTab : "announcement";

  const rawPage = Number(searchParams.get("page") ?? "1");
  const requestedPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;

  const pageSize = 3;
  const totalAnnouncementPages = Math.max(1, Math.ceil(announcementItems.length / pageSize));
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
    () => announcementItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [announcementItems, currentPage],
  );
  const pagedResources = useMemo(
    () => resourceItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [resourceItems, currentPage],
  );

  const switchTab = (tab: "announcement" | "resource" | "history") => {
    updateQuery(tab, 1);
  };

  const sortAnnouncements = (items: Announcement[]) => {
    return [...items].sort((left, right) => {
      const leftTime = new Date(left.publishAt).getTime();
      const rightTime = new Date(right.publishAt).getTime();
      return rightTime - leftTime;
    });
  };

  const resetAnnouncementForm = () => {
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementDialogMode("create");
    setEditingAnnouncementId(null);
  };

  const openCreateAnnouncementDialog = () => {
    resetAnnouncementForm();
    setAnnouncementDialogOpen(true);
  };

  const openEditAnnouncementDialog = (item: Announcement) => {
    setAnnouncementDialogMode("edit");
    setEditingAnnouncementId(item.id);
    setAnnouncementTitle(item.title);
    setAnnouncementContent(item.content);
    setAnnouncementDialogOpen(true);
  };

  const createAnnouncement = async () => {
    if (creatingAnnouncement) {
      return;
    }

    const title = announcementTitle.trim();
    const content = announcementContent.trim();

    if (!title || !content) {
      toast.error("请完整填写公告标题和内容");
      return;
    }

    setCreatingAnnouncement(true);

    try {
      const isEditing = announcementDialogMode === "edit" && editingAnnouncementId;
      const response = await fetch(
        isEditing
          ? `/api/courses/${courseId}/announcements/${editingAnnouncementId}`
          : `/api/courses/${courseId}/announcements`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            content,
            status: "PUBLISHED",
          }),
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        id?: string;
        title?: string;
        content?: string;
        publishAtLabel?: string;
      };

      if (!response.ok) {
        toast.error(
          payload.message ??
            (announcementDialogMode === "edit" ? "修改公告失败，请稍后重试" : "新增公告失败，请稍后重试"),
        );
        return;
      }

      const nextAnnouncement = {
        id: payload.id ?? editingAnnouncementId ?? `temp-${Date.now()}`,
        title: payload.title ?? title,
        content: payload.content ?? content,
        publishAt: payload.publishAtLabel ?? new Date().toISOString().slice(0, 10),
      };

      setAnnouncementItems((current) => {
        const merged = isEditing
          ? current.map((item) => (item.id === nextAnnouncement.id ? nextAnnouncement : item))
          : [nextAnnouncement, ...current];

        return sortAnnouncements(merged);
      });

      resetAnnouncementForm();
      setAnnouncementDialogOpen(false);
      toast.success(announcementDialogMode === "edit" ? "公告已更新" : "公告已发布");
      updateQuery("announcement", 1);
    } catch {
      toast.error(announcementDialogMode === "edit" ? "网络异常，请稍后重试" : "网络异常，请稍后重试");
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  const deleteAnnouncement = async (announcementId: string) => {
    const confirmed = window.confirm("确认删除该公告吗？删除后不可恢复。");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/courses/${courseId}/announcements/${announcementId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      toast.error(payload.message ?? "删除公告失败，请稍后重试");
      return;
    }

    setAnnouncementItems((current) => current.filter((item) => item.id !== announcementId));
    toast.success("公告已删除");
    updateQuery("announcement", 1);
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
          <CardContent className="px-3">
            {activeTab === "announcement" ? (
              <CourseAnnouncementTab
                pagedAnnouncements={pagedAnnouncements}
                totalAnnouncementPages={totalAnnouncementPages}
                currentPage={currentPage}
                editingAnnouncementId={editingAnnouncementId}
                announcementDialogOpen={announcementDialogOpen}
                announcementDialogMode={announcementDialogMode}
                announcementTitle={announcementTitle}
                announcementContent={announcementContent}
                creatingAnnouncement={creatingAnnouncement}
                onOpenCreateDialog={openCreateAnnouncementDialog}
                onOpenEditDialog={openEditAnnouncementDialog}
                onDeleteAnnouncement={(announcementId) => void deleteAnnouncement(announcementId)}
                onDialogOpenChange={(open) => {
                  if (creatingAnnouncement) {
                    return;
                  }
                  setAnnouncementDialogOpen(open);
                  if (!open) {
                    resetAnnouncementForm();
                  }
                }}
                onAnnouncementTitleChange={setAnnouncementTitle}
                onAnnouncementContentChange={setAnnouncementContent}
                onSubmitAnnouncement={() => void createAnnouncement()}
              />
            ) : activeTab === "resource" ? (
              <CourseResourceTab
                courseId={courseId}
                pagedResources={pagedResources}
                totalResourcePages={totalResourcePages}
                currentPage={currentPage}
                onUploaded={(item) => {
                  setResourceItems((current) => [item, ...current]);
                }}
                onOpenResourceDownload={openResourceDownload}
                onDeleteResourceItem={(resourceId) => void deleteResourceItem(resourceId)}
              />
            ) : null}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
