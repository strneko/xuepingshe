"use client";

import * as React from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";

type ReportButtonProps = {
  reportType: "POST" | "COMMENT";
  targetPostId?: string;
  targetCommentId?: string;
};

export default function ReportButton({ reportType, targetPostId, targetCommentId }: ReportButtonProps) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const openAuthDialog = useAuthStore((state) => state.openAuthDialog);
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleOpen = () => {
    if (!isLoggedIn) {
      openAuthDialog();
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      openAuthDialog();
      return;
    }

    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      toast.error("举报原因至少 5 个字");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/community/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          reason: trimmed,
          targetPostId,
          targetCommentId,
        }),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "提交失败");
      }

      toast.success(data.message ?? "举报已提交");
      setOpen(false);
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="px-2 text-xs text-muted-foreground hover:text-destructive"
        onClick={handleOpen}
      >
        <Flag className="size-3.5" />
        举报
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>举报{reportType === "POST" ? "帖子" : "评论"}</DialogTitle>
            <DialogDescription>请描述举报原因，我们将尽快处理。</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请详细描述举报原因（至少5个字）..."
            className="min-h-24"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              取消
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={submitting || reason.trim().length < 5}>
              {submitting ? "提交中..." : "提交举报"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
