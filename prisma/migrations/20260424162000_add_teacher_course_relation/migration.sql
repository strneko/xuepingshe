-- CreateTable
CREATE TABLE "TeacherCourse" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherCourse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherCourse_teacherId_courseId_key" ON "TeacherCourse"("teacherId", "courseId");

-- CreateIndex
CREATE INDEX "TeacherCourse_teacherId_isActive_sortOrder_idx" ON "TeacherCourse"("teacherId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "TeacherCourse_courseId_isActive_idx" ON "TeacherCourse"("courseId", "isActive");

-- AddForeignKey
ALTER TABLE "TeacherCourse" ADD CONSTRAINT "TeacherCourse_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("teacherId") ON DELETE CASCADE ON UPDATE CASCADE;
