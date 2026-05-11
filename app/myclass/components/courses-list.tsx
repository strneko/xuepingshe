"use client";

import { useEffect, useState } from "react";
import { CourseCardProps, TrendDataPoint } from "../page";
import { CourseCard } from "./course-item";
import { Separator } from "@/components/ui/separator";

interface CourseListProps {
  courses: CourseCardProps[];
  keyword?: string;
  isAdmin?: boolean;
}

export default function CoursesList({ courses, keyword = "", isAdmin = false }: CourseListProps) {
  const [trendsMap, setTrendsMap] = useState<Record<string, TrendDataPoint[]>>({});

  useEffect(() => {
    const courseIds = courses.map((c) => c.courseId).filter(Boolean);
    if (courseIds.length === 0) return;

    let cancelled = false;

    async function fetchTrends() {
      try {
        const res = await fetch(`/api/courses/score-trends?courseIds=${courseIds.join(",")}`);
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (!cancelled) {
          setTrendsMap(json.trends ?? {});
        }
      } catch {
        // Silently fail - trends are optional
      }
    }

    fetchTrends();
    return () => { cancelled = true; };
  }, [courses.map((c) => c.courseId).join(",")]);

  if (courses.length === 0) {
    return (
      <div className="px-[10vw] py-10">
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          {keyword ? `没有找到与"${keyword}"相关的课程或教师` : "暂无课程数据"}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-[10vw]">
      <div className="overflow-hidden rounded-xl border bg-card">
        {courses.map((course, index) => (
          <div key={course.offeringId}>
            <CourseCard
              enrollmentId={course.enrollmentId}
              offeringId={course.offeringId}
              courseId={course.courseId}
              courseName={course.courseName}
              viewerRole={course.viewerRole}
              teacher={course.teacher}
              term={course.term}
              offeringStatus={course.offeringStatus}
              location={course.location}
              time={course.time}
              imageUrl={course.imageUrl}
              deadline={course.deadline}
              isEvaluated={course.isEvaluated}
              description={course.description}
              credits={course.credits}
              inviteCode={course.inviteCode}
              recentScore={course.recentScore}
              reviewCount={course.reviewCount}
              activeRoundId={course.activeRoundId}
              keyword={keyword}
              isAdmin={isAdmin}
              trendData={trendsMap[course.courseId]}
            />
            {index < courses.length - 1 ? <Separator /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
