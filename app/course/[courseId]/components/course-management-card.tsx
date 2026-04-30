"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ListChecks } from "lucide-react";
import ReviewRoundManagementDialog from "@/app/myclass/components/review-round-management-dialog";

interface CourseManagementCardProps {
  courseId: string;
  offeringId: string | null;
  inviteCode: string | null;
  initialCourseName: string;
  initialTeacherName: string;
  initialIntro: string;
  initialLocation: string;
  initialSchedule: string;
}

export default function CourseManagementCard({
  courseId,
  offeringId,
  inviteCode,
  initialCourseName,
  initialTeacherName,
  initialIntro,
  initialLocation,
  initialSchedule,
}: CourseManagementCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isRoundManagementOpen, setIsRoundManagementOpen] = useState(false);
  const [courseName, setCourseName] = useState(initialCourseName);
  const [teacherName, setTeacherName] = useState(initialTeacherName);
  const [intro, setIntro] = useState(initialIntro);
  const [location, setLocation] = useState(initialLocation);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const openDialog = () => {
    setCourseName(initialCourseName);
    setTeacherName(initialTeacherName);
    setIntro(initialIntro);
    setLocation(initialLocation);
    setSchedule(initialSchedule);
    setError(null);
    setSuccess(null);
    setIsOpen(true);
  };

  const submitUpdate = async () => {
    const payload = {
      courseName: courseName.trim(),
      teacherName: teacherName.trim(),
      intro: intro.trim(),
      location: location.trim(),
      schedule: schedule.trim(),
    };

    if (!payload.courseName || !payload.teacherName || !payload.intro || !payload.location || !payload.schedule) {
      setError("课程名称、教师、简介、地点、时间均为必填");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/courses/${courseId}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? "更新失败，请稍后重试");
        return;
      }

      setSuccess("课程信息已更新");
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex min-w-55 flex-col items-start gap-2 md:items-end">
        <p className="text-sm font-medium">课程邀请码</p>
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {inviteCode ? (
            <button
              type="button"
              className="group inline-flex items-center whitespace-nowrap rounded-sm px-1 hover:bg-accent"
              onClick={() => void copyInviteCode()}
            >
              <span className="font-medium text-foreground">{inviteCode}</span>
              <span className="ml-1 hidden text-xs text-primary group-hover:inline">点击复制</span>
            </button>
          ) : (
            "暂无可用邀请码"
          )}
        </p>
        <Button type="button" variant="outline" onClick={openDialog}>
          修改课程信息
        </Button>
        {offeringId && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsRoundManagementOpen(true)}
          >
            <ListChecks className="mr-1 size-4" />
            评价轮次管理
          </Button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>修改课程信息</DialogTitle>
            <DialogDescription>修改后会同步展示在课程详情与我的课程列表。</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input value={courseName} onChange={(event) => setCourseName(event.target.value)} placeholder="课程名称" />
            <Input
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              placeholder="授课教师"
            />
            <Textarea
              value={intro}
              onChange={(event) => setIntro(event.target.value)}
              placeholder="课程简介"
              rows={3}
            />
            <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="上课地点" />
            <Input value={schedule} onChange={(event) => setSchedule(event.target.value)} placeholder="上课时间" />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            {success ? <p className="text-xs text-emerald-600">{success}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
              取消
            </Button>
            <Button type="button" onClick={() => void submitUpdate()} disabled={isSaving}>
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {offeringId && (
        <ReviewRoundManagementDialog
          open={isRoundManagementOpen}
          onOpenChange={setIsRoundManagementOpen}
          courseId={courseId}
          offeringId={offeringId}
          courseName={initialCourseName}
        />
      )}
    </>
  );
}
