import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLimit } from "@/lib/community/shared";

export async function GET(request: NextRequest) {
  try {
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"), { defaultValue: 5, maxValue: 20 });

    const items = await prisma.communityAnnouncement.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        href: true,
        pinned: true,
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取公告失败";
    return NextResponse.json({ message }, { status: 400 });
  }
}
