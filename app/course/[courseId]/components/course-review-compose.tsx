"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import EvaluationDialog, { type EvaluationSubmitPayload } from "@/app/myclass/components/evaluation-dialog";
import { useRouter } from "next/navigation";

interface ActiveRoundInfo {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
}

interface CourseReviewComposeProps {
  courseId: string;
  courseName: string;
  teacher: string;
  offeringId: string;
  activeRound: ActiveRoundInfo | null;
  hasReviewed: boolean;
}

function formatDeadline(isoString: string): string {
  const date = new Date(isoString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

export default function CourseReviewCompose({
  courseId,
  courseName,
  teacher,
  offeringId,
  activeRound,
  hasReviewed: initialHasReviewed,
}: CourseReviewComposeProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(initialHasReviewed);

  const canReview = activeRound !== null && !hasReviewed;

  const handleSubmit = async (payload: EvaluationSubmitPayload) => {
    const response = await fetch(`/api/courses/${courseId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        overallScore: payload.overallScore,
        summary: payload.summary,
        detailedScores: payload.detailedScores,
        nickname: "匿名同学",
        roundId: activeRound?.id,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error((data as { message?: string }).message ?? "提交评价失败");
    }

    setHasReviewed(true);
    router.refresh();
  };

  const deadline = activeRound ? formatDeadline(activeRound.endsAt) : "暂无评价窗口";

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-medium">评价课程</p>
          <p className="text-xs text-muted-foreground">
            {activeRound
              ? `当前轮次：${activeRound.label} · 截止 ${deadline}`
              : "当前不在评价窗口内"}
          </p>
        </div>
        {canReview ? (
          <Button onClick={() => setOpen(true)}>写评价</Button>
        ) : (
          <Button disabled variant="outline">
            {hasReviewed ? "已评价" : "暂不可评"}
          </Button>
        )}
      </div>

      <EvaluationDialog
        open={open}
        onOpenChange={setOpen}
        courseName={courseName}
        teacher={teacher}
        deadline={deadline}
        onSubmit={handleSubmit}
      />
    </>
  );
}
