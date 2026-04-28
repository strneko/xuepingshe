export async function seedCourseInviteCodes(prisma) {
  await prisma.user.upsert({
    where: { email: "demo-user@xuepingshe.local" },
    update: {
      name: "Demo User",
      role: "STUDENT",
    },
    create: {
      id: "demo-user",
      email: "demo-user@xuepingshe.local",
      name: "Demo User",
      role: "STUDENT",
    },
  });

  const rows = [
    {
      code: "MATH-2026-S1-001",
      courseId: "1",
      courseName: "高等数学",
      teacherName: "张教授",
      semesterKey: "2026-S1",
      enrolled: true,
      classTime: "周一 08:00",
      location: "A-101",
    },
    {
      code: "LINEAR-2026-S1-001",
      courseId: "2",
      courseName: "线性代数",
      teacherName: "李教授",
      semesterKey: "2026-S1",
      enrolled: true,
      classTime: "周二 10:00",
      location: "B-202",
    },
    {
      code: "STAT-2026-S1-001",
      courseId: "3",
      courseName: "概率论与数理统计",
      teacherName: "王教授",
      semesterKey: "2026-S1",
      enrolled: true,
      classTime: "周三 14:00",
      location: "C-303",
    },
  ];

  for (const row of rows) {
    const offering = await prisma.courseOffering.upsert({
      where: {
        courseId_semesterKey: {
          courseId: row.courseId,
          semesterKey: row.semesterKey,
        },
      },
      update: {
        courseName: row.courseName,
        teacherName: row.teacherName,
        status: "OPEN",
        startAt: new Date("2026-03-01T00:00:00.000Z"),
        endAt: new Date("2026-06-30T00:00:00.000Z"),
      },
      create: {
        courseId: row.courseId,
        courseName: row.courseName,
        teacherName: row.teacherName,
        semesterKey: row.semesterKey,
        status: "OPEN",
        startAt: new Date("2026-03-01T00:00:00.000Z"),
        endAt: new Date("2026-06-30T00:00:00.000Z"),
      },
    });

    await prisma.courseInviteCode.upsert({
      where: {
        offeringId: offering.id,
      },
      update: {
        code: row.code,
        courseId: row.courseId,
        semesterKey: row.semesterKey,
        isActive: true,
      },
      create: {
        code: row.code,
        courseId: row.courseId,
        offeringId: offering.id,
        semesterKey: row.semesterKey,
        isActive: true,
      },
    });

    if (row.enrolled) {
      await prisma.enrollment.upsert({
        where: {
          userId_offeringId: {
            userId: "demo-user",
            offeringId: offering.id,
          },
        },
        update: {
          courseId: row.courseId,
          courseName: row.courseName,
          teacherName: row.teacherName,
          term: row.semesterKey,
          classTime: row.classTime,
          location: row.location,
          status: "ACTIVE",
        },
        create: {
          userId: "demo-user",
          offeringId: offering.id,
          courseId: row.courseId,
          courseName: row.courseName,
          teacherName: row.teacherName,
          term: row.semesterKey,
          classTime: row.classTime,
          location: row.location,
          status: "ACTIVE",
        },
      });
    }
  }
}
