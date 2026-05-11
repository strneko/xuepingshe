import { prisma } from "@/lib/prisma";
import { generateAiReview } from "./client";
import { createHash } from "crypto";

// ── Rate limiting for actual AI API calls (not cached reads) ──

const generationLocks = new Map<string, number>();
const MIN_GENERATION_INTERVAL_MS = 30_000; // 30s between actual DeepSeek calls per entity

function checkAiRateLimit(key: string): boolean {
  const now = Date.now();
  const lastGen = generationLocks.get(key);
  if (lastGen && now - lastGen < MIN_GENERATION_INTERVAL_MS) {
    return false; // rate limited
  }
  generationLocks.set(key, now);
  return true;
}

export type TargetType = "COURSE" | "TEACHER";

// ── Data shapes for prompt building ──

export interface CourseAiData {
  courseName: string;
  teacherName: string;
  intro: string;
  location: string;
  schedule: string;
  overallScore: number;
  dimensions: Array<{ key: string; label: string; score: number }>;
  recentReviewCount: number;
  recentReviewSample: Array<{ score: number | null; summary: string }>;
  announcementCount: number;
  /** Human-readable trend summary, e.g. "2023-S1: 4.1 → 2023-S2: 4.3 → ... → 趋势：稳步上升" */
  scoreTrend: string;
}

export interface TeacherAiData {
  teacherName: string;
  department: string;
  title: string;
  researchAreas: string[];
  description: string;
  overallScore: number;
  dimensions: Array<{ key: string; label: string; score: number }>;
  recentReviewCount: number;
  recentReviewSample: Array<{ score: number | null; summary: string }>;
  courseNames: string[];
  /** Human-readable trend summary, e.g. "2023-S1: 4.1 → 2023-S2: 4.3 → ... → 趋势：稳步上升" */
  scoreTrend: string;
}

// ── Hash for cache invalidation ──

function computeDataHash(data: Record<string, unknown>): string {
  const stable = JSON.stringify(data, Object.keys(data).sort());
  return createHash("sha256").update(stable).digest("hex").slice(0, 16);
}

// ── Prompt builders ──

function buildCoursePrompt(data: CourseAiData): string {
  const dimensionsText = data.dimensions
    .map((d) => `  - ${d.label}: ${d.score.toFixed(2)}分`)
    .join("\n");

  const reviewsText = data.recentReviewSample
    .map((r) => `  - 评分: ${r.score ?? "无"} | 评语: ${r.summary.slice(0, 80)}`)
    .join("\n");

  return `直接输出以下格式的点评，禁止包含任何开场白、问候语或确认语句（如"好的"、"以下是"、"根据数据分析"等），直接从【总体评价】开始：

【总体评价】
用1-2句话概括该课程的整体表现和核心特点。

【突出亮点】
列出2-3个该课程最突出的优点，结合具体评分数据和趋势变化说明（如某维度持续上升）。

【改进建议】
根据评分较低或评价较少的维度，以及趋势中下滑的方向，提出1-2条具体可行的改进方向。

【一句话总结】
用一句话精炼总结该课程。

──────────────
课程数据如下：

课程名称：${data.courseName}
授课教师：${data.teacherName}
课程简介：${data.intro}
上课地点：${data.location} | 上课时间：${data.schedule}

综合评分：${data.overallScore.toFixed(2)}分（满分5分）
七项维度评分：
${dimensionsText}

评价总数：${data.recentReviewCount} 条 | 公告数：${data.announcementCount} 条
评分趋势（按学期）：
${data.scoreTrend}

最近评价摘录：
${reviewsText || "暂无"}`;
}

function buildTeacherPrompt(data: TeacherAiData): string {
  const dimensionsText = data.dimensions
    .map((d) => `  - ${d.label}: ${d.score.toFixed(2)}分`)
    .join("\n");

  const reviewsText = data.recentReviewSample
    .map((r) => `  - 评分: ${r.score ?? "无"} | 评语: ${r.summary.slice(0, 80)}`)
    .join("\n");

  return `直接输出以下格式的点评，禁止包含任何开场白、问候语或确认语句（如"好的"、"以下是"、"根据数据分析"等），直接从【总体评价】开始：

【总体评价】
用1-2句话概括该教师的整体教学水平和核心特点。

【突出亮点】
列出2-3个该教师最突出的优点，结合具体评分数据和趋势变化说明（如某维度持续上升）。

【改进建议】
根据评分较低或评价较少的维度，以及趋势中下滑的方向，提出1-2条具体可行的改进方向。

【一句话总结】
用一句话精炼总结该教师。

──────────────
教师数据如下：

教师姓名：${data.teacherName}
所属院系：${data.department} | 职称：${data.title}
研究领域：${data.researchAreas.join("、")}
简介：${data.description}

综合评分：${data.overallScore.toFixed(2)}分（满分5分）
七项维度评分：
${dimensionsText}

评价总数：${data.recentReviewCount} 条
授课课程：${data.courseNames.join("、") || "暂无"}
评分趋势（按学期）：
${data.scoreTrend}

最近评价摘录：
${reviewsText || "暂无"}`;
}

// ── Main cache-or-generate function ──

export async function getOrGenerateAiReview(
  targetType: TargetType,
  targetId: string,
  data: CourseAiData | TeacherAiData,
): Promise<{ content: string; fromCache: boolean }> {
  const newHash = computeDataHash(data as unknown as Record<string, unknown>);
  const now = new Date();

  const existing = await prisma.aIReviewCache.findUnique({
    where: { targetType_targetId: { targetType, targetId } },
  });

  // Return cached content if still fresh and data hasn't changed
  if (
    existing?.content &&
    (!existing.staleAt || existing.staleAt > now) &&
    existing.dataHash === newHash
  ) {
    return { content: existing.content, fromCache: true };
  }

  // Rate-limit actual AI calls (not cached reads)
  const lockKey = `${targetType}:${targetId}`;
  if (!checkAiRateLimit(lockKey)) {
    throw new RateLimitError();
  }

  // Generate new content via AI
  const prompt =
    targetType === "COURSE"
      ? buildCoursePrompt(data as CourseAiData)
      : buildTeacherPrompt(data as TeacherAiData);

  const content = await generateAiReview(prompt);

  // Upsert the cache
  await prisma.aIReviewCache.upsert({
    where: { targetType_targetId: { targetType, targetId } },
    create: { targetType, targetId, content, dataHash: newHash },
    update: { content, dataHash: newHash, generatedAt: now, staleAt: null },
  });

  return { content, fromCache: false };
}

export class RateLimitError extends Error {
  constructor() {
    super("AI generation rate limited");
    this.name = "RateLimitError";
  }
}

export async function markAiReviewStale(targetType: TargetType, targetId: string): Promise<void> {
  await prisma.aIReviewCache
    .upsert({
      where: { targetType_targetId: { targetType, targetId } },
      create: { targetType, targetId, content: null, staleAt: new Date() },
      update: { staleAt: new Date() },
    })
    .catch(() => {
      // best-effort: don't block the caller
    });
}
