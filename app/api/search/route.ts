import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeRelevance, normalizeText, toSearchResultItem } from "@/lib/search-recommendation";

type SortType = "relevance" | "score" | "hot";

export async function GET(request: NextRequest) {
  const keyword = normalizeText(request.nextUrl.searchParams.get("keyword") ?? "");
  const category = request.nextUrl.searchParams.get("category") ?? "0";
  const sort = (request.nextUrl.searchParams.get("sort") as SortType | null) ?? "relevance";
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "20");

  const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.trunc(pageSize) : 20;

  const where = {
    ...(category === "1" ? { docType: "COURSE" as const } : {}),
    ...(category === "2" ? { docType: "TEACHER" as const } : {}),
  };

  const documents = await prisma.searchDocument.findMany({
    where,
    select: {
      docType: true,
      docId: true,
      title: true,
      subtitle: true,
      department: true,
      scoreSnapshot: true,
      reviewCountSnapshot: true,
      snippet: true,
    },
  });

  const itemsWithRelevance = documents
    .map((document) => {
      const item = toSearchResultItem(document);
      return { item, relevance: computeRelevance(item, keyword) };
    })
    .filter(({ relevance }) => relevance >= 0 || !keyword);

  const sorted = itemsWithRelevance
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
