import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

export async function POST(request: Request) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录后再兑换" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const productId =
    payload && typeof payload === "object" && typeof (payload as { productId?: unknown }).productId === "string"
      ? (payload as { productId: string }).productId.trim()
      : "";
  const receiverName =
    payload && typeof payload === "object" && typeof (payload as { receiverName?: unknown }).receiverName === "string"
      ? (payload as { receiverName: string }).receiverName.trim()
      : "";
  const receiverPhone =
    payload && typeof payload === "object" && typeof (payload as { receiverPhone?: unknown }).receiverPhone === "string"
      ? (payload as { receiverPhone: string }).receiverPhone.trim()
      : "";
  const receiverAddress =
    payload &&
    typeof payload === "object" &&
    typeof (payload as { receiverAddress?: unknown }).receiverAddress === "string"
      ? (payload as { receiverAddress: string }).receiverAddress.trim()
      : "";
  const remark =
    payload && typeof payload === "object" && typeof (payload as { remark?: unknown }).remark === "string"
      ? (payload as { remark: string }).remark.trim()
      : "";

  if (!productId) {
    return NextResponse.json({ message: "商品ID不能为空" }, { status: 400 });
  }

  if (!receiverName || !receiverPhone || !receiverAddress) {
    return NextResponse.json({ message: "请完整填写收件人、手机号码和收件地" }, { status: 400 });
  }

  if (!/^1\d{10}$/.test(receiverPhone)) {
    return NextResponse.json({ message: "请输入正确的 11 位手机号" }, { status: 400 });
  }

  const redeemResult = await prisma.$transaction(async (tx) => {
    const product = await tx.shopProduct.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        needPoints: true,
        stock: true,
      },
    });

    if (!product) {
      return { ok: false as const, status: 404, message: "商品不存在或已下架" };
    }

    if (product.stock !== null && product.stock <= 0) {
      return { ok: false as const, status: 409, message: "商品库存不足" };
    }

    const updatedUser = await tx.user.updateMany({
      where: {
        id: userId,
        points: {
          gte: product.needPoints,
        },
      },
      data: {
        points: {
          decrement: product.needPoints,
        },
      },
    });

    if (updatedUser.count === 0) {
      return { ok: false as const, status: 409, message: "积分不足" };
    }

    if (product.stock !== null) {
      const updatedProduct = await tx.shopProduct.updateMany({
        where: {
          id: product.id,
          stock: {
            gt: 0,
          },
        },
        data: {
          stock: {
            decrement: 1,
          },
        },
      });

      if (updatedProduct.count === 0) {
        throw new Error("商品库存不足");
      }
    }

    await tx.shopRedeemOrder.create({
      data: {
        userId,
        productId: product.id,
        productSnapshotName: product.name,
        pointsSpent: product.needPoints,
        receiverName,
        receiverPhone,
        receiverAddress,
        remark: remark || null,
        status: "SUCCESS",
      },
    });

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        points: true,
      },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    const refreshedProduct = await tx.shopProduct.findUnique({
      where: { id: product.id },
      select: {
        stock: true,
      },
    });

    return {
      ok: true as const,
      status: 200,
      message: "兑换成功",
      myPoints: user.points,
      productId: product.id,
      stock: refreshedProduct?.stock ?? null,
    };
  });

  if (!redeemResult.ok) {
    return NextResponse.json({ message: redeemResult.message }, { status: redeemResult.status });
  }

  return NextResponse.json(redeemResult);
}
