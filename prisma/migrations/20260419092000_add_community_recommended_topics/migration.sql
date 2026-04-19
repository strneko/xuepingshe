-- CreateTable
CREATE TABLE "CommunityRecommendedTopic" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "rankScore" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityRecommendedTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityRecommendedTopic_topicId_key" ON "CommunityRecommendedTopic"("topicId");

-- CreateIndex
CREATE INDEX "CommunityRecommendedTopic_isActive_rankScore_idx" ON "CommunityRecommendedTopic"("isActive", "rankScore");

-- AddForeignKey
ALTER TABLE "CommunityRecommendedTopic" ADD CONSTRAINT "CommunityRecommendedTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "CommunityTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
