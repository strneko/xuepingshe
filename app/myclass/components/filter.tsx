"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, SkipBack, SkipForward } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface FilterProps {
  isAdmin?: boolean;
  semesterSequence?: string[];
  currentSemesterKey?: string;
}

export default function Filter({ isAdmin = false, semesterSequence = [], currentSemesterKey = "" }: FilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const onlyUnevaluated = searchParams.get("unevaluated") === "true";
  const sort = searchParams.get("sort") === "desc" ? "desc" : "asc";
  const isTeacher = user?.role === "TEACHER";
  const keywordParam = searchParams.get("keyword") ?? "";
  const [keyword, setKeyword] = useState(keywordParam);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [createCourseName, setCreateCourseName] = useState("");
  const [createTeacherName, setCreateTeacherName] = useState("");
  const [createIntro, setCreateIntro] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [createSchedule, setCreateSchedule] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [advancingSemester, setAdvancingSemester] = useState(false);
  const [retreatingSemester, setRetreatingSemester] = useState(false);

  useEffect(() => {
    setKeyword(keywordParam);
  }, [keywordParam]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
        return;
      }
      params.set(key, value);
    });

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const applyKeyword = () => {
    const trimmedKeyword = keyword.trim();
    updateParams({ keyword: trimmedKeyword ? trimmedKeyword : null, page: null });
  };

  const openJoinDialog = () => {
    setInviteCode("");
    setIsJoinDialogOpen(true);
  };

  const openCreateDialog = () => {
    setCreateCourseName("");
    setCreateTeacherName(user?.nickname?.trim() || "");
    setCreateIntro("");
    setCreateLocation("");
    setCreateSchedule("");
    setIsCreateDialogOpen(true);
  };

  const handleSemesterChange = (value: string) => {
    updateParams({ semester: value || null, page: null });
  };

  const handleAdvanceSemester = async () => {
    if (advancingSemester) return;
    setAdvancingSemester(true);
    try {
      const response = await fetch("/api/admin/semester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance" }),
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string; currentSemester?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "学期推进失败");
        return;
      }
      toast.success(payload.message ?? `已切换到学期 ${payload.currentSemester ?? ""}`);
      router.refresh();
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setAdvancingSemester(false);
    }
  };

  const handleRetreatSemester = async () => {
    if (retreatingSemester) return;
    setRetreatingSemester(true);
    try {
      const response = await fetch("/api/admin/semester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retreat" }),
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string; currentSemester?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "学期回退失败");
        return;
      }
      toast.success(payload.message ?? `已回退到学期 ${payload.currentSemester ?? ""}`);
      router.refresh();
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setRetreatingSemester(false);
    }
  };

  const submitJoin = async () => {
    const normalizedCode = inviteCode.trim().toUpperCase();
    if (!normalizedCode) {
      toast.error("请输入邀请码");
      return;
    }

    setIsJoining(true);

    try {
      const response = await fetch("/api/course-invitations/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: normalizedCode }),
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "加入课程失败，请稍后重试");
        return;
      }

      toast.success(payload.message ?? "加入课程成功");
      setInviteCode("");
      setIsJoinDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setIsJoining(false);
    }
  };

  const submitCreate = async () => {
    const courseName = createCourseName.trim();
    const teacherName = createTeacherName.trim();
    const intro = createIntro.trim();
    const location = createLocation.trim();
    const schedule = createSchedule.trim();

    if (!courseName || !teacherName || !intro || !location || !schedule) {
      toast.error("课程名称、教师、简介、地点、时间均为必填");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseName,
          teacherName,
          intro,
          location,
          schedule,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        toast.error(data.message ?? "创建课程失败，请稍后重试");
        return;
      }

      toast.success(data.message ?? "课程创建成功");
      setIsCreateDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex w-full items-center gap-4 py-4 px-[10vw]">
      <div className="relative w-[20vw]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
        <Input
          placeholder="搜索课程名称或教师"
          className="pl-9"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyKeyword();
            }
          }}
        />
      </div>
      <div className="ml-auto flex items-center gap-4">
        {isAdmin ? (
          <>
            <Select
              value={searchParams.get("semester") ?? currentSemesterKey}
              onValueChange={handleSemesterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择学期" />
              </SelectTrigger>
              <SelectContent>
                {semesterSequence.map((sem) => (
                  <SelectItem key={sem} value={sem}>
                    <span className="flex items-center gap-2">
                      {sem}
                      {sem === currentSemesterKey ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5">当前</Badge>
                      ) : null}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void handleRetreatSemester()}
              disabled={retreatingSemester}
            >
              <SkipBack className="size-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void handleAdvanceSemester()}
              disabled={advancingSemester}
            >
              <SkipForward className="size-4 mr-1" />
              {advancingSemester ? "切换中..." : "结束当前学期"}
            </Button>
          </>
        ) : isTeacher ? (
          <Button type="button" size="sm" onClick={openCreateDialog}>
            创建课程
          </Button>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <Checkbox
                checked={onlyUnevaluated}
                onCheckedChange={(checked) =>
                  updateParams({ unevaluated: checked === true ? "true" : null, page: null })
                }
              />
              仅看未评教
            </label>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateParams({ sort: sort === "asc" ? "desc" : "asc", page: null })}
            >
              截止时间：{sort === "asc" ? "最近" : "最远"}
            </Button>

            <Button type="button" size="sm" onClick={openJoinDialog}>
              加入课程
            </Button>
          </>
        )}
      </div>

      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>通过邀请码加入课程</DialogTitle>
            <DialogDescription>请输入教师或课程管理员提供的邀请码，加入后会出现在我的课程列表中。</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="例如：MATH-2026-001"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (!isJoining) {
                    void submitJoin();
                  }
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsJoinDialogOpen(false)} disabled={isJoining}>
              取消
            </Button>
            <Button type="button" onClick={() => void submitJoin()} disabled={isJoining}>
              {isJoining ? "加入中..." : "确认加入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>创建课程</DialogTitle>
            <DialogDescription>填写课程基础信息后，系统会自动生成课程ID、学期标识和邀请码。</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              value={createCourseName}
              onChange={(event) => setCreateCourseName(event.target.value)}
              placeholder="课程名称，例如：高等数学A"
            />
            <Input
              value={createTeacherName}
              onChange={(event) => setCreateTeacherName(event.target.value)}
              placeholder="授课教师，例如：张老师"
            />
            <Textarea
              value={createIntro}
              onChange={(event) => setCreateIntro(event.target.value)}
              placeholder="课程简介"
              rows={3}
            />
            <Input
              value={createLocation}
              onChange={(event) => setCreateLocation(event.target.value)}
              placeholder="上课地点，例如：一教A101"
            />
            <Input
              value={createSchedule}
              onChange={(event) => setCreateSchedule(event.target.value)}
              placeholder="上课时间，例如：周三3-4节"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
              取消
            </Button>
            <Button type="button" onClick={() => void submitCreate()} disabled={isCreating}>
              {isCreating ? "创建中..." : "确认创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
