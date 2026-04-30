import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getActiveRoundWithReviewStatus, ensureRounds } from "@/lib/review-round/service";

interface RouteContext {
  params: Promise<{ courseId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { courseId } = await context.params;
  const offeringId = request.nextUrl.searchParams.get("offeringId")?.trim();
  if (!offeringId) {
    return NextResponse.json({ message: "缺少 offeringId 参数" }, { status: 400 });
  }

  const userId = getSessionUserId(request.headers);

  let result = await getActiveRoundWithReviewStatus(offeringId, userId);

  // If no rounds exist yet, try to auto-generate
  if (!result.round) {
    const existingCount = await prisma.reviewRound.count({ where: { offeringId } });
    if (existingCount === 0) {
      const offering = await prisma.courseOffering.findUnique({
        where: { id: offeringId },
        select: {
          id: true,
          courseId: true,
          startAt: true,
          endAt: true,
        },
      });

      if (offering?.startAt && offering?.endAt) {
        const profile = await prisma.courseProfile.findUnique({
          where: { courseId: offering.courseId },
          select: { schedule: true },
        });

        if (profile?.schedule) {
          await ensureRounds({
            offeringId: offering.id,
            courseId: offering.courseId,
            schedule: profile.schedule,
            semesterStart: offering.startAt,
            semesterEnd: offering.endAt,
          });

          result = await getActiveRoundWithReviewStatus(offeringId, userId);
        }
      }
    }
  }

  return NextResponse.json({
    activeRound: result.round
      ? {
          id: result.round.id,
          label: result.round.label,
          startsAt: result.round.startsAt.toISOString(),
          endsAt: result.round.endsAt.toISOString(),
        }
      : null,
    hasReviewed: result.hasReviewed,
  });
}
