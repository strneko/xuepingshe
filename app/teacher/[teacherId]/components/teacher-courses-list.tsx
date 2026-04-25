"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ScoreBox from "@/components/score-box";

interface TeacherCourseItem {
  courseId: string;
  courseName: string;
  score: number | null;
  reviewCount: number;
}

interface TeacherCoursesListProps {
  teacherId: string;
}

export default function TeacherCoursesList({ teacherId }: TeacherCoursesListProps) {
  const [items, setItems] = useState<TeacherCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/teachers/${teacherId}/courses`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("加载失败");
        }

        const payload = (await response.json()) as { items?: TeacherCourseItem[] };
        if (!active) {
          return;
        }

        setItems(Array.isArray(payload.items) ? payload.items : []);
      } catch {
        if (!active) {
          return;
        }
        setError("教授课程加载失败，请稍后重试");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [teacherId]);

  const content = useMemo(() => {
    if (loading) {
      return Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-10 rounded border bg-muted/20" />
      ));
    }

    if (error) {
      return (
        <div className="rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      );
    }

    if (items.length === 0) {
      return <div className="rounded border px-3 py-8 text-center text-sm text-muted-foreground">暂无关联课程</div>;
    }

    return items.map((item) => (
      <Link
        key={`${item.courseId}-${item.courseName}`}
        href={`/course/${item.courseId}`}
        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
      >
        <span className="font-medium">{item.courseName}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <ScoreBox score={item.score} digits={1} />
          <span>{item.reviewCount} 条评价</span>
        </span>
      </Link>
    ));
  }, [error, items, loading]);

  return (
    <div className="rounded-md border p-4">
      <div className="h-90 space-y-2 overflow-y-auto rounded-md border p-2">{content}</div>
    </div>
  );
}
