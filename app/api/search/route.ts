import { NextRequest, NextResponse } from "next/server";

type ResultType = "course" | "teacher";
type SortType = "relevance" | "score" | "hot";

interface SearchResultItem {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  department: string;
  score: number;
  reviewCount: number;
  snippet: string;
  href: string;
}

const MOCK_RESULTS: SearchResultItem[] = [
  {
    id: "course-1",
    type: "course",
    title: "高等数学",
    subtitle: "任课教师：张教授",
    department: "数学与统计学院",
    score: 4.8,
    reviewCount: 126,
    snippet: "极限、导数、积分讲解系统，重难点拆解细致，作业反馈及时。",
    href: "/course/1",
  },
  {
    id: "teacher-1",
    type: "teacher",
    title: "张教授",
    subtitle: "教授 / 博导",
    department: "数学与统计学院",
    score: 4.8,
    reviewCount: 331,
    snippet: "长期承担高等数学、线性代数课程，注重课堂互动与知识体系搭建。",
    href: "/teacher/1",
  },
  {
    id: "course-2",
    type: "course",
    title: "线性代数",
    subtitle: "任课教师：李教授",
    department: "数学与统计学院",
    score: 4.6,
    reviewCount: 98,
    snippet: "矩阵与向量空间讲解清晰，课后习题覆盖考试重点。",
    href: "/course/2",
  },
  {
    id: "teacher-2",
    type: "teacher",
    title: "李教授",
    subtitle: "副教授",
    department: "数学与统计学院",
    score: 4.6,
    reviewCount: 214,
    snippet: "线性代数课堂节奏适中，善于通过例题建立抽象概念。",
    href: "/teacher/2",
  },
  {
    id: "course-3",
    type: "course",
    title: "概率论与数理统计",
    subtitle: "任课教师：王教授",
    department: "统计学院",
    score: 4.7,
    reviewCount: 143,
    snippet: "案例驱动教学，统计推断章节结构化程度高。",
    href: "/course/3",
  },
  {
    id: "teacher-3",
    type: "teacher",
    title: "王教授",
    subtitle: "教授",
    department: "统计学院",
    score: 4.7,
    reviewCount: 267,
    snippet: "擅长用真实数据案例解释概率模型，课堂实践性强。",
    href: "/teacher/3",
  },
];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function computeRelevance(item: SearchResultItem, keyword: string) {
  if (!keyword) {
    return 0;
  }

  const target = `${item.title} ${item.subtitle} ${item.department} ${item.snippet}`.toLowerCase();
  if (!target.includes(keyword)) {
    return -1;
  }

  let score = 1;
  if (item.title.toLowerCase().includes(keyword)) score += 3;
  if (item.subtitle.toLowerCase().includes(keyword)) score += 2;
  if (item.snippet.toLowerCase().includes(keyword)) score += 1;
  return score;
}

export async function GET(request: NextRequest) {
  const keyword = normalizeText(request.nextUrl.searchParams.get("keyword") ?? "");
  const category = request.nextUrl.searchParams.get("category") ?? "0";
  const sort = (request.nextUrl.searchParams.get("sort") as SortType | null) ?? "relevance";
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "20");

  const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.trunc(pageSize) : 20;

  const byCategory = MOCK_RESULTS.filter((item) => {
    if (category === "1") return item.type === "course";
    if (category === "2") return item.type === "teacher";
    return true;
  });

  const byKeyword = byCategory
    .map((item) => ({ item, relevance: computeRelevance(item, keyword) }))
    .filter(({ relevance }) => relevance >= 0 || !keyword);

  const sorted = byKeyword
    .sort((a, b) => {
      if (sort === "score") return b.item.score - a.item.score;
      if (sort === "hot") return b.item.reviewCount - a.item.reviewCount;
      return b.relevance - a.relevance || b.item.reviewCount - a.item.reviewCount;
    })
    .map(({ item }) => item);

  const total = sorted.length;
  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;
  const items = sorted.slice(start, end);

  const courseCount = sorted.filter((item) => item.type === "course").length;
  const teacherCount = sorted.filter((item) => item.type === "teacher").length;

  await new Promise((resolve) => setTimeout(resolve, 200));

  return NextResponse.json({
    items,
    total,
    courseCount,
    teacherCount,
    page: safePage,
    pageSize: safePageSize,
    hasMore: end < total,
  });
}
