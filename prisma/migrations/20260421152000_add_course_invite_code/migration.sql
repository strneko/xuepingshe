-- CreateTable
CREATE TABLE "CourseInviteCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseInviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseInviteCode_code_key" ON "CourseInviteCode"("code");

-- CreateIndex
CREATE INDEX "CourseInviteCode_courseId_isActive_idx" ON "CourseInviteCode"("courseId", "isActive");
