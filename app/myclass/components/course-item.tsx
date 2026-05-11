"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, ListChecks } from "lucide-react";
import { CourseCardProps } from "../page";
import EvaluationDialog, { type EvaluationSubmitPayload } from "./evaluation-dialog";
import ReviewRoundManagementDialog from "./review-round-management-dialog";
import SearchResultCard from "@/components/search-result-card";
import ScoreBox from "@/components/score-box";
import ScoreTrendChart from "@/components/score-trend-chart";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MyClassCourseCardProps extends CourseCardProps {
  keyword?: string;
  isAdmin?: boolean;
  trendData?: CourseCardProps["trendData"];
}

export function CourseCard({
  enrollmentId: _enrollmentId,
  offeringId,
  courseId,
  courseName,
  viewerRole = "STUDENT",
  teacher,
  term,
  offeringStatus,
  location,
  time,
  imageUrl: _imageUrl,
  deadline,
  isEvaluated,
  onEvaluate,
  description = "本课程旨在培养学生掌握核心专业知识，通过理论与实践相结合的方式，提升学生的综合应用能力。",
  credits: _credits = "3.0 学分",
  inviteCode = null,
  recentScore = null,
  reviewCount = 0,
  activeRoundId = null,
  keyword = "",
  isAdmin = false,
  trendData,
}: MyClassCourseCardProps) {
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [evaluated, setEvaluated] = useState(isEvaluated);
  const [courseStatus, setCourseStatus] = useState(offeringStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusDialogAction, setStatusDialogAction] = useState<"OPEN" | "CLOSED" | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRoundManagementOpen, setIsRoundManagementOpen] = useState(false);
  const isTeacherView = viewerRole === "TEACHER" || isAdmin;
  const canEvaluate = courseStatus === "OPEN" && !evaluated && activeRoundId !== null;
  const nextStatusAction = courseStatus === "OPEN" ? "CLOSED" : "OPEN";
  const statusToggleLabel = courseStatus === "OPEN" ? "结课" : "开课";

  const copyInviteCode = async () => {
    if (!inviteCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success("邀请码已复制");
    } catch {
      toast.error("复制失败，请手动复制");
    }
  };

  const updateOfferingStatus = async () => {
    if (!statusDialogAction || isUpdatingStatus) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/offerings/${offeringId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: statusDialogAction,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "更新开课状态失败，请稍后重试");
        return;
      }

      setCourseStatus(statusDialogAction);
      toast.success(statusDialogAction === "OPEN" ? "课程已开课" : "课程已结课");
      setStatusDialogAction(null);
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openEvaluation = () => {
    if (!canEvaluate) {
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
          roundId: activeRoundId,
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
        department={`${courseStatus === "OPEN" ? "开课中" : "已结课"} · ${location} · ${time} · ${term} · ${_credits} 学分`}
        score={typeof recentScore === "number" ? recentScore : undefined}
        reviewCount={reviewCount > 0 ? reviewCount : undefined}
        snippet={description}
        keyword={keyword}
        borderless
        sparklineSlot={
          trendData && trendData.length >= 2 ? (
            <ScoreTrendChart data={trendData} compact className="my-1" />
          ) : null
        }
        actionSlot={
          isTeacherView ? (
            <div className="flex w-44 flex-col items-end gap-2 text-right">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={statusToggleLabel === "结课" ? "destructive" : "outline"}
                  className="w-24"
                  onClick={() => setStatusDialogAction(nextStatusAction)}
                  disabled={isUpdatingStatus}
                >
                  {statusToggleLabel}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsRoundManagementOpen(true)}
                >
                  <ListChecks className="size-4" />
                </Button>
              </div>
              <p className="text-sm text-foreground">
                <ScoreBox score={recentScore} digits={1} className="align-middle" />
                <span className="ml-2 text-xs text-muted-foreground">{reviewCount} 条评价</span>
              </p>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                邀请码：
                {inviteCode ? (
                  <button
                    type="button"
                    className="group ml-1 inline-flex items-center whitespace-nowrap rounded-sm px-1 hover:bg-accent"
                    onClick={() => void copyInviteCode()}
                  >
                    <span className="font-medium text-foreground">{inviteCode}</span>
                    <span className="ml-1 hidden text-[11px] text-primary group-hover:inline">点击复制</span>
                  </button>
                ) : (
                  <span className="ml-1">暂未生成</span>
                )}
              </p>
            </div>
          ) : (
            <div className="flex w-32 flex-col items-center gap-2">
              {evaluated ? (
                <Button disabled variant="secondary" className="w-full grayscale opacity-70 cursor-not-allowed">
                  已评教
                </Button>
              ) : offeringStatus === "CLOSED" ? (
                <Button disabled variant="secondary" className="w-full cursor-not-allowed opacity-70">
                  已结课
                </Button>
              ) : activeRoundId === null ? (
                <Button disabled variant="secondary" className="w-full cursor-not-allowed opacity-70">
                  暂无评价
                </Button>
              ) : (
                <Button onClick={openEvaluation} className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "提交中..." : "去评教"}
                </Button>
              )}

              {submitError && <p className="text-center text-xs text-destructive">{submitError}</p>}

              <p className="inline-flex items-center gap-1 text-center text-xs text-muted-foreground whitespace-nowrap">
                <Calendar className="size-3 shrink-0" />
                截止：{deadline}
              </p>
            </div>
          )
        }
      />

      <Dialog open={Boolean(statusDialogAction)} onOpenChange={(open) => (!open ? setStatusDialogAction(null) : null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{statusDialogAction === "OPEN" ? "确认开课" : "确认结课"}</DialogTitle>
            <DialogDescription>
              {statusDialogAction === "OPEN" ? "确认将该课程设置为开课状态吗？" : "确认将该课程设置为结课状态吗？"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatusDialogAction(null)}
              disabled={isUpdatingStatus}
            >
              取消
            </Button>
            <Button type="button" onClick={() => void updateOfferingStatus()} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "处理中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isTeacherView ? (
        <ReviewRoundManagementDialog
          open={isRoundManagementOpen}
          onOpenChange={setIsRoundManagementOpen}
          courseId={courseId}
          offeringId={offeringId}
          courseName={courseName}
        />
      ) : (
        <EvaluationDialog
          open={isEvaluationOpen}
          onOpenChange={setIsEvaluationOpen}
          courseName={courseName}
          teacher={teacher}
          deadline={deadline}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}
