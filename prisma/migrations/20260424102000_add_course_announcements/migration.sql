-- CreateEnum
CREATE TYPE "CourseAnnouncementStatus" AS ENUM ('PUBLISHED', 'OFFLINE');

-- CreateTable
CREATE TABLE "CourseAnnouncement" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "authorId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "CourseAnnouncementStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseAnnouncement_courseId_status_publishAt_idx" ON "CourseAnnouncement"("courseId", "status", "publishAt");

-- CreateIndex
CREATE INDEX "CourseAnnouncement_authorId_createdAt_idx" ON "CourseAnnouncement"("authorId", "createdAt");

-- AddForeignKey
ALTER TABLE "CourseAnnouncement" ADD CONSTRAINT "CourseAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;