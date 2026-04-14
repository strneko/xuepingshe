"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { CourseCardProps } from "../page";
import EvaluationDialog, { type EvaluationSubmitPayload } from "./evaluation-dialog";
import SearchResultCard from "@/components/search-result-card";

interface MyClassCourseCardProps extends CourseCardProps {
  keyword?: string;
}

export function CourseCard({
  courseId,
  courseName,
  teacher,
  location,
  time,
  imageUrl: _imageUrl,
  deadline,
  isEvaluated,
  onEvaluate,
  description = "本课程旨在培养学生掌握核心专业知识，通过理论与实践相结合的方式，提升学生的综合应用能力。",
  credits: _credits = "3.0 学分",
  keyword = "",
}: MyClassCourseCardProps) {
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [evaluated, setEvaluated] = useState(isEvaluated);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const openEvaluation = () => {
    if (evaluated) {
      return;
    }
    onEvaluate?.();
    setSubmitError(null);
    setIsEvaluationOpen(true);
  };

  const handleSubmit = async (payload: EvaluationSubmitPayload) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
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
        throw new Error("提交失败");
      }

      setEvaluated(true);
    } catch {
      setSubmitError("提交评教失败，请稍后重试");
      throw new Error("提交评教失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SearchResultCard
        href={`/course/${courseId}`}
        type="course"
        title={courseName}
        subtitle={`授课教师：${teacher}`}
        department={`${location} · ${time}`}
        snippet={description}
        keyword={keyword}
        borderless
        actionSlot={
          <div className="flex w-32 flex-col items-center gap-2">
            {evaluated ? (
              <Button disabled variant="secondary" className="w-full grayscale opacity-70 cursor-not-allowed">
                已评教
              </Button>
            ) : (
              <Button onClick={openEvaluation} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "去评教"}
              </Button>
            )}

            {submitError && <p className="text-center text-xs text-destructive">{submitError}</p>}

            <p className="inline-flex items-center gap-1 text-center text-xs text-muted-foreground">
              <Calendar className="size-3" />
              截止：{deadline}
            </p>
          </div>
        }
      />

      <EvaluationDialog
        open={isEvaluationOpen}
        onOpenChange={setIsEvaluationOpen}
        courseName={courseName}
        teacher={teacher}
        deadline={deadline}
        onSubmit={handleSubmit}
      />
    </>
  );
}
