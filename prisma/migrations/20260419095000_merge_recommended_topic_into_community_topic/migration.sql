-- AlterTable
ALTER TABLE "CommunityTopic" ADD COLUMN "isRecommended" BOOLEAN NOT NULL DEFAULT false;

-- Data migration: carry over recommendation status from dedicated table
UPDATE "CommunityTopic"
SET "isRecommended" = true
WHERE "id" IN (
  SELECT "topicId"
  FROM "CommunityRecommendedTopic"
  WHERE "isActive" = true
);

-- DropForeignKey
ALTER TABLE "CommunityRecommendedTopic" DROP CONSTRAINT "CommunityRecommendedTopic_topicId_fkey";

-- DropTable
DROP TABLE "CommunityRecommendedTopic";
