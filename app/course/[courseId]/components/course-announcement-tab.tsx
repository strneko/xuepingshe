"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/pagination";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { Announcement } from "../_types";

type AnnouncementDialogMode = "create" | "edit";

interface CourseAnnouncementTabProps {
  pagedAnnouncements: Announcement[];
  totalAnnouncementPages: number;
  currentPage: number;
  editingAnnouncementId: string | null;
  announcementDialogOpen: boolean;
  announcementDialogMode: AnnouncementDialogMode;
  announcementTitle: string;
  announcementContent: string;
  creatingAnnouncement: boolean;
  onOpenCreateDialog: () => void;
  onOpenEditDialog: (item: Announcement) => void;
  onDeleteAnnouncement: (announcementId: string) => void;
  onDialogOpenChange: (open: boolean) => void;
  onAnnouncementTitleChange: (value: string) => void;
  onAnnouncementContentChange: (value: string) => void;
  onSubmitAnnouncement: () => void;
}

export default function CourseAnnouncementTab({
  pagedAnnouncements,
  totalAnnouncementPages,
  currentPage,
  editingAnnouncementId,
  announcementDialogOpen,
  announcementDialogMode,
  announcementTitle,
  announcementContent,
  creatingAnnouncement,
  onOpenCreateDialog,
  onOpenEditDialog,
  onDeleteAnnouncement,
  onDialogOpenChange,
  onAnnouncementTitleChange,
  onAnnouncementContentChange,
  onSubmitAnnouncement,
}: CourseAnnouncementTabProps) {
  return (
    <section id="course-announcements" className="space-y-3">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={onOpenCreateDialog}>
          新增公告
        </Button>
      </div>

      {pagedAnnouncements.map((item, index) => (
        <div
          key={item.id}
          className="group relative space-y-1 rounded-xl border border-transparent px-3 py-3 transition-colors hover:bg-accent/40 hover:shadow-md"
          data-selected={editingAnnouncementId === item.id}
        >
          <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="outline" size="sm" className="h-7 gap-1 px-2" onClick={() => onOpenEditDialog(item)}>
              <Pencil className="size-3.5" />
              编辑
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-destructive hover:text-destructive"
              onClick={() => onDeleteAnnouncement(item.id)}
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
            <CardTitle className="pr-24 text-base transition-colors group-hover:text-primary">{item.title}</CardTitle>
            <span className="text-xs text-muted-foreground">{item.publishAt}</span>
          </div>

          <p className="max-w-[calc(100%-7rem)] text-sm leading-6 text-muted-foreground transition-colors group-hover:text-foreground">
            {item.content}
          </p>

          {index < pagedAnnouncements.length - 1 ? <Separator className="mt-3" /> : null}
        </div>
      ))}

      {pagedAnnouncements.length === 0 ? (
        <div className="rounded-md border px-4 py-6 text-center text-sm text-muted-foreground">无公告</div>
      ) : null}

      {totalAnnouncementPages > 1 ? (
        <Pagination currentPage={currentPage} totalPages={totalAnnouncementPages} pageParam="page" />
      ) : null}

      <Dialog open={announcementDialogOpen} onOpenChange={onDialogOpenChange}>
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
                onChange={(event) => onAnnouncementTitleChange(event.target.value)}
                placeholder="请输入公告标题"
                maxLength={80}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>公告内容</span>
              <Textarea
                value={announcementContent}
                onChange={(event) => onAnnouncementContentChange(event.target.value)}
                placeholder="请输入公告正文"
                maxLength={800}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onDialogOpenChange(false)} disabled={creatingAnnouncement}>
              取消
            </Button>
            <Button onClick={onSubmitAnnouncement} disabled={creatingAnnouncement}>
              {creatingAnnouncement ? "提交中..." : announcementDialogMode === "edit" ? "保存修改" : "发布公告"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
