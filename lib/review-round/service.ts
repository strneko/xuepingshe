import { prisma } from "@/lib/prisma";
import type { ReviewRound } from "@prisma/client";

/**
 * Get the currently active review round for an offering.
 * Active means startsAt <= now < endsAt.
 */
export async function getActiveRound(offeringId: string): Promise<ReviewRound | null> {
  const now = new Date();
  return prisma.reviewRound.findFirst({
    where: {
      offeringId,
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    orderBy: { startsAt: "asc" },
  });
}

/**
 * Check if a user has already submitted a review for a given round.
 */
export async function hasUserReviewed(roundId: string, userId: string): Promise<boolean> {
  const existing = await prisma.courseReview.findFirst({
    where: { roundId, userId },
    select: { id: true },
  });
  return existing !== null;
}

/**
 * Get the active round for an offering, along with whether the given user has reviewed it.
 */
export async function getActiveRoundWithReviewStatus(
  offeringId: string,
  userId?: string | null,
): Promise<{ round: ReviewRound | null; hasReviewed: boolean }> {
  const round = await getActiveRound(offeringId);
  if (!round) return { round: null, hasReviewed: false };
  if (!userId) return { round, hasReviewed: false };

  const hasReviewed = await hasUserReviewed(round.id, userId);
  return { round, hasReviewed };
}

/**
 * Fetch or create rounds for an offering.
 * Returns existing rounds if any, otherwise generates new ones from schedule.
 */
export async function ensureRounds(params: {
  offeringId: string;
  courseId: string;
  schedule: string;
  semesterStart: Date;
  semesterEnd: Date;
}): Promise<ReviewRound[]> {
  // Return existing rounds if already created
  const existing = await prisma.reviewRound.findMany({
    where: { offeringId: params.offeringId },
    orderBy: { startsAt: "asc" },
  });
  if (existing.length > 0) return existing;

  // Generate rounds from schedule
  const { parseSchedule, generateRounds } = await import("./generator");
  const slots = parseSchedule(params.schedule);
  if (slots.length === 0) return [];

  const roundInputs = generateRounds(slots, params.semesterStart, params.semesterEnd);
  if (roundInputs.length === 0) return [];

  await prisma.reviewRound.createMany({
    data: roundInputs.map((r) => ({
      offeringId: params.offeringId,
      courseId: params.courseId,
      label: r.label,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
    })),
    skipDuplicates: true,
  });

  return prisma.reviewRound.findMany({
    where: { offeringId: params.offeringId },
    orderBy: { startsAt: "asc" },
  });
}
