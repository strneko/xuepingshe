"use client";

import * as React from "react";
import { Eye, Save, SquarePen, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime } from "@/lib/time/format-relative-time";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";

import CommunityPostEditor from "./community-post-editor";
import CommunityTopicSelector from "./community-topic-selector";
import { useCommunityTopics } from "./use-community-topics";

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export default function CommunityPostForm() {
  interface DraftItem {
    id: string;
    title: string;
    excerpt: string;
    topicNames: string[];
    updatedAt: string;
  }

  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const openAuthDialog = useAuthStore((state) => state.openAuthDialog);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("<p></p>");

  const { topicKeyword, setTopicKeyword, recommendedTopics, dropdownOptions } = useCommunityTopics();

  const [selectedTopics, setSelectedTopics] = React.useState<string[]>([]);
  const [draftId, setDraftId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [draftDialogOpen, setDraftDialogOpen] = React.useState(false);
  const [draftList, setDraftList] = React.useState<DraftItem[]>([]);
  const [loadingDrafts, setLoadingDrafts] = React.useState(false);
  const [applyingDraftId, setApplyingDraftId] = React.useState<string | null>(null);
  const [deletingDraftId, setDeletingDraftId] = React.useState<string | null>(null);

  const contentLength = React.useMemo(() => stripHtml(content).length, [content]);
  const titleLength = title.trim().length;

  const toggleTopic = React.useCallback((topic: string) => {
    setSelectedTopics((current) => {
      if (current.includes(topic)) {
        return current.filter((item) => item !== topic);
      }

      return [...current, topic];
    });
  }, []);

  const validate = React.useCallback(() => {
    if (!title.trim()) {
      return "请先填写标题";
    }

    if (title.trim().length > 30) {
      return "标题不能超过 30 个字";
    }

    if (!stripHtml(content)) {
      return "正文不能为空";
    }

    if (selectedTopics.length === 0) {
      return "请至少选择 1 个话题";
    }

    return null;
  }, [content, selectedTopics.length, title]);

  const handleSaveDraft = React.useCallback(() => {
    if (!isLoggedIn) {
      openAuthDialog();
      return;
    }

    void (async () => {
      try {
        setSubmitting(true);

        const response = await fetch("/api/community/drafts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            contentHtml: content,
            topicNames: selectedTopics,
            draftId,
          }),
        });

        const data = (await response.json()) as { message?: string; draftId?: string };
        if (!response.ok) {
          toast.error(data.message ?? "保存草稿失败");
          return;
        }

        if (data.draftId) {
          setDraftId(data.draftId);
        }

        toast.success(data.message ?? "草稿已保存");
      } catch {
        toast.error("保存草稿失败，请稍后重试");
      } finally {
        setSubmitting(false);
      }
    })();
  }, [isLoggedIn, openAuthDialog, content, draftId, selectedTopics, title]);

  const handlePublish = React.useCallback(() => {
    if (!isLoggedIn) {
      openAuthDialog();
      return;
    }

    void (async () => {
      const validationError = validate();

      if (validationError) {
        toast.error(validationError);
        return;
      }

      try {
        setSubmitting(true);

        const response = await fetch("/api/community/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            contentHtml: content,
            topicNames: selectedTopics,
            draftId,
          }),
        });

        const data = (await response.json()) as { message?: string };
        if (!response.ok) {
          toast.error(data.message ?? "发布失败");
          return;
        }

        setDraftId(null);
        setTitle("");
        setContent("<p></p>");
        setSelectedTopics([]);
        toast.success(data.message ?? "发布成功");
        router.push("/community");
      } catch {
        toast.error("发布失败，请稍后重试");
      } finally {
        setSubmitting(false);
      }
    })();
  }, [isLoggedIn, openAuthDialog, content, draftId, router, selectedTopics, title, validate]);

  const loadDrafts = React.useCallback(async () => {
    try {
      setLoadingDrafts(true);
      const response = await fetch("/api/community/drafts?limit=30", {
        method: "GET",
      });

      const data = (await response.json()) as {
        message?: string;
        items?: DraftItem[];
      };

      if (!response.ok) {
        toast.error(data.message ?? "获取草稿失败");
        return;
      }

      setDraftList(data.items ?? []);
    } catch {
      toast.error("获取草稿失败，请稍后重试");
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  const handleApplyDraft = React.useCallback(
    async (targetDraftId: string) => {
      const hasUnsavedInput = Boolean(title.trim()) || Boolean(stripHtml(content)) || selectedTopics.length > 0;
      if (hasUnsavedInput) {
        const shouldOverwrite = window.confirm("当前编辑区有未保存内容，应用草稿将覆盖当前输入，是否继续？");
        if (!shouldOverwrite) {
          return;
        }
      }

      try {
        setApplyingDraftId(targetDraftId);

        const response = await fetch(`/api/community/drafts/${targetDraftId}`, {
          method: "GET",
        });

        const data = (await response.json()) as {
          message?: string;
          id?: string;
          title?: string;
          contentHtml?: string;
          topicNames?: string[];
        };

        if (!response.ok) {
          toast.error(data.message ?? "应用草稿失败");
          return;
        }

        setDraftId(data.id ?? targetDraftId);
        setTitle(data.title ?? "");
        setContent(data.contentHtml ?? "<p></p>");
        setSelectedTopics(Array.isArray(data.topicNames) ? data.topicNames : []);
        setDraftDialogOpen(false);
        toast.success("草稿已应用");
      } catch {
        toast.error("应用草稿失败，请稍后重试");
      } finally {
        setApplyingDraftId(null);
      }
    },
    [content, selectedTopics.length, title],
  );

  const handleDeleteDraft = React.useCallback(
    async (targetDraftId: string) => {
      try {
        setDeletingDraftId(targetDraftId);

        const response = await fetch(`/api/community/drafts/${targetDraftId}`, {
          method: "DELETE",
        });

        const data = (await response.json()) as { message?: string };
        if (!response.ok) {
          toast.error(data.message ?? "删除草稿失败");
          return;
        }

        setDraftList((current) => current.filter((item) => item.id !== targetDraftId));
        if (draftId === targetDraftId) {
          setDraftId(null);
        }
        toast.success(data.message ?? "草稿已删除");
      } catch {
        toast.error("删除草稿失败，请稍后重试");
      } finally {
        setDeletingDraftId(null);
      }
    },
    [draftId],
  );

  return (
    <main className="px-[10vw] py-8">
      <Card className="overflow-hidden border-border/70 bg-background shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <SquarePen className="size-5 text-primary" />
              发布帖子
            </CardTitle>
            <Dialog
              open={draftDialogOpen}
              onOpenChange={(nextOpen) => {
                setDraftDialogOpen(nextOpen);
                if (nextOpen) {
                  void loadDrafts();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs text-muted-foreground"
                >
                  <Save className="size-3.5" />
                  草稿箱
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>草稿箱</DialogTitle>
                  <DialogDescription>选择草稿应用到当前编辑区，或直接删除不需要的草稿。</DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-2">
                  <div className="space-y-3">
                    {loadingDrafts ? (
                      <div className="rounded-lg border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                        草稿加载中...
                      </div>
                    ) : draftList.length === 0 ? (
                      <div className="rounded-lg border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                        暂无草稿，先保存一条试试吧。
                      </div>
                    ) : (
                      draftList.map((draft) => (
                        <article key={draft.id} className="rounded-lg border bg-background p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <h4 className="truncate text-sm font-medium text-foreground">
                                {draft.title || "未命名草稿"}
                              </h4>
                              <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                                {draft.excerpt || "暂无正文内容"}
                              </p>
                            </div>
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {formatRelativeTime(draft.updatedAt)}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {draft.topicNames.length > 0 ? (
                              draft.topicNames.map((topic) => (
                                <span
                                  key={`${draft.id}-${topic}`}
                                  className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary"
                                >
                                  #{topic}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-muted-foreground">未设置话题</span>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                void handleDeleteDraft(draft.id);
                              }}
                              disabled={deletingDraftId === draft.id || applyingDraftId === draft.id}
                            >
                              <Trash2 className="size-4" />
                              {deletingDraftId === draft.id ? "删除中..." : "删除"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                void handleApplyDraft(draft.id);
                              }}
                              disabled={applyingDraftId === draft.id || deletingDraftId === draft.id}
                            >
                              {applyingDraftId === draft.id ? "应用中..." : "应用"}
                            </Button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 p-6 lg:p-8">
          <section className="grid gap-4 md:grid-cols-[96px_minmax(0,1fr)] md:items-start">
            <label className="pt-2 text-sm font-medium text-foreground" htmlFor="post-title">
              标题:
            </label>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="post-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={30}
                  placeholder="标题(必填)"
                  className="pr-14"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                  {titleLength}/30
                </span>
              </div>
              <p className="text-xs text-muted-foreground">标题尽量简洁，方便其他同学快速理解帖子内容。</p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-[96px_minmax(0,1fr)] md:items-start">
            <div className="pt-2">
              <div className="text-sm font-medium text-foreground">内容:</div>
            </div>
            <div className="space-y-2">
              <CommunityPostEditor value={content} onChange={(nextContent) => setContent(nextContent)} />
              <p className="text-xs text-muted-foreground">
                支持标题、列表、引用、链接和对齐操作，后续也可以扩展图片上传。 当前正文长度：{contentLength} 字。
              </p>
            </div>
          </section>

          <CommunityTopicSelector
            topicKeyword={topicKeyword}
            onTopicKeywordChange={(value) => {
              setTopicKeyword(value);

              const normalized = value.trim();
              if (!normalized) {
                return;
              }

              if (dropdownOptions.includes(normalized) && !selectedTopics.includes(normalized)) {
                toggleTopic(normalized);
                setTopicKeyword("");
              }
            }}
            dropdownOptions={dropdownOptions}
            recommendedTopics={recommendedTopics}
            selectedTopics={selectedTopics}
            onToggleTopic={toggleTopic}
          />

          <section className="grid gap-4 md:grid-cols-[96px_minmax(0,1fr)] md:items-start">
            <div className="pt-2">
              <div className="text-sm font-medium text-foreground">预览:</div>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <div className="text-base font-semibold text-foreground">{title.trim() || "标题预览"}</div>
                  {stripHtml(content) ? (
                    <div
                      className="prose prose-sm max-w-none text-sm leading-6 text-muted-foreground [&_img]:max-w-full [&_img]:max-h-48 [&_img]:rounded-lg [&_img]:object-contain"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">这里会显示正文预览，当前没有输入内容。</p>
                  )}
                </div>
                <Eye className="size-4 shrink-0 text-muted-foreground" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedTopics.length > 0 ? (
                  selectedTopics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                    >
                      #{topic}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">选择的话题会显示在这里。</span>
                )}
              </div>
            </div>
          </section>

          <div className="flex justify-center gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={submitting}>
              保存草稿
            </Button>
            <Button type="button" className="min-w-32" onClick={handlePublish} disabled={submitting}>
              {submitting ? "提交中..." : "发布"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
