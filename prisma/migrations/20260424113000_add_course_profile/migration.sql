-- CreateTable
CREATE TABLE "CourseProfile" (
    "courseId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseProfile_pkey" PRIMARY KEY ("courseId")
);

-- CreateIndex
CREATE INDEX "CourseProfile_teacherName_idx" ON "CourseProfile"("teacherName");

-- CreateIndex
CREATE INDEX "CourseProfile_updatedAt_idx" ON "CourseProfile"("updatedAt");