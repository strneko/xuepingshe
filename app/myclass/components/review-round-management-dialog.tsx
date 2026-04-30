"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarIcon, Clock, Plus, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RoundItem {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
  aggregated: boolean;
  reviewCount: number;
}

interface ReviewRoundManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  offeringId: string;
  courseName: string;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

function formatDateShort(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

function dateAndTimeToISO(date: Date | undefined, time: string): string {
  if (!date) return "";
  const [h, m] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h || 0, m || 0, 0, 0);
  return result.toISOString();
}

function DateTimePicker({
  value,
  onChange,
}: {
  value: string; // HH:MM time string
  onChange: (isoString: string) => void;
}) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("12:00");
  const [open, setOpen] = useState(false);

  // Sync combined value back up
  const emit = (d: Date | undefined, t: string) => {
    const iso = dateAndTimeToISO(d, t);
    if (iso) onChange(iso);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {value ? (
            <span className="tabular-nums">
              {formatDateShort(new Date(value))} {new Date(value).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : (
            "选择日期时间"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            setDate(d);
            if (d) {
              emit(d, time);
              // Close popover on date selection for better UX; keep open if re-selecting
            }
          }}
          initialFocus
        />
        <div className="flex items-center gap-2 border-t px-3 pb-3 pt-2">
          <Clock className="size-4 text-muted-foreground" />
          <Input
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              emit(date, e.target.value);
            }}
            className="h-8 w-28"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function ReviewRoundManagementDialog({
  open,
  onOpenChange,
  courseId,
  offeringId,
  courseName,
}: ReviewRoundManagementDialogProps) {
  const [rounds, setRounds] = useState<RoundItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newStartsAt, setNewStartsAt] = useState("");
  const [newEndsAt, setNewEndsAt] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAggregating, setIsAggregating] = useState(false);

  const resetAddForm = () => {
    setNewLabel("");
    setNewStartsAt("");
    setNewEndsAt("");
    setShowAddForm(false);
  };

  const fetchRounds = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/offerings/${offeringId}/rounds`,
      );
      if (!response.ok) throw new Error("加载失败");
      const data = (await response.json()) as { rounds: RoundItem[] };
      setRounds(data.rounds);
    } catch {
      setLoadError("加载轮次列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, offeringId]);

  useEffect(() => {
    if (open) {
      resetAddForm();
      void fetchRounds();
    }
  }, [open, fetchRounds]);

  const handleDelete = async (round: RoundItem) => {
    try {
      const response = await fetch(
        `/api/courses/${courseId}/offerings/${offeringId}/rounds/${round.id}`,
        { method: "DELETE" },
      );
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "删除失败");
        return;
      }
      setRounds((prev) => prev.filter((r) => r.id !== round.id));
      toast.success("轮次已删除");
    } catch {
      toast.error("网络异常，请稍后重试");
    }
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) {
      toast.error("轮次名称不能为空");
      return;
    }
    if (!newStartsAt || !newEndsAt) {
      toast.error("起止时间为必填");
      return;
    }
    if (new Date(newStartsAt) >= new Date(newEndsAt)) {
      toast.error("开始时间必须早于结束时间");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/offerings/${offeringId}/rounds`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: newLabel.trim(),
            startsAt: newStartsAt,
            endsAt: newEndsAt,
          }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as { message?: string; id?: string };
      if (!response.ok) {
        toast.error(data.message ?? "创建失败");
        return;
      }
      toast.success("轮次已添加");
      resetAddForm();
      void fetchRounds();
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAggregate = async () => {
    setIsAggregating(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/offerings/${offeringId}/rounds/aggregate`,
        { method: "POST" },
      );
      const data = (await response.json().catch(() => ({}))) as { message?: string; rounds?: number };
      if (!response.ok) {
        toast.error(data.message ?? "聚合失败");
        return;
      }
      toast.success(`已聚合 ${data.rounds ?? 0} 个轮次`);
      void fetchRounds();
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setIsAggregating(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/offerings/${offeringId}/rounds/generate`,
        { method: "POST" },
      );
      const data = (await response.json().catch(() => ({}))) as { message?: string; rounds?: RoundItem[] };
      if (!response.ok) {
        toast.error(data.message ?? "自动生成失败");
        return;
      }
      toast.success(`已生成 ${data.rounds?.length ?? 0} 个轮次`);
      void fetchRounds();
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const now = new Date();
  const hasPendingRounds = rounds.some(
    (r) => !r.aggregated && new Date(r.endsAt) < now,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>评价轮次管理</DialogTitle>
          <DialogDescription>{courseName}</DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {isLoading && <p className="py-4 text-center text-sm text-muted-foreground">加载中...</p>}

          {loadError && (
            <div className="flex items-center justify-between py-2">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button size="sm" variant="outline" onClick={() => void fetchRounds()}>
                重试
              </Button>
            </div>
          )}

          {!isLoading && !loadError && rounds.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              暂无评价轮次，请手动添加或自动生成
            </p>
          )}

          {rounds.map((round) => (
            <div
              key={round.id}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{round.label}</p>
                  {round.aggregated && (
                    <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-600">
                      已聚合
                    </span>
                  )}
                  {!round.aggregated && new Date(round.endsAt) < new Date() && (
                    <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600">
                      待聚合
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatDateTime(round.startsAt)} ~ {formatDateTime(round.endsAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {round.reviewCount} 条评价
                </span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={round.reviewCount > 0}
                  onClick={() => void handleDelete(round)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}

          {showAddForm && (
            <div className="space-y-3 rounded-md border px-3 py-3">
              <div className="space-y-1">
                <Label className="text-xs">轮次名称</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="如：第3周 周一"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">开始时间</Label>
                  <DateTimePicker
                    value={newStartsAt}
                    onChange={setNewStartsAt}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">结束时间</Label>
                  <DateTimePicker
                    value={newEndsAt}
                    onChange={setNewEndsAt}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => void handleAdd()} disabled={isAdding}>
                  {isAdding ? "添加中..." : "确认添加"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={resetAddForm}
                  disabled={isAdding}
                >
                  取消
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {hasPendingRounds && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleAggregate()}
              disabled={isAggregating}
            >
              {isAggregating ? "聚合中..." : "立即聚合"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleGenerate()}
            disabled={isGenerating}
          >
            <Wand2 className="mr-1 size-4" />
            {isGenerating ? "生成中..." : "自动生成"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
          >
            <Plus className="mr-1 size-4" />
            手动添加
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
