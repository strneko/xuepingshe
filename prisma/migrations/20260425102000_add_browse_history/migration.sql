-- CreateEnum
CREATE TYPE "BrowseHistoryKind" AS ENUM ('COURSE', 'TEACHER', 'COMMUNITY_POST');

-- CreateTable
CREATE TABLE "BrowseHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "BrowseHistoryKind" NOT NULL,
    "targetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrowseHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrowseHistory_userId_kind_targetId_key" ON "BrowseHistory"("userId", "kind", "targetId");

-- CreateIndex
CREATE INDEX "BrowseHistory_userId_visitedAt_idx" ON "BrowseHistory"("userId", "visitedAt");

-- CreateIndex
CREATE INDEX "BrowseHistory_kind_visitedAt_idx" ON "BrowseHistory"("kind", "visitedAt");

-- AddForeignKey
ALTER TABLE "BrowseHistory" ADD CONSTRAINT "BrowseHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
