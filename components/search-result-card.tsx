import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ScoreBox from "@/components/score-box";

export type SearchResultCardType = "course" | "teacher";

interface SearchResultCardProps {
  href: string;
  type: SearchResultCardType;
  title: string;
  subtitle: string;
  department: string;
  score?: number;
  reviewCount?: number;
  snippet?: string;
  keyword?: string;
  actionSlot?: React.ReactNode;
  borderless?: boolean;
}

function highlightText(text: string, keyword: string) {
  if (!keyword) {
    return text;
  }

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-yellow-100 px-0.5 text-foreground">
        {part}
      </mark>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    ),
  );
}

export default function SearchResultCard({
  href,
  type,
  title,
  subtitle,
  department,
  score,
  reviewCount,
  snippet,
  keyword = "",
  actionSlot,
  borderless = false,
}: SearchResultCardProps) {
  return (
    <Card
      className={`w-full transition-colors hover:bg-muted/30 ${borderless ? "border-0 rounded-none shadow-none" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 p-6">
        <Link href={href} className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">{highlightText(title, keyword)}</CardTitle>
              <Badge variant={type === "course" ? "default" : "secondary"}>{type === "course" ? "课程" : "教师"}</Badge>
            </div>
            <CardDescription>{highlightText(subtitle, keyword)}</CardDescription>
          </div>

          <CardContent className="space-y-1 p-0 text-sm text-muted-foreground">
            <p>{highlightText(department, keyword)}</p>
            {typeof score === "number" && typeof reviewCount === "number" && (
              <p>
                综合评分 <ScoreBox score={score} digits={1} className="align-middle" /> · 评价 {reviewCount}
              </p>
            )}
            {snippet && <p className="line-clamp-2">{highlightText(snippet, keyword)}</p>}
          </CardContent>
        </Link>

        {actionSlot ? <div onClick={(e) => e.stopPropagation()}>{actionSlot}</div> : null}
      </div>
    </Card>
  );
}
