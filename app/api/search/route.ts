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

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (keyword) {
    where.searchableText = { contains: keyword, mode: "insensitive" };
  }
  if (category === "1") {
    where.docType = "COURSE";
  } else if (category === "2") {
    where.docType = "TEACHER";
  }

  // Map sort to orderBy
  let orderBy: Record<string, string> | undefined;
  if (sort === "score") {
    orderBy = { scoreSnapshot: "desc" };
  } else if (sort === "hot") {
    orderBy = { reviewCountSnapshot: "desc" };
  }

  // DB-level pagination
  const total = await prisma.searchDocument.count({ where });
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
      searchableText: true,
    },
    ...(orderBy ? { orderBy } : {}),
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
  });

  // Convert and compute relevance when sorting by relevance with keyword
  const items = documents.map((doc) => {
    const item = toSearchResultItem(doc);
    if (keyword && sort === "relevance") {
      return { item, relevance: computeRelevance(item, keyword) };
    }
    return { item, relevance: 0 };
  });

  if (sort === "relevance" && keyword) {
    items.sort((a, b) => b.relevance - a.relevance || b.item.reviewCount - a.item.reviewCount);
  }

  const resultItems = items.map(({ item }) => item);

  // Count totals for category display (separate lightweight query)
  let courseCount: number;
  let teacherCount: number;
  if (category === "0") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const countWhere: any = keyword ? { searchableText: { contains: keyword, mode: "insensitive" } } : {};
    const [cCount, tCount] = await Promise.all([
      prisma.searchDocument.count({ where: { ...countWhere, docType: "COURSE" } }),
      prisma.searchDocument.count({ where: { ...countWhere, docType: "TEACHER" } }),
    ]);
    courseCount = cCount;
    teacherCount = tCount;
  } else {
    courseCount = category === "1" ? total : 0;
    teacherCount = category === "2" ? total : 0;
  }

  return NextResponse.json({
    items: resultItems,
    total,
    courseCount,
    teacherCount,
    page: safePage,
    pageSize: safePageSize,
    hasMore: safePage * safePageSize < total,
  });
}
