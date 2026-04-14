"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import EvaluationDialog, { type EvaluationSubmitPayload } from "@/app/myclass/components/evaluation-dialog";
import { useRouter } from "next/navigation";

interface CourseReviewComposeProps {
  courseId: string;
  courseName: string;
  teacher: string;
  deadline?: string;
}

export default function CourseReviewCompose({
  courseId,
  courseName,
  teacher,
  deadline = "长期开放",
}: CourseReviewComposeProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
      }),
    });

    if (!response.ok) {
      throw new Error("提交评价失败");
    }

    router.refresh();
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-medium">评价课程</p>
          <p className="text-xs text-muted-foreground">发布后会立即刷新当前评价列表</p>
        </div>
        <Button onClick={() => setOpen(true)}>写评价</Button>
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
