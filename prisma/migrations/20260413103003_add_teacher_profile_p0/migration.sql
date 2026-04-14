-- CreateTable
CREATE TABLE "TeacherProfile" (
    "teacherId" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "department" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "researchAreas" TEXT[],
    "office" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recentOverallScore" DOUBLE PRECISION NOT NULL,
    "recentSevenScoresJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("teacherId")
);
