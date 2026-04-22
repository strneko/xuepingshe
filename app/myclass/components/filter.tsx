"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Filter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onlyUnevaluated = searchParams.get("unevaluated") === "true";
  const sort = searchParams.get("sort") === "desc" ? "desc" : "asc";
  const keywordParam = searchParams.get("keyword") ?? "";
  const [keyword, setKeyword] = useState(keywordParam);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

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
    setJoinError(null);
    setJoinSuccess(null);
    setIsJoinDialogOpen(true);
  };

  const submitJoin = async () => {
    const normalizedCode = inviteCode.trim().toUpperCase();
    if (!normalizedCode) {
      setJoinError("请输入邀请码");
      return;
    }

    setIsJoining(true);
    setJoinError(null);
    setJoinSuccess(null);

    try {
      const response = await fetch("/api/myclass/enrollments/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode: normalizedCode }),
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setJoinError(payload.message ?? "加入课程失败，请稍后重试");
        return;
      }

      setJoinSuccess(payload.message ?? "加入课程成功");
      setInviteCode("");
      router.refresh();
    } catch {
      setJoinError("网络异常，请稍后重试");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex w-full items-center gap-4 py-4 px-[10vw]">
      <div className="relative w-[20vw]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <Checkbox
            checked={onlyUnevaluated}
            onCheckedChange={(checked) => updateParams({ unevaluated: checked === true ? "true" : null, page: null })}
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
            {joinError ? <p className="text-xs text-destructive">{joinError}</p> : null}
            {joinSuccess ? <p className="text-xs text-emerald-600">{joinSuccess}</p> : null}
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
    </div>
  );
}
