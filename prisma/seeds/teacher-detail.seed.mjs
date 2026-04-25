export async function seedTeacherDetail(prisma) {
  await seedTeacherProfile(prisma);
  await seedTeacherCourses(prisma);
  await seedDemoUser(prisma);
  await seedTeacherReviews(prisma);
  await seedTeacherScoreHistory(prisma);
}

async function seedTeacherCourses(prisma) {
  const rows = [
    {
      teacherId: "1",
      courseId: "1",
      courseName: "高等数学",
      sortOrder: 1,
      isActive: true,
    },
    {
      teacherId: "1",
      courseId: "2",
      courseName: "线性代数",
      sortOrder: 2,
      isActive: true,
    },
    {
      teacherId: "1",
      courseId: "3",
      courseName: "概率论与数理统计",
      sortOrder: 3,
      isActive: true,
    },
  ];

  for (const row of rows) {
    await prisma.teacherCourse.upsert({
      where: {
        teacherId_courseId: {
          teacherId: row.teacherId,
          courseId: row.courseId,
        },
      },
      update: {
        courseName: row.courseName,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      },
      create: row,
    });
  }
}

async function seedTeacherProfile(prisma) {
  await prisma.teacherProfile.upsert({
    where: { teacherId: "1" },
    update: {
      teacherName: "张教授",
      avatarUrl: "",
      department: "数学与统计学院",
      title: "教授 / 博导",
      researchAreas: ["偏微分方程", "最优化理论", "数学建模"],
      office: "理科楼 B-512",
      description:
        "长期从事高等数学与数学建模教学，注重基础概念与应用能力结合。主持多项教学改革项目，致力于提升课堂互动与学习反馈质量。",
      recentOverallScore: 4.82,
      recentSevenScoresJson: [
        { key: "attitude", label: "教学态度与师德", score: 4.9 },
        { key: "content", label: "教学内容与设计", score: 4.8 },
        { key: "method", label: "教学方法与技巧", score: 4.8 },
        { key: "effect", label: "教学效果与成果", score: 4.7 },
        { key: "interaction", label: "师生互动与氛围", score: 4.9 },
        { key: "resource", label: "课程资源与评价", score: 4.7 },
        { key: "improve", label: "教学创新与改进", score: 4.9 },
      ],
    },
    create: {
      teacherId: "1",
      teacherName: "张教授",
      avatarUrl: "",
      department: "数学与统计学院",
      title: "教授 / 博导",
      researchAreas: ["偏微分方程", "最优化理论", "数学建模"],
      office: "理科楼 B-512",
      description:
        "长期从事高等数学与数学建模教学，注重基础概念与应用能力结合。主持多项教学改革项目，致力于提升课堂互动与学习反馈质量。",
      recentOverallScore: 4.82,
      recentSevenScoresJson: [
        { key: "attitude", label: "教学态度与师德", score: 4.9 },
        { key: "content", label: "教学内容与设计", score: 4.8 },
        { key: "method", label: "教学方法与技巧", score: 4.8 },
        { key: "effect", label: "教学效果与成果", score: 4.7 },
        { key: "interaction", label: "师生互动与氛围", score: 4.9 },
        { key: "resource", label: "课程资源与评价", score: 4.7 },
        { key: "improve", label: "教学创新与改进", score: 4.9 },
      ],
    },
  });
}

async function seedDemoUser(prisma) {
  await prisma.user.upsert({
    where: { id: "demo-user" },
    update: {
      email: "demo-user@xuepingshe.local",
      name: "Demo User",
    },
    create: {
      id: "demo-user",
      email: "demo-user@xuepingshe.local",
      name: "Demo User",
    },
  });
}

function formatMonthLabel(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function formatDayLabel(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function createTimeLabel(granularity, index) {
  if (granularity === "SEMESTER") {
    const startYear = 2025 - Math.floor(index / 2);
    const endYear = startYear + 1;
    const semester = (index % 2) + 1;
    return `${startYear}-${endYear}-${semester}`;
  }

  if (granularity === "YEAR") {
    return String(2026 - index);
  }

  if (granularity === "MONTH") {
    const date = new Date(2026, 2, 1);
    date.setMonth(date.getMonth() - index);
    return formatMonthLabel(date);
  }

  const date = new Date(2026, 2, 6);
  date.setDate(date.getDate() - index);
  return formatDayLabel(date);
}

function toNullableScore(value, seed, mod) {
  if ((seed + mod) % 17 === 0) {
    return null;
  }

  return Number(value.toFixed(1));
}

function createHistoryRecord(teacherId, granularity, index) {
  const cursorKey = `${granularity.toLowerCase()}-${teacherId}-${index + 1}`;
  const seed = teacherId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + index * 19;

  const base = 3.9 + (seed % 10) / 10;
  const attitude = toNullableScore(Math.min(5, base - 0.1 + ((seed + 1) % 4) / 10), seed, 1);
  const content = toNullableScore(Math.min(5, base - 0.2 + ((seed + 2) % 5) / 10), seed, 2);
  const method = toNullableScore(Math.min(5, base - 0.3 + ((seed + 3) % 6) / 10), seed, 3);
  const effect = toNullableScore(Math.min(5, base - 0.3 + ((seed + 4) % 5) / 10), seed, 4);
  const interaction = toNullableScore(Math.min(5, base - 0.1 + ((seed + 5) % 4) / 10), seed, 5);
  const resource = toNullableScore(Math.min(5, base - 0.2 + ((seed + 6) % 5) / 10), seed, 6);
  const improve = toNullableScore(Math.min(5, base - 0.2 + ((seed + 7) % 5) / 10), seed, 7);

  const scoreValues = [attitude, content, method, effect, interaction, resource, improve].filter(
    (item) => item !== null,
  );
  const overallScore =
    scoreValues.length > 0
      ? Number((scoreValues.reduce((sum, item) => sum + item, 0) / scoreValues.length).toFixed(1))
      : null;

  return {
    teacherId,
    granularity,
    cursorKey,
    timeLabel: createTimeLabel(granularity, index),
    sortOrder: index,
    overallScore,
    attitude,
    content,
    method,
    effect,
    interaction,
    resource,
    improve,
  };
}

function getHistorySourceCount(granularity) {
  if (granularity === "SEMESTER") {
    return 24;
  }

  if (granularity === "YEAR") {
    return 12;
  }

  if (granularity === "MONTH") {
    return 24;
  }

  return 60;
}

async function seedTeacherReviews(prisma) {
  const rows = [
    {
      id: "teacher-1-rv-1",
      teacherId: "1",
      userId: "demo-user",
      nickname: "匿名同学E",
      avatarUrl: "",
      sourceCourseId: "1",
      sourceCourseName: "高等数学",
      createdAt: new Date("2026-03-03T10:00:00.000Z"),
      overallScore: 4.9,
      likesCount: 131,
      summary: "讲课逻辑清晰，板书结构很强，例题讲解层次分明。",
      detailedScoresJson: [
        { key: "attitude", label: "教学态度与师德", score: 4.9 },
        { key: "content", label: "教学内容与设计", score: 4.8 },
        { key: "method", label: "教学方法与技巧", score: 5.0 },
        { key: "effect", label: "教学效果与成果", score: 4.7 },
        { key: "interaction", label: "师生互动与氛围", score: 4.9 },
        { key: "resource", label: "课程资源与评价", score: 4.8 },
        { key: "improve", label: "教学创新与改进", score: 4.8 },
      ],
    },
    {
      id: "teacher-1-rv-2",
      teacherId: "1",
      userId: "demo-user",
      nickname: "匿名同学F",
      avatarUrl: "",
      sourceCourseId: "2",
      sourceCourseName: "线性代数",
      createdAt: new Date("2026-02-25T10:00:00.000Z"),
      overallScore: 4.6,
      likesCount: 88,
      summary: "课堂互动多，课后答疑及时，作业反馈详细。",
      detailedScoresJson: [
        { key: "attitude", label: "教学态度与师德", score: 4.7 },
        { key: "content", label: "教学内容与设计", score: 4.6 },
        { key: "method", label: "教学方法与技巧", score: 4.5 },
        { key: "effect", label: "教学效果与成果", score: 4.4 },
        { key: "interaction", label: "师生互动与氛围", score: 4.8 },
        { key: "resource", label: "课程资源与评价", score: 4.6 },
        { key: "improve", label: "教学创新与改进", score: 4.5 },
      ],
    },
    {
      id: "teacher-1-rv-3",
      teacherId: "1",
      userId: "demo-user",
      nickname: "匿名同学G",
      avatarUrl: "",
      sourceCourseId: "3",
      sourceCourseName: "概率论与数理统计",
      createdAt: new Date("2026-02-19T10:00:00.000Z"),
      overallScore: 4.7,
      likesCount: 74,
      summary: "知识点串联很好，复习资料组织清楚，建议多给进阶题。",
      detailedScoresJson: null,
    },
    {
      id: "teacher-1-rv-4",
      teacherId: "1",
      userId: "demo-user",
      nickname: "匿名同学H",
      avatarUrl: "",
      sourceCourseId: "1",
      sourceCourseName: "高等数学",
      createdAt: new Date("2026-02-10T10:00:00.000Z"),
      overallScore: 4.3,
      likesCount: 39,
      summary: "整体不错，希望增加难度分层练习。",
      detailedScoresJson: null,
    },
    {
      id: "teacher-1-rv-5",
      teacherId: "1",
      userId: "demo-user",
      nickname: "匿名同学I",
      avatarUrl: "",
      sourceCourseId: "2",
      sourceCourseName: "线性代数",
      createdAt: new Date("2026-02-06T10:00:00.000Z"),
      overallScore: 4.8,
      likesCount: 54,
      summary: "课堂节奏把握很好，重点内容重复强化得比较到位。",
      detailedScoresJson: null,
    },
    {
      id: "teacher-1-rv-6",
      teacherId: "1",
      userId: "demo-user",
      nickname: "匿名同学J",
      avatarUrl: "",
      sourceCourseId: "3",
      sourceCourseName: "概率论与数理统计",
      createdAt: new Date("2026-01-28T10:00:00.000Z"),
      overallScore: 4.5,
      likesCount: 61,
      summary: "课程资料更新及时，建议增加更多课堂练习。",
      detailedScoresJson: null,
    },
  ];

  for (const row of rows) {
    await prisma.teacherReview.upsert({
      where: { id: row.id },
      update: {
        teacherId: row.teacherId,
        userId: row.userId,
        nickname: row.nickname,
        avatarUrl: row.avatarUrl,
        sourceCourseId: row.sourceCourseId,
        sourceCourseName: row.sourceCourseName,
        createdAt: row.createdAt,
        overallScore: row.overallScore,
        likesCount: row.likesCount,
        summary: row.summary,
        detailedScoresJson: row.detailedScoresJson,
      },
      create: row,
    });
  }

  await prisma.teacherReviewLike.upsert({
    where: {
      reviewId_userId: {
        reviewId: "teacher-1-rv-1",
        userId: "demo-user",
      },
    },
    update: {},
    create: {
      reviewId: "teacher-1-rv-1",
      userId: "demo-user",
    },
  });
}

async function seedTeacherScoreHistory(prisma) {
  const granularityConfig = [
    { granularity: "SEMESTER", count: 24 },
    { granularity: "YEAR", count: 12 },
    { granularity: "MONTH", count: 24 },
    { granularity: "DAY", count: 60 },
  ];

  for (const config of granularityConfig) {
    for (let index = 0; index < config.count; index += 1) {
      const row = createHistoryRecord("1", config.granularity, index);

      await prisma.teacherScoreHistory.upsert({
        where: {
          teacherId_granularity_cursorKey: {
            teacherId: row.teacherId,
            granularity: row.granularity,
            cursorKey: row.cursorKey,
          },
        },
        update: {
          timeLabel: row.timeLabel,
          sortOrder: row.sortOrder,
          overallScore: row.overallScore,
          attitude: row.attitude,
          content: row.content,
          method: row.method,
          effect: row.effect,
          interaction: row.interaction,
          resource: row.resource,
          improve: row.improve,
        },
        create: row,
      });
    }
  }
}
