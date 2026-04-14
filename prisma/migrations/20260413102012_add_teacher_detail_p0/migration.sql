-- CreateEnum
CREATE TYPE "TeacherReviewStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'DELETED', 'PENDING');

-- CreateTable
CREATE TABLE "TeacherReview" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "sourceCourseId" TEXT,
    "sourceCourseName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "overallScore" DOUBLE PRECISION,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL,
    "detailedScoresJson" JSONB,
    "status" "TeacherReviewStatus" NOT NULL DEFAULT 'VISIBLE',

    CONSTRAINT "TeacherReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherReviewLike" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherReviewLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherScoreHistory" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "granularity" "CourseScoreGranularity" NOT NULL,
    "cursorKey" TEXT NOT NULL,
    "timeLabel" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "overallScore" DOUBLE PRECISION,
    "attitude" DOUBLE PRECISION,
    "content" DOUBLE PRECISION,
    "method" DOUBLE PRECISION,
    "effect" DOUBLE PRECISION,
    "interaction" DOUBLE PRECISION,
    "resource" DOUBLE PRECISION,
    "improve" DOUBLE PRECISION,

    CONSTRAINT "TeacherScoreHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherReview_teacherId_createdAt_idx" ON "TeacherReview"("teacherId", "createdAt");

-- CreateIndex
CREATE INDEX "TeacherReview_teacherId_likesCount_idx" ON "TeacherReview"("teacherId", "likesCount");

-- CreateIndex
CREATE INDEX "TeacherReview_userId_createdAt_idx" ON "TeacherReview"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TeacherReviewLike_userId_createdAt_idx" ON "TeacherReviewLike"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherReviewLike_reviewId_userId_key" ON "TeacherReviewLike"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "TeacherScoreHistory_teacherId_granularity_sortOrder_idx" ON "TeacherScoreHistory"("teacherId", "granularity", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherScoreHistory_teacherId_granularity_cursorKey_key" ON "TeacherScoreHistory"("teacherId", "granularity", "cursorKey");

-- AddForeignKey
ALTER TABLE "TeacherReview" ADD CONSTRAINT "TeacherReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherReviewLike" ADD CONSTRAINT "TeacherReviewLike_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "TeacherReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherReviewLike" ADD CONSTRAINT "TeacherReviewLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
