"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import Pagination from "@/components/pagination";
import HistoryScoreList from "./history-score-list";
import { Announcement, ResourceItem } from "../_types";
import CourseResourceUpload from "./course-resource-upload";

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
              <section id="course-announcements" className="space-y-3">
                <div className="flex items-center justify-end">
                  <Button size="sm" onClick={openCreateAnnouncementDialog}>
                    新增公告
                  </Button>
                </div>
                {pagedAnnouncements.map((item, index) => (
                  <div
                    key={item.id}
                    className="group relative space-y-1 rounded-xl border border-transparent  px-3 py-3 transition-colors  hover:bg-gray-100 hover:shadow-[0_12px_30px_rgba(120,120,120,0.18)]"
                    data-selected={editingAnnouncementId === item.id}
                  >
                    <div className="absolute  right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2"
                        onClick={() => openEditAnnouncementDialog(item)}
                      >
                        <Pencil className="size-3.5" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-destructive hover:text-destructive"
                        onClick={() => void deleteAnnouncement(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                        删除
                      </Button>
                    </div>
                    <div
                      className={`flex items-center justify-between gap-3 rounded-lg transition-colors ${
                        editingAnnouncementId === item.id ? "bg-muted/60" : ""
                      }`}
                    >
                      <CardTitle className="pr-24 text-base transition-colors group-hover:text-primary">
                        {item.title}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">{item.publishAt}</span>
                    </div>
                    <p className="max-w-[calc(100%-7rem)] text-sm leading-6 text-muted-foreground transition-colors group-hover:text-foreground">
                      {item.content}
                    </p>
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

      <Dialog
        open={announcementDialogOpen}
        onOpenChange={(open) => {
          if (creatingAnnouncement) {
            return;
          }
          setAnnouncementDialogOpen(open);
          if (!open) {
            resetAnnouncementForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{announcementDialogMode === "edit" ? "编辑课程公告" : "新增课程公告"}</DialogTitle>
            <DialogDescription>
              {announcementDialogMode === "edit"
                ? "修改后会立即更新公告列表中的内容。"
                : "公告发布后会立即出现在课程公告列表中。"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="grid gap-1 text-sm">
              <span>公告标题</span>
              <Input
                value={announcementTitle}
                onChange={(event) => setAnnouncementTitle(event.target.value)}
                placeholder="请输入公告标题"
                maxLength={80}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>公告内容</span>
              <Textarea
                value={announcementContent}
                onChange={(event) => setAnnouncementContent(event.target.value)}
                placeholder="请输入公告正文"
                maxLength={800}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnouncementDialogOpen(false)} disabled={creatingAnnouncement}>
              取消
            </Button>
            <Button onClick={() => void createAnnouncement()} disabled={creatingAnnouncement}>
              {creatingAnnouncement ? "提交中..." : announcementDialogMode === "edit" ? "保存修改" : "发布公告"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
