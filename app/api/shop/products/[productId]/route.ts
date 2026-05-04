import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";

interface RouteContext {
  params: Promise<{ productId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  if (!isAdmin(userId)) {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }

  const { productId } = await context.params;

  const existing = await prisma.shopProduct.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "商品不存在" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }

  if (typeof body.needPoints === "number" && Number.isFinite(body.needPoints) && body.needPoints > 0) {
    data.needPoints = Math.trunc(body.needPoints);
  }

  if (typeof body.coverText === "string") {
    data.coverText = body.coverText.trim() || null;
  }

  if (typeof body.imageUrl === "string") {
    data.imageUrl = body.imageUrl.trim() || null;
  }

  if (typeof body.stock === "number" && Number.isFinite(body.stock)) {
    const stockVal = Math.trunc(body.stock);
    data.stock = stockVal < 0 ? null : stockVal;
  }

  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: "没有需要更新的字段" }, { status: 400 });
  }

  const product = await prisma.shopProduct.update({
    where: { id: productId },
    data,
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

export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  if (!isAdmin(userId)) {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }

  const { productId } = await context.params;

  const existing = await prisma.shopProduct.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "商品不存在" }, { status: 404 });
  }

  const orderCount = await prisma.shopRedeemOrder.count({
    where: { productId },
  });

  if (orderCount > 0) {
    return NextResponse.json(
      { message: "该商品已有兑换记录，无法删除。如需下架请将状态改为下架" },
      { status: 409 },
    );
  }

  await prisma.shopProduct.delete({ where: { id: productId } });

  return NextResponse.json({ message: "商品已删除" });
}
