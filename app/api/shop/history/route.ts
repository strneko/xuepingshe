import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录后查看兑换记录" }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawPage = Number(url.searchParams.get("page") ?? "1");
  const rawPageSize = Number(url.searchParams.get("pageSize") ?? "10");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;
  const pageSize = Math.min(20, Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.trunc(rawPageSize) : 10);

  const [total, items] = await Promise.all([
    prisma.shopRedeemOrder.count({ where: { userId } }),
    prisma.shopRedeemOrder.findMany({
      where: { userId },
      select: {
        id: true,
        productSnapshotName: true,
        pointsSpent: true,
        receiverName: true,
        receiverPhone: true,
        receiverAddress: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      productName: item.productSnapshotName,
      pointsSpent: item.pointsSpent,
      receiverName: item.receiverName,
      receiverPhone: item.receiverPhone,
      receiverAddress: item.receiverAddress,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    })),
    total,
    currentPage: page,
    totalPages,
  });
}
