import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLimit } from "@/lib/community/shared";

export async function GET(request: NextRequest) {
  try {
    const keyword = (request.nextUrl.searchParams.get("keyword") ?? "").trim();
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"), { defaultValue: 10, maxValue: 30 });
    const take = keyword ? limit : Math.min(limit, 5);

    if (!keyword) {
      const recommended = await prisma.communityTopic.findMany({
        where: {
          isRecommended: true,
        },
        orderBy: [{ followerCount: "desc" }, { postCount: "desc" }, { name: "asc" }],
        take,
        select: {
          id: true,
          name: true,
          postCount: true,
          followerCount: true,
        },
      });

      if (recommended.length > 0) {
        return NextResponse.json({
          items: recommended.map((item) => ({
            id: item.id,
            name: item.name,
            postCount: item.postCount,
            followerCount: item.followerCount,
          })),
        });
      }
    }

    const items = await prisma.communityTopic.findMany({
      where: keyword
        ? {
            name: {
              contains: keyword,
              mode: "insensitive",
            },
          }
        : undefined,
      orderBy: [{ followerCount: "desc" }, { postCount: "desc" }, { name: "asc" }],
      take,
      select: {
        id: true,
        name: true,
        postCount: true,
        followerCount: true,
      },
    });

    if (items.length > 0) {
      return NextResponse.json({
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          postCount: item.postCount,
          followerCount: item.followerCount,
        })),
      });
    }

    return NextResponse.json({ items: [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取话题失败";
    return NextResponse.json({ message }, { status: 400 });
  }
}
