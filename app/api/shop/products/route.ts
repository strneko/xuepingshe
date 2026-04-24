import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

export async function GET(request: Request) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录后查看积分商城" }, { status: 401 });
  }

  const [user, products] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        points: true,
      },
    }),
    prisma.shopProduct.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ needPoints: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        needPoints: true,
        coverText: true,
        stock: true,
      },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    myPoints: user.points,
    products: products.map((item) => ({
      id: item.id,
      name: item.name,
      needPoints: item.needPoints,
      cover: item.coverText ?? item.name,
      stock: item.stock,
    })),
  });
}
