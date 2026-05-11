"use client";

import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Sparkles, AlertCircle, ThumbsUp, Lightbulb, FileText } from "lucide-react";

interface AiReviewCardProps {
  fetchUrl: string;
  title?: string;
  /** Render without Card wrapper (for use inside tabs) */
  inline?: boolean;
}

type ReviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "loaded"; content: string; fromCache: boolean };

export default function AiReviewCard({ fetchUrl, title = "AI 点评", inline = false }: AiReviewCardProps) {
  const [state, setState] = useState<ReviewState>({ status: "loading" });

  const fetchReview = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch(fetchUrl);
      if (res.status === 401) {
        setState({ status: "empty" });
        return;
      }
      if (res.status === 429) {
        setState({ status: "error", message: "请求过于频繁，请稍后再试" });
        return;
      }
      if (!res.ok) {
        throw new Error("加载失败");
      }
      const json = await res.json();
      if (json.content) {
        setState({ status: "loaded", content: json.content, fromCache: json.fromCache ?? false });
      } else {
        setState({ status: "empty" });
      }
    } catch {
      setState({ status: "error", message: "AI 点评加载失败" });
    }
  }, [fetchUrl]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-base font-semibold">
        <Sparkles className="size-4 text-amber-500" />
        {title}
      </div>
      {state.status === "loaded" && (
        <button
          onClick={fetchReview}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="重新生成"
        >
          <RefreshCw className="size-3" />
          刷新
        </button>
      )}
    </div>
  );

  const body = (
    <>
      {state.status === "loading" && <LoadingSkeleton />}
      {state.status === "error" && <ErrorBlock message={state.message} onRetry={fetchReview} />}
      {state.status === "empty" && <EmptyBlock />}
      {state.status === "loaded" && <ContentBlock content={state.content} />}
    </>
  );

  if (inline) {
    return (
      <div className="space-y-3">
        {header}
        {body}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-1.5 text-base">
          <Sparkles className="size-4 text-amber-500" />
          {title}
        </CardTitle>
        {state.status === "loaded" && (
          <button
            onClick={fetchReview}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="重新生成"
          >
            <RefreshCw className="size-3" />
            刷新
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">{body}</CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2.5">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-11/12" />
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-3.5 w-9/12" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-3/4" />
    </div>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <AlertCircle className="size-8 text-destructive/70" />
      <p className="text-xs text-muted-foreground text-center">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
      >
        <RefreshCw className="size-3" />
        重试
      </button>
    </div>
  );
}

function EmptyBlock() {
  return (
    <div className="flex flex-col items-center gap-2 py-6">
      <Sparkles className="size-6 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground">暂无 AI 点评</p>
      <p className="text-[11px] text-muted-foreground/60 text-center">登录后可生成 AI 分析</p>
    </div>
  );
}

function mdComponent<P extends { children?: React.ReactNode }>(
  render: (props: P) => React.ReactNode,
): (props: P) => React.ReactNode {
  return render;
}

const markdownComponents = {
  p: mdComponent(({ children }) => (
    <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
  )),
  strong: mdComponent(({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  )),
  ul: mdComponent(({ children }) => (
    <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">{children}</ul>
  )),
  ol: mdComponent(({ children }) => (
    <ol className="list-decimal pl-4 space-y-1 text-sm text-muted-foreground">{children}</ol>
  )),
  li: mdComponent(({ children }) => (
    <li className="text-sm leading-relaxed text-muted-foreground">{children}</li>
  )),
  em: mdComponent(({ children }) => (
    <em className="italic text-foreground/80">{children}</em>
  )),
};

/** Parse AI response into sections based on 【】 markers */
function parseSections(content: string): { icon: React.ReactNode; label: string; body: string }[] {
  const sectionRegex = /【(.+?)】\s*([\s\S]*?)(?=【|$)/g;
  const sections: { icon: React.ReactNode; label: string; body: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(content)) !== null) {
    const label = match[1]!.trim();
    const body = match[2]!.trim();
    const icon = label.includes("优点") || label.includes("亮点")
      ? <ThumbsUp className="size-3.5 text-emerald-500 shrink-0" />
      : label.includes("不足") || label.includes("改进") || label.includes("建议")
        ? <Lightbulb className="size-3.5 text-amber-500 shrink-0" />
        : <FileText className="size-3.5 text-blue-500 shrink-0" />;
    sections.push({ icon, label, body });
  }

  return sections;
}

function ContentBlock({ content }: { content: string }) {
  const sections = parseSections(content);

  if (sections.length > 0) {
    return (
      <div className="space-y-4">
        {sections.map((sec, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              {sec.icon}
              <span className="text-sm font-medium text-foreground">{sec.label}</span>
            </div>
            <div className="pl-5 ai-markdown">
              <ReactMarkdown components={markdownComponents}>{sec.body}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // No 【】 markers — render entire content as markdown
  return (
    <div className="ai-markdown">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
