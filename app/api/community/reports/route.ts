import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUserId } from "@/lib/community/shared";

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: "请求体无效" }, { status: 400 });
    }

    const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const reportType = body.reportType as string | undefined;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const targetPostId = typeof body.targetPostId === "string" ? body.targetPostId : undefined;
    const targetCommentId = typeof body.targetCommentId === "string" ? body.targetCommentId : undefined;

    if (reportType !== "POST" && reportType !== "COMMENT") {
      return NextResponse.json({ message: "举报类型无效" }, { status: 400 });
    }
    if (!reason || reason.length < 5) {
      return NextResponse.json({ message: "举报原因至少 5 个字" }, { status: 400 });
    }
    if (reason.length > 500) {
      return NextResponse.json({ message: "举报原因不能超过 500 字" }, { status: 400 });
    }
    if (reportType === "POST" && !targetPostId) {
      return NextResponse.json({ message: "请指定被举报的帖子" }, { status: 400 });
    }
    if (reportType === "COMMENT" && !targetCommentId) {
      return NextResponse.json({ message: "请指定被举报的评论" }, { status: 400 });
    }

    // Prevent duplicate pending reports from the same user on the same target
    const existing = await prisma.communityReport.findFirst({
      where: {
        reporterId: userId,
        status: "PENDING",
        ...(targetPostId ? { targetPostId } : {}),
        ...(targetCommentId ? { targetCommentId } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ message: "您已举报过该内容，等待处理中" }, { status: 409 });
    }

    await prisma.communityReport.create({
      data: {
        reportType,
        reason,
        reporterId: userId,
        ...(targetPostId ? { targetPostId } : {}),
        ...(targetCommentId ? { targetCommentId } : {}),
      },
    });

    return NextResponse.json({ message: "举报已提交" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "提交举报失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request);

    const reports = await prisma.communityReport.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        reportType: true,
        status: true,
        reason: true,
        targetPostId: true,
        targetCommentId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      items: reports.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取举报记录失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}
