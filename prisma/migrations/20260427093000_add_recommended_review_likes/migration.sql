-- CreateTable
CREATE TABLE "RecommendedReviewLike" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendedReviewLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecommendedReviewLike_reviewId_userId_key" ON "RecommendedReviewLike"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "RecommendedReviewLike_userId_createdAt_idx" ON "RecommendedReviewLike"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "RecommendedReviewLike" ADD CONSTRAINT "RecommendedReviewLike_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "RecommendedReview"("reviewId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedReviewLike" ADD CONSTRAINT "RecommendedReviewLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
