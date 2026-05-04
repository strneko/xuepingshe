"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserProfile, useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TeacherProfileData {
  teacherName: string;
  avatarUrl: string | null;
  department: string;
  title: string;
  researchAreas: string[];
  office: string;
  description: string;
}

interface AccountData {
  id: string;
  nickname: string;
  avatarUrl?: string;
  role: "STUDENT" | "TEACHER";
  reviewCount: number;
  likedCount: number;
  followingCount: number;
  followerCount: number;
  points: number;
  teacherProfile: TeacherProfileData | null;
}

interface ProfileCardsProps {
  defaultEditing?: boolean;
}

const TITLE_OPTIONS = ["教授", "副教授", "讲师", "助理教授", "研究员", "副研究员"] as const;
const AVATAR_MAX_SIZE = 2 * 1024 * 1024;
const AVATAR_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const AVATAR_COURSE_PREFIX = "avatar";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function sha256Hex(buffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function ProfileCards({ defaultEditing = false }: ProfileCardsProps) {
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(defaultEditing);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [nickname, setNickname] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [researchAreasStr, setResearchAreasStr] = useState("");
  const [office, setOffice] = useState("");
  const [description, setDescription] = useState("");

  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [teacherCode, setTeacherCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [avatarFile]);

  useEffect(() => {
    fetch("/api/account", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: AccountData & { message?: string }) => {
        if (json.id) {
          setData(json);
          setNickname(json.nickname);
          if (json.teacherProfile) {
            setTeacherName(json.teacherProfile.teacherName);
            setDepartment(json.teacherProfile.department);
            setTitle(json.teacherProfile.title);
            setResearchAreasStr(json.teacherProfile.researchAreas.join("、"));
            setOffice(json.teacherProfile.office);
            setDescription(json.teacherProfile.description);
          }
        }
      })
      .catch(() => toast.error("加载账户信息失败"))
      .finally(() => setLoading(false));
  }, []);

  const handleBecomeTeacher = async () => {
    if (!teacherCode.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/become-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: teacherCode.trim() }),
      });
      const d = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(d.message ?? "认证失败");
        return;
      }
      toast.success(d.message ?? "认证成功");
      setTeacherDialogOpen(false);
      setTeacherCode("");
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      if (meRes.ok) {
        const meData = (await meRes.json()) as { user?: UserProfile };
        if (meData.user) {
          useAuthStore.getState().setUser(meData.user);
          window.location.reload();
        }
      }
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateAvatarFile = (file: File) => {
    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      return "头像仅支持 PNG/JPEG/WEBP/GIF 格式";
    }
    if (file.size > AVATAR_MAX_SIZE) {
      return `头像大小需小于 ${formatFileSize(AVATAR_MAX_SIZE)}`;
    }
    return null;
  };

  const uploadAvatarResource = async (file: File) => {
    const courseId = `${AVATAR_COURSE_PREFIX}-${data?.id ?? ""}`;
    const fileBuffer = await file.arrayBuffer();
    const wholeHash = await sha256Hex(fileBuffer);
    const chunkHash = wholeHash;

    const initResponse = await fetch("/api/resources/upload/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        wholeFileHash: wholeHash,
        chunkSize: file.size,
        totalChunks: 1,
      }),
    });

    if (!initResponse.ok) {
      throw new Error(`初始化上传失败(${initResponse.status})`);
    }

    const initData = (await initResponse.json()) as {
      code?: "INSTANT_SUCCESS" | "UPLOAD_REQUIRED";
      resourceId?: string;
      uploadId?: string;
    };

    if (initData.code === "INSTANT_SUCCESS" && initData.resourceId) {
      return initData.resourceId;
    }

    if (!initData.uploadId) {
      throw new Error("上传会话无效");
    }

    const partResponse = await fetch("/api/resources/upload/part", {
      method: "POST",
      headers: {
        "Upload-Id": initData.uploadId,
        "Part-Number": "1",
        "Chunk-Hash": chunkHash,
        "Content-Length": String(file.size),
      },
      body: file,
    });

    if (!partResponse.ok) {
      throw new Error(`分片上传失败(${partResponse.status})`);
    }

    const completeResponse = await fetch(`/api/resources/upload/${initData.uploadId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadedPartsMeta: [{ partNumber: 1, chunkHash }],
      }),
    });

    if (!completeResponse.ok) {
      throw new Error(`合并上传失败(${completeResponse.status})`);
    }

    const completeData = (await completeResponse.json()) as { resourceId?: string };
    if (!completeData.resourceId) {
      throw new Error("上传未完成");
    }

    return completeData.resourceId;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!data) {
        return;
      }

      let avatarResourceId: string | undefined;
      if (avatarFile) {
        const error = validateAvatarFile(avatarFile);
        if (error) {
          toast.error(error);
          return;
        }

        setAvatarUploading(true);
        try {
          avatarResourceId = await uploadAvatarResource(avatarFile);
        } finally {
          setAvatarUploading(false);
        }
      }

      const body: Record<string, unknown> = { nickname };
      if (avatarResourceId) {
        body.avatarResourceId = avatarResourceId;
      }
      if (data?.role === "TEACHER") {
        body.teacherName = teacherName;
        body.department = department;
        body.title = title;
        body.researchAreas = researchAreasStr
          .split(/[,，、]/)
          .map((s) => s.trim())
          .filter(Boolean);
        body.office = office;
        body.description = description;
      }

      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as AccountData & { message?: string };

      if (!res.ok) {
        toast.error(json.message ?? "保存失败");
        return;
      }

      toast.success(json.message ?? "资料已更新");
      setData(json);
      if (json.id) {
        useAuthStore.getState().setUser({
          id: json.id,
          nickname: json.nickname,
          avatarUrl: json.avatarUrl ?? undefined,
          role: json.role,
          reviewCount: json.reviewCount,
          likedCount: json.likedCount,
          followingCount: json.followingCount,
          followerCount: json.followerCount,
          points: json.points,
        });
      }
      setAvatarFile(null);
      setEditing(false);
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Account Info Card Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-[72px]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="grid grid-cols-4 gap-1 text-center">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-3 w-6" />
                </div>
              ))}
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-5 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Teacher Profile Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">无法加载账户信息</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Account Info Card */}
      <Card>
        <CardHeader className={cn(editing && "pb-2")}>
          <CardTitle className="flex items-center justify-between">
            <span>账户资料</span>
            {editing ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setAvatarFile(null);
                  }}
                >
                  取消编辑
                </Button>
                <Button type="button" size="sm" onClick={() => void handleSave()} disabled={saving || avatarUploading}>
                  {avatarUploading ? "上传中..." : saving ? "保存中..." : "保存修改"}
                </Button>
              </div>
            ) : (
              <Button type="button" size="sm" onClick={() => setEditing(true)}>
                编辑资料
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={avatarPreview ?? data.avatarUrl ?? ""} alt={data.nickname} />
              <AvatarFallback>{data.nickname.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">{data.nickname}</span>
                <Badge variant={data.role === "TEACHER" ? "default" : "secondary"} className="text-[10px] px-1.5">
                  {data.role === "TEACHER" ? "教师" : "学生"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">积分: {data.points}</p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-2">
              <Label htmlFor="avatarUpload" className="text-xs">
                头像
              </Label>
              <Input
                id="avatarUpload"
                type="file"
                accept={AVATAR_ALLOWED_TYPES.join(",")}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setAvatarFile(file);
                }}
              />
              {avatarFile ? (
                <p className="text-xs text-muted-foreground">
                  已选择：{avatarFile.name}（{formatFileSize(avatarFile.size)}）
                </p>
              ) : null}
            </div>
          ) : null}

          <Separator />

          <div className="grid grid-cols-4 gap-1 text-center">
            {[
              { n: data.reviewCount, label: "评价" },
              { n: data.likedCount, label: "被点赞" },
              { n: data.followingCount, label: "关注" },
              { n: data.followerCount, label: "粉丝" },
            ].map(({ n, label }) => (
              <div key={label}>
                <p className="text-sm font-semibold">{n}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1">
            <Label htmlFor="pnickname" className="text-xs">
              昵称
            </Label>
            {editing ? (
              <Input id="pnickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            ) : (
              <p className="text-sm">{data.nickname}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teacher Profile / Auth Card */}
      {data.role === "TEACHER" ? (
        <Card>
          <CardHeader>
            <CardTitle>教师档案</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {editing ? (
              <>
                <div className="space-y-1">
                  <Label htmlFor="pteacherName" className="text-xs">
                    真实姓名
                  </Label>
                  <Input id="pteacherName" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pdepartment" className="text-xs">
                    院系
                  </Label>
                  <Input id="pdepartment" value={department} onChange={(e) => setDepartment(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ptitle" className="text-xs">
                    职称
                  </Label>
                  <Select value={title} onValueChange={setTitle}>
                    <SelectTrigger id="ptitle" className="w-full">
                      <SelectValue placeholder="请选择职称" />
                    </SelectTrigger>
                    <SelectContent>
                      {TITLE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="presearchAreas" className="text-xs">
                    研究方向
                  </Label>
                  <Input
                    id="presearchAreas"
                    value={researchAreasStr}
                    onChange={(e) => setResearchAreasStr(e.target.value)}
                    placeholder="逗号或顿号分隔"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="poffice" className="text-xs">
                    办公室
                  </Label>
                  <Input id="poffice" value={office} onChange={(e) => setOffice(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pdescription" className="text-xs">
                    个人简介
                  </Label>
                  <Textarea
                    id="pdescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold">{teacherName || data.nickname}</p>
                <p className="text-muted-foreground">院系：{department || "未填写"}</p>
                <p className="text-muted-foreground">职称：{title || "未填写"}</p>
                <p className="text-muted-foreground">研究方向：{researchAreasStr || "未填写"}</p>
                <p className="text-muted-foreground">办公室：{office || "未填写"}</p>
                {description ? (
                  <p className="text-muted-foreground leading-5">{description}</p>
                ) : (
                  <p className="text-muted-foreground italic text-xs">个人简介未填写</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-5">
            <p className="text-xs text-muted-foreground text-center">认证为教师后可编辑教师档案</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => setTeacherDialogOpen(true)}>
              认证为教师
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={teacherDialogOpen} onOpenChange={setTeacherDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>认证为教师</DialogTitle>
            <DialogDescription>请输入教师认证码以升级为教师身份</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pteacher-code">教师码</Label>
            <Input
              id="pteacher-code"
              value={teacherCode}
              onChange={(e) => setTeacherCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleBecomeTeacher();
              }}
              placeholder="请输入教师码"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTeacherDialogOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              onClick={() => void handleBecomeTeacher()}
              disabled={isSubmitting || !teacherCode.trim()}
            >
              {isSubmitting ? "验证中..." : "确认认证"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
