-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "CourseOfferingStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "CourseOffering" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "semesterKey" TEXT NOT NULL,
    "status" "CourseOfferingStatus" NOT NULL DEFAULT 'OPEN',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "forceClosedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("id")
);

-- AddColumn
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'STUDENT';

ALTER TABLE "CourseInviteCode" ADD COLUMN "offeringId" TEXT;
ALTER TABLE "CourseInviteCode" ADD COLUMN "semesterKey" TEXT;
ALTER TABLE "CourseInviteCode" ADD COLUMN "expiresAt" TIMESTAMP(3);

ALTER TABLE "Enrollment" ADD COLUMN "offeringId" TEXT;

-- Backfill one semester offering per course from the existing course profile rows.
INSERT INTO "CourseOffering" ("id", "courseId", "courseName", "teacherName", "semesterKey", "status", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
  source."courseId",
  COALESCE(cp."courseName", '课程 ' || source."courseId"),
  COALESCE(cp."teacherName", '教师 ' || source."courseId"),
    '2026-S1',
    'OPEN',
    NOW(),
    NOW()
FROM (
    SELECT DISTINCT "courseId" FROM "CourseInviteCode"
    UNION
    SELECT DISTINCT "courseId" FROM "Enrollment"
) AS source
LEFT JOIN "CourseProfile" cp ON cp."courseId" = source."courseId"
WHERE NOT EXISTS (
    SELECT 1
    FROM "CourseOffering" existing
  WHERE existing."courseId" = source."courseId"
      AND existing."semesterKey" = '2026-S1'
);

UPDATE "CourseInviteCode" invite
SET
    "offeringId" = offering."id",
    "semesterKey" = offering."semesterKey"
FROM "CourseOffering" offering
WHERE offering."courseId" = invite."courseId"
  AND offering."semesterKey" = '2026-S1';

UPDATE "Enrollment" enrollment
SET "offeringId" = offering."id"
FROM "CourseOffering" offering
WHERE offering."courseId" = enrollment."courseId"
  AND offering."semesterKey" = '2026-S1';

ALTER TABLE "CourseInviteCode" ALTER COLUMN "offeringId" SET NOT NULL;
ALTER TABLE "CourseInviteCode" ALTER COLUMN "semesterKey" SET NOT NULL;
ALTER TABLE "Enrollment" ALTER COLUMN "offeringId" SET NOT NULL;

CREATE UNIQUE INDEX "CourseOffering_courseId_semesterKey_key" ON "CourseOffering"("courseId", "semesterKey");
CREATE INDEX "CourseOffering_courseId_status_idx" ON "CourseOffering"("courseId", "status");
CREATE INDEX "CourseOffering_semesterKey_status_idx" ON "CourseOffering"("semesterKey", "status");

CREATE UNIQUE INDEX "CourseInviteCode_offeringId_key" ON "CourseInviteCode"("offeringId");
CREATE INDEX "CourseInviteCode_semesterKey_isActive_idx" ON "CourseInviteCode"("semesterKey", "isActive");

CREATE UNIQUE INDEX "Enrollment_userId_offeringId_key" ON "Enrollment"("userId", "offeringId");
CREATE INDEX "Enrollment_offeringId_status_idx" ON "Enrollment"("offeringId", "status");

DROP INDEX IF EXISTS "Enrollment_userId_courseId_key";

ALTER TABLE "CourseInviteCode" ADD CONSTRAINT "CourseInviteCode_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
