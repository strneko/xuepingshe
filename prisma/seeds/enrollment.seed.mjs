export async function seedCourseInviteCodes(prisma) {
  const rows = [
    { code: "MATH-2026-001", courseId: "1" },
    { code: "LINEAR-2026-001", courseId: "2" },
    { code: "STAT-2026-001", courseId: "3" },
  ];

  for (const row of rows) {
    try {
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "CourseInviteCode" ("id", "code", "courseId", "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, $1, $2, true, NOW(), NOW())
        ON CONFLICT ("code")
        DO UPDATE SET
          "courseId" = EXCLUDED."courseId",
          "isActive" = true,
          "updatedAt" = NOW();
        `,
        row.code,
        row.courseId,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('relation "CourseInviteCode" does not exist')) {
        console.warn("skip seedCourseInviteCodes: CourseInviteCode table not found. Run migration first.");
        return;
      }

      throw error;
    }
  }
}
