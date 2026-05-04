import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录后查看积分商城" }, { status: 401 });
  }

  const includeInactive = isAdmin(userId);

  const [user, products] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        points: true,
      },
    }),
    prisma.shopProduct.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ needPoints: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        needPoints: true,
        coverText: true,
        imageUrl: true,
        stock: true,
        isActive: true,
      },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    myPoints: user.points,
    isAdmin: includeInactive,
    products: products.map((item) => ({
      id: item.id,
      name: item.name,
      needPoints: item.needPoints,
      cover: item.coverText ?? item.name,
      imageUrl: item.imageUrl,
      stock: item.stock,
      isActive: item.isActive,
    })),
  });
}

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  if (!isAdmin(userId)) {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const needPoints = typeof body.needPoints === "number" && Number.isFinite(body.needPoints) ? Math.trunc(body.needPoints) : 0;
  const coverText = typeof body.coverText === "string" ? body.coverText.trim() : null;
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : null;
  const stock = typeof body.stock === "number" && Number.isFinite(body.stock) ? Math.trunc(body.stock) : null;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

  if (!name || needPoints <= 0) {
    return NextResponse.json({ message: "名称和所需积分不能为空" }, { status: 400 });
  }

  const product = await prisma.shopProduct.create({
    data: {
      name,
      needPoints,
      coverText,
      imageUrl,
      stock: stock !== null && stock < 0 ? null : stock,
      isActive,
    },
    select: {
      id: true,
      name: true,
      needPoints: true,
      coverText: true,
      imageUrl: true,
      stock: true,
      isActive: true,
    },
  });

  return NextResponse.json({
    id: product.id,
    name: product.name,
    needPoints: product.needPoints,
    cover: product.coverText ?? product.name,
    imageUrl: product.imageUrl,
    stock: product.stock,
    isActive: product.isActive,
  });
}
