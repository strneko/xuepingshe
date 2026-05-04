import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const AUTO_BATCH_KEY = "auto-generated";
const DEFAULT_RECOMMENDATION_LIMIT = 6;

type CandidateReview = {
  reviewId: string;
  nickname: string;
  sourceCourseId: string | null;
  sourceCourseName: string | null;
  sourceTeacherId: string | null;
  sourceTeacherName: string | null;
  createdAt: Date;
  overallScore: number | null;
  likesCount: number;
  summary: string;
  detailedScoresJson: unknown;
  rankScore: number;
};

function scoreReview(createdAt: Date, likesCount: number, overallScore: number | null) {
  const ageInDays = Math.max(0, (Date.now() - createdAt.getTime()) / 86_400_000);
  return likesCount * 10 + (overallScore ?? 0) * 4 - ageInDays * 0.05;
}

export async function rebuildRecommendedReviews(limit = DEFAULT_RECOMMENDATION_LIMIT) {
  const MAX_CANDIDATES = 500;

  const [courseReviews, teacherReviews, courseProfiles, teacherProfiles] = await Promise.all([
    prisma.courseReview.findMany({
      where: {
        status: "VISIBLE",
      },
      orderBy: [{ likesCount: "desc" }, { createdAt: "desc" }],
      take: MAX_CANDIDATES,
      select: {
        id: true,
        courseId: true,
        nickname: true,
        createdAt: true,
        overallScore: true,
        likesCount: true,
        summary: true,
        detailedScoresJson: true,
      },
    }),
    prisma.teacherReview.findMany({
      where: {
        status: "VISIBLE",
      },
      orderBy: [{ likesCount: "desc" }, { createdAt: "desc" }],
      take: MAX_CANDIDATES,
      select: {
        id: true,
        teacherId: true,
        nickname: true,
        sourceCourseId: true,
        sourceCourseName: true,
        createdAt: true,
        overallScore: true,
        likesCount: true,
        summary: true,
        detailedScoresJson: true,
      },
    }),
    prisma.courseProfile.findMany({
      select: {
        courseId: true,
        courseName: true,
        teacherName: true,
      },
    }),
    prisma.teacherProfile.findMany({
      select: {
        teacherId: true,
        teacherName: true,
      },
    }),
  ]);

  const courseProfileMap = new Map(courseProfiles.map((profile) => [profile.courseId, profile]));
  const teacherProfileMap = new Map(teacherProfiles.map((profile) => [profile.teacherId, profile]));

  const candidates: CandidateReview[] = [
    ...courseReviews.map((review) => {
      const courseProfile = courseProfileMap.get(review.courseId);

      return {
        reviewId: `course-review:${review.id}`,
        nickname: review.nickname,
        sourceCourseId: review.courseId,
        sourceCourseName: courseProfile?.courseName ?? `课程 ${review.courseId}`,
        sourceTeacherId: null,
        sourceTeacherName: courseProfile?.teacherName ?? null,
        createdAt: review.createdAt,
        overallScore: review.overallScore,
        likesCount: review.likesCount,
        summary: review.summary,
        detailedScoresJson: review.detailedScoresJson,
        rankScore: scoreReview(review.createdAt, review.likesCount, review.overallScore),
      };
    }),
    ...teacherReviews.map((review) => {
      const teacherProfile = teacherProfileMap.get(review.teacherId);

      return {
        reviewId: `teacher-review:${review.id}`,
        nickname: review.nickname,
        sourceCourseId: review.sourceCourseId,
        sourceCourseName: review.sourceCourseName,
        sourceTeacherId: review.teacherId,
        sourceTeacherName: teacherProfile?.teacherName ?? `教师 ${review.teacherId}`,
        createdAt: review.createdAt,
        overallScore: review.overallScore,
        likesCount: review.likesCount,
        summary: review.summary,
        detailedScoresJson: review.detailedScoresJson,
        rankScore: scoreReview(review.createdAt, review.likesCount, review.overallScore),
      };
    }),
  ];

  const selectedCandidates = candidates
    .sort((left, right) => {
      if (right.rankScore !== left.rankScore) {
        return right.rankScore - left.rankScore;
      }

      if (right.likesCount !== left.likesCount) {
        return right.likesCount - left.likesCount;
      }

      return right.createdAt.getTime() - left.createdAt.getTime();
    })
    .slice(0, limit);

  await prisma.$transaction(async (tx) => {
    await tx.recommendedReview.updateMany({
      where: {
        batchKey: AUTO_BATCH_KEY,
      },
      data: {
        isActive: false,
      },
    });

    for (const candidate of selectedCandidates) {
      await tx.recommendedReview.upsert({
        where: {
          reviewId: candidate.reviewId,
        },
        update: {
          nickname: candidate.nickname,
          sourceCourseId: candidate.sourceCourseId,
          sourceCourseName: candidate.sourceCourseName,
          sourceTeacherId: candidate.sourceTeacherId,
          sourceTeacherName: candidate.sourceTeacherName,
          createdAt: candidate.createdAt,
          overallScore: candidate.overallScore,
          likesCount: candidate.likesCount,
          summary: candidate.summary,
          detailedScoresJson: candidate.detailedScoresJson as Prisma.InputJsonValue,
          rankScore: candidate.rankScore,
          isActive: true,
          batchKey: AUTO_BATCH_KEY,
        },
        create: {
          reviewId: candidate.reviewId,
          nickname: candidate.nickname,
          sourceCourseId: candidate.sourceCourseId,
          sourceCourseName: candidate.sourceCourseName,
          sourceTeacherId: candidate.sourceTeacherId,
          sourceTeacherName: candidate.sourceTeacherName,
          createdAt: candidate.createdAt,
          overallScore: candidate.overallScore,
          likesCount: candidate.likesCount,
          summary: candidate.summary,
          detailedScoresJson: candidate.detailedScoresJson as Prisma.InputJsonValue,
          rankScore: candidate.rankScore,
          isActive: true,
          batchKey: AUTO_BATCH_KEY,
        },
      });
    }
  });

  return selectedCandidates;
}
