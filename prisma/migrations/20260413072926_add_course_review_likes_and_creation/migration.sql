-- CreateEnum
CREATE TYPE "CourseScoreGranularity" AS ENUM ('SEMESTER', 'YEAR', 'MONTH', 'DAY');

-- CreateEnum
CREATE TYPE "CourseReviewStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'DELETED', 'PENDING');

-- CreateEnum
CREATE TYPE "SearchDocumentType" AS ENUM ('COURSE', 'TEACHER');

-- CreateTable
CREATE TABLE "CourseReview" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "overallScore" DOUBLE PRECISION,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL,
    "detailedScoresJson" JSONB,
    "status" "CourseReviewStatus" NOT NULL DEFAULT 'VISIBLE',

    CONSTRAINT "CourseReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseReviewLike" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseReviewLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseScoreHistory" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
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

    CONSTRAINT "CourseScoreHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchDocument" (
    "id" TEXT NOT NULL,
    "docType" "SearchDocumentType" NOT NULL,
    "docId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "scoreSnapshot" DOUBLE PRECISION NOT NULL,
    "reviewCountSnapshot" INTEGER NOT NULL,
    "snippet" TEXT NOT NULL,
    "searchableText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchKeyword" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "lastSearchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendedReview" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "sourceCourseId" TEXT,
    "sourceCourseName" TEXT,
    "sourceTeacherId" TEXT,
    "sourceTeacherName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "overallScore" DOUBLE PRECISION,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL,
    "detailedScoresJson" JSONB,
    "rankScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "batchKey" TEXT,

    CONSTRAINT "RecommendedReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseReview_courseId_createdAt_idx" ON "CourseReview"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "CourseReview_courseId_likesCount_idx" ON "CourseReview"("courseId", "likesCount");

-- CreateIndex
CREATE INDEX "CourseReview_userId_createdAt_idx" ON "CourseReview"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CourseReviewLike_userId_createdAt_idx" ON "CourseReviewLike"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourseReviewLike_reviewId_userId_key" ON "CourseReviewLike"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "CourseScoreHistory_courseId_granularity_sortOrder_idx" ON "CourseScoreHistory"("courseId", "granularity", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CourseScoreHistory_courseId_granularity_cursorKey_key" ON "CourseScoreHistory"("courseId", "granularity", "cursorKey");

-- CreateIndex
CREATE INDEX "SearchDocument_docType_idx" ON "SearchDocument"("docType");

-- CreateIndex
CREATE INDEX "SearchDocument_title_idx" ON "SearchDocument"("title");

-- CreateIndex
CREATE INDEX "SearchDocument_department_idx" ON "SearchDocument"("department");

-- CreateIndex
CREATE UNIQUE INDEX "SearchDocument_docType_docId_key" ON "SearchDocument"("docType", "docId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchKeyword_keyword_key" ON "SearchKeyword"("keyword");

-- CreateIndex
CREATE INDEX "SearchKeyword_searchCount_idx" ON "SearchKeyword"("searchCount");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendedReview_reviewId_key" ON "RecommendedReview"("reviewId");

-- CreateIndex
CREATE INDEX "RecommendedReview_isActive_rankScore_idx" ON "RecommendedReview"("isActive", "rankScore");

-- CreateIndex
CREATE INDEX "RecommendedReview_batchKey_idx" ON "RecommendedReview"("batchKey");

-- CreateIndex
CREATE INDEX "RecommendedReview_createdAt_idx" ON "RecommendedReview"("createdAt");

-- AddForeignKey
ALTER TABLE "CourseReview" ADD CONSTRAINT "CourseReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseReviewLike" ADD CONSTRAINT "CourseReviewLike_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "CourseReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseReviewLike" ADD CONSTRAINT "CourseReviewLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
