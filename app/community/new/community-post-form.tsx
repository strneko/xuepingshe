"use client";

import * as React from "react";
import { Check, Eye, Hash, Plus, Save, Search, SquarePen, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import CommunityPostEditor from "./community-post-editor";

const RECOMMENDED_TOPICS = [
  "课程体验",
  "学习方法",
  "校园生活",
  "考试攻略",
  "选课建议",
  "社团活动",
  "宿舍日常",
  "保研经验",
  "实习分享",
  "资源整理",
];

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export default function CommunityPostForm() {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("<p></p>");
  const [topicQuery, setTopicQuery] = React.useState("");
  const [selectedTopics, setSelectedTopics] = React.useState<string[]>([]);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const filteredTopics = React.useMemo(() => {
    const query = topicQuery.trim().toLowerCase();

    if (!query) {
      return RECOMMENDED_TOPICS;
    }

    return RECOMMENDED_TOPICS.filter((topic) => topic.toLowerCase().includes(query));
  }, [topicQuery]);

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
    setErrorMessage(null);
    setStatusMessage("草稿已保存（当前为本地模拟）");
  }, []);

  const handlePublish = React.useCallback(() => {
    const validationError = validate();

    if (validationError) {
      setStatusMessage(null);
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage(null);
    setStatusMessage("帖子已准备发布（当前为本地模拟）");

    console.log("publish payload", {
      title: title.trim(),
      content,
      topics: selectedTopics,
    });
  }, [content, selectedTopics, title, validate]);

  return (
    <main className="px-[10vw] py-8">
      <Card className="overflow-hidden border-border/70 bg-background shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <SquarePen className="size-5 text-primary" />
              发布帖子
            </CardTitle>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Save className="size-3.5" />
              草稿箱
            </div>
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
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setErrorMessage(null);
                    setStatusMessage(null);
                  }}
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
              <CommunityPostEditor
                value={content}
                onChange={(nextContent) => {
                  setContent(nextContent);
                  setErrorMessage(null);
                  setStatusMessage(null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                支持标题、列表、引用、链接和对齐操作，后续也可以扩展图片上传。
              </p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-[96px_minmax(0,1fr)] md:items-start">
            <div className="pt-2">
              <div className="text-sm font-medium text-foreground">话题:</div>
            </div>
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={topicQuery}
                  onChange={(event) => setTopicQuery(event.target.value)}
                  placeholder="搜索话题"
                  className="pl-9"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">推荐话题</div>
                <div className="flex flex-wrap gap-2">
                  {filteredTopics.map((topic) => {
                    const active = selectedTopics.includes(topic);

                    return (
                      <Button
                        key={topic}
                        type="button"
                        size="sm"
                        variant={active ? "secondary" : "outline"}
                        className={cn(
                          "rounded-full px-3 text-xs",
                          active && "border-primary/30 bg-primary/10 text-primary",
                        )}
                        onClick={() => toggleTopic(topic)}
                      >
                        {active ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                        {topic}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">已选话题</div>
                {selectedTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTopics.map((topic) => (
                      <Button
                        key={topic}
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="rounded-full px-3 text-xs"
                        onClick={() => toggleTopic(topic)}
                      >
                        <Hash className="size-3.5" />
                        {topic}
                        <X className="size-3.5" />
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">还没有选择话题，发帖时建议至少选 1 个。</p>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-[96px_minmax(0,1fr)] md:items-start">
            <div className="pt-2">
              <div className="text-sm font-medium text-foreground">预览:</div>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-base font-semibold text-foreground">{title.trim() || "标题预览"}</div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {stripHtml(content) || "这里会显示正文预览，当前没有输入内容。"}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" className="shrink-0 text-muted-foreground">
                  <Eye className="size-4" />
                  预览
                </Button>
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

          <div className="space-y-2 text-sm">
            {errorMessage ? (
              <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive">
                {errorMessage}
              </p>
            ) : null}
            {statusMessage ? (
              <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-primary">{statusMessage}</p>
            ) : null}
          </div>

          <div className="flex justify-center gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={handleSaveDraft}>
              保存草稿
            </Button>
            <Button type="button" className="min-w-32" onClick={handlePublish}>
              发布
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
