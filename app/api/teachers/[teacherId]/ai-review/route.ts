import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrGenerateAiReview, RateLimitError } from "@/lib/ai/generate-review";
import { getSessionUserId } from "@/lib/auth/session";
import type { TeacherAiData } from "@/lib/ai/generate-review";

interface RouteContext {
  params: Promise<{ teacherId: string }>;
}

function formatTrendSummary(records: Array<{ timeLabel: string; overallScore: number | null }>): string {
  if (records.length === 0) return "暂无趋势数据";

  const sorted = [...records].reverse(); // oldest first
  const parts = sorted.map((r) => `${r.timeLabel}: ${r.overallScore?.toFixed(2) ?? "—"}分`);

  const valid = sorted.filter((r) => r.overallScore != null);
  let direction = "";
  if (valid.length >= 2) {
    const first = valid[0]!.overallScore!;
    const last = valid[valid.length - 1]!.overallScore!;
    const diff = last - first;
    if (diff > 0.3) direction = " ↗ 稳步上升";
    else if (diff > 0.1) direction = " ↗ 小幅上升";
    else if (diff < -0.3) direction = " ↘ 有所下滑";
    else if (diff < -0.1) direction = " ↘ 小幅下滑";
    else direction = " → 基本持平";
  }

  return `${parts.join(" → ")}${direction}`;
}

const DIMENSION_LABELS: Record<string, string> = {
  attitude: "教学态度与师德",
  content: "教学内容与设计",
  method: "教学方法与技巧",
  effect: "教学效果与成果",
  interaction: "师生互动与氛围",
  resource: "课程资源与评价",
  improve: "教学创新与改进",
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { teacherId } = await context.params;

  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const [teacherProfile, recentReviews, trendRecords] = await Promise.all([
    prisma.teacherProfile.findUnique({
      where: { teacherId },
      select: {
        teacherName: true,
        department: true,
        title: true,
        researchAreas: true,
        description: true,
        recentOverallScore: true,
        recentSevenScoresJson: true,
        courses: {
          select: { courseName: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.teacherReview.findMany({
      where: { teacherId, status: "VISIBLE" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { overallScore: true, summary: true },
    }),
    prisma.teacherScoreHistory.findMany({
      where: { teacherId, granularity: "SEMESTER" },
      orderBy: { sortOrder: "desc" },
      take: 6,
      select: { timeLabel: true, overallScore: true },
    }),
  ]);

  if (!teacherProfile) {
    return NextResponse.json({ message: "教师不存在" }, { status: 404 });
  }

  const dimensions = Array.isArray(teacherProfile.recentSevenScoresJson)
    ? (
        teacherProfile.recentSevenScoresJson as Array<{
          key: string;
          label?: string;
          score: number;
        }>
      ).map((d) => ({
        key: d.key,
        label: DIMENSION_LABELS[d.key] ?? d.label ?? d.key,
        score: d.score,
      }))
    : [];

  const data: TeacherAiData = {
    teacherName: teacherProfile.teacherName,
    department: teacherProfile.department,
    title: teacherProfile.title,
    researchAreas: teacherProfile.researchAreas,
    description: teacherProfile.description,
    overallScore: teacherProfile.recentOverallScore,
    dimensions,
    recentReviewCount: recentReviews.length,
    recentReviewSample: recentReviews.map((r) => ({
      score: r.overallScore,
      summary: r.summary,
    })),
    courseNames: teacherProfile.courses.map((c) => c.courseName),
    scoreTrend: formatTrendSummary(trendRecords),
  };

  try {
    const { content, fromCache } = await getOrGenerateAiReview("TEACHER", teacherId, data);
    return NextResponse.json({ content, fromCache });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ message: "AI 生成请求过于频繁，请 30 秒后再试" }, { status: 429 });
    }
    console.error("AI review generation failed for teacher:", err);
    return NextResponse.json({ message: "AI 点评生成失败，请稍后重试" }, { status: 500 });
  }
}
