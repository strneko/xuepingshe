import { NextResponse } from "next/server";
import { ReviewItem } from "../../../course/[courseId]/_types";

const recommendedReviews: ReviewItem[] = [
  {
    id: "rec-rv-1",
    nickname: "匿名同学K",
    sourceCourseName: "高等数学",
    sourceTeacherName: "张教授",
    createdAt: "2026-03-04",
    overallScore: 4.9,
    likesCount: 160,
    summary: "讲解系统、例题覆盖全面，适合打基础。",
    detailedScores: [
      { key: "attitude", label: "教学态度与师德", score: 5.0 },
      { key: "content", label: "教学内容与设计", score: 4.8 },
      { key: "method", label: "教学方法与技巧", score: 4.9 },
      { key: "effect", label: "教学效果与成果", score: 4.8 },
      { key: "interaction", label: "师生互动与氛围", score: 4.9 },
      { key: "resource", label: "课程资源与评价", score: 4.7 },
      { key: "improve", label: "教学创新与改进", score: 4.8 },
    ],
  },
  {
    id: "rec-rv-2",
    nickname: "匿名同学L",
    sourceCourseName: "线性代数",
    sourceTeacherName: "李教授",
    createdAt: "2026-03-02",
    overallScore: 4.7,
    likesCount: 132,
    summary: "课堂互动自然，知识点拆分清晰，复习压力小。",
  },
  {
    id: "rec-rv-3",
    nickname: "匿名同学M",
    sourceCourseName: "概率论与数理统计",
    sourceTeacherName: "王教授",
    createdAt: "2026-02-27",
    overallScore: 4.8,
    likesCount: 118,
    summary: "案例很贴近考试题型，重点题讲得非常透彻。",
  },
  {
    id: "rec-rv-4",
    nickname: "匿名同学N",
    sourceCourseName: "离散数学",
    sourceTeacherName: "陈教授",
    createdAt: "2026-02-24",
    overallScore: 4.6,
    likesCount: 105,
    summary: "教学节奏合理，课后资料结构化程度高。",
  },
];

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return NextResponse.json(recommendedReviews);
}
