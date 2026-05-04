"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import CommunityPostEditor from "../new/community-post-editor";
import { CommunityPost } from "@/app/community/_types";
import { stripHtml } from "@/lib/community/shared";

type CommunityPostEditDialogProps = {
  post: CommunityPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (post: CommunityPost) => void;
};

export default function CommunityPostEditDialog({ post, open, onOpenChange, onSaved }: CommunityPostEditDialogProps) {
  const [title, setTitle] = React.useState("");
  const [contentHtml, setContentHtml] = React.useState("<p></p>");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open || !post) {
      return;
    }

    setTitle(post.title);
    setContentHtml(post.contentHtml || "<p></p>");
  }, [open, post]);

  const handleSave = React.useCallback(() => {
    void (async () => {
      if (!post || saving) {
        return;
      }

      const nextTitle = title.trim();
      if (!nextTitle) {
        toast.error("标题不能为空");
        return;
      }

      if (nextTitle.length > 30) {
        toast.error("标题不能超过 30 个字");
        return;
      }

      if (!stripHtml(contentHtml)) {
        toast.error("正文不能为空");
        return;
      }

      setSaving(true);

      try {
        const response = await fetch(`/api/community/posts/${post.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: nextTitle,
            contentHtml,
            topicNames: post.tags,
          }),
        });

        const data = (await response.json()) as {
          message?: string;
          post?: CommunityPost;
        };

        if (!response.ok) {
          throw new Error(data.message ?? "更新失败");
        }

        if (data.post) {
          onSaved?.(data.post);
        }

        toast.success(data.message ?? "帖子已更新");
        onOpenChange(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "更新失败";
        toast.error(message);
      } finally {
        setSaving(false);
      }
    })();
  }, [contentHtml, onOpenChange, onSaved, post, saving, title]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-6">
        <DialogHeader>
          <DialogTitle>编辑帖子</DialogTitle>
          <DialogDescription>修改标题或正文内容，保存后会自动标记为已编辑并更新时间。</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="community-post-edit-title" className="text-sm font-medium text-foreground">
                标题
              </label>
              <span className="text-xs text-muted-foreground">{title.trim().length}/30</span>
            </div>
            <Input
              id="community-post-edit-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={30}
              placeholder="请输入标题"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">正文</div>
            <CommunityPostEditor value={contentHtml} onChange={setContentHtml} />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">当前话题</div>
            <div className="flex flex-wrap gap-2">
              {post && post.tags.length > 0 ? (
                post.tags.map((tag) => (
                  <Badge key={`${post.id}-${tag}`} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">暂无话题</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              取消
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "保存中..." : "保存修改"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
