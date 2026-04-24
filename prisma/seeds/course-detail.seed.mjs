export async function seedCourseDetail(prisma) {
  await seedDemoUser(prisma);
  await seedCourseProfiles(prisma);
  await seedCourseAnnouncements(prisma);
  await seedCourseReviews(prisma);
  await seedCourseScoreHistory(prisma);
}

async function seedCourseProfiles(prisma) {
  const rows = [
    {
      courseId: "1",
      courseName: "高等数学",
      teacherName: "张教授",
      intro: "本课程聚焦极限、导数、积分与微分方程，帮助学生建立严谨的数学建模思维。",
      location: "A-101",
      schedule: "周一 08:00",
    },
  ];

  for (const row of rows) {
    await prisma.courseProfile.upsert({
      where: { courseId: row.courseId },
      update: {
        courseName: row.courseName,
        teacherName: row.teacherName,
        intro: row.intro,
        location: row.location,
        schedule: row.schedule,
      },
      create: row,
    });
  }
}

async function seedCourseAnnouncements(prisma) {
  const rows = [
    {
      id: "course-1-ann-1",
      courseId: "1",
      authorId: "demo-user",
      title: "第 5 周作业已发布",
      content: "请于本周日 22:00 前提交，题目覆盖导数应用与不定积分。",
      status: "PUBLISHED",
      publishAt: new Date("2026-03-01T10:00:00.000Z"),
    },
    {
      id: "course-1-ann-2",
      courseId: "1",
      authorId: "demo-user",
      title: "课堂测验安排",
      content: "下周一课程开始前进行 15 分钟随堂测验，范围为上两章重点内容。",
      status: "PUBLISHED",
      publishAt: new Date("2026-02-27T10:00:00.000Z"),
    },
    {
      id: "course-1-ann-3",
      courseId: "1",
      authorId: "demo-user",
      title: "助教答疑时段更新",
      content: "本周答疑调整至周三 19:00，地点为线上会议室。",
      status: "PUBLISHED",
      publishAt: new Date("2026-02-24T10:00:00.000Z"),
    },
  ];

  for (const row of rows) {
    await prisma.courseAnnouncement.upsert({
      where: { id: row.id },
      update: {
        courseId: row.courseId,
        authorId: row.authorId,
        title: row.title,
        content: row.content,
        status: row.status,
        publishAt: row.publishAt,
      },
      create: row,
    });
  }
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

  const date = new Date(2026, 2, 4);
  date.setDate(date.getDate() - index);
  return formatDayLabel(date);
}

function toNullableScore(value, seed, mod) {
  if ((seed + mod) % 19 === 0) {
    return null;
  }

  return Number(value.toFixed(1));
}

function createHistoryRecord(courseId, granularity, index) {
  const cursorKey = `${granularity.toLowerCase()}-${courseId}-${index + 1}`;
  const seed = courseId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + index * 17;

  const base = 3.8 + (seed % 11) / 10;
  const attitude = toNullableScore(Math.min(5, base - 0.1 + ((seed + 1) % 4) / 10), seed, 1);
  const content = toNullableScore(Math.min(5, base - 0.2 + ((seed + 2) % 5) / 10), seed, 2);
  const method = toNullableScore(Math.min(5, base - 0.3 + ((seed + 3) % 6) / 10), seed, 3);
  const effect = toNullableScore(Math.min(5, base - 0.4 + ((seed + 4) % 7) / 10), seed, 4);
  const interaction = toNullableScore(Math.min(5, base - 0.2 + ((seed + 5) % 5) / 10), seed, 5);
  const resource = toNullableScore(Math.min(5, base - 0.3 + ((seed + 6) % 6) / 10), seed, 6);
  const improve = toNullableScore(Math.min(5, base - 0.1 + ((seed + 7) % 4) / 10), seed, 7);

  const scoreValues = [attitude, content, method, effect, interaction, resource, improve].filter(
    (item) => item !== null,
  );
  const overallScore =
    scoreValues.length > 0
      ? Number((scoreValues.reduce((sum, item) => sum + item, 0) / scoreValues.length).toFixed(1))
      : null;

  return {
    courseId,
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

async function seedCourseReviews(prisma) {
  const rows = [
    {
      id: "course-1-rv-1",
      courseId: "1",
      userId: "demo-user",
      nickname: "匿名同学A",
      avatarUrl: "",
      createdAt: new Date("2026-03-02T10:00:00.000Z"),
      overallScore: 5,
      likesCount: 126,
      summary: "讲解非常清晰，重难点拆解到位，例题与作业衔接自然。",
      detailedScoresJson: [
        { key: "attitude", label: "教学态度与师德", score: 4.9 },
        { key: "content", label: "教学内容与设计", score: 4.8 },
        { key: "method", label: "教学方法与技巧", score: 5.0 },
        { key: "effect", label: "教学效果与成果", score: 4.7 },
        { key: "interaction", label: "师生互动与氛围", score: 4.8 },
        { key: "resource", label: "课程资源与评价", score: 4.6 },
        { key: "improve", label: "教学创新与改进", score: 4.9 },
      ],
    },
    {
      id: "course-1-rv-2",
      courseId: "1",
      userId: "demo-user",
      nickname: "匿名同学B",
      avatarUrl: "",
      createdAt: new Date("2026-02-26T10:00:00.000Z"),
      overallScore: 4.5,
      likesCount: 92,
      summary: "课堂互动很多，节奏偏快，但课后资料完整，复习很方便。",
      detailedScoresJson: [
        { key: "attitude", label: "教学态度与师德", score: 4.6 },
        { key: "content", label: "教学内容与设计", score: 4.4 },
        { key: "method", label: "教学方法与技巧", score: 4.3 },
        { key: "effect", label: "教学效果与成果", score: 4.2 },
        { key: "interaction", label: "师生互动与氛围", score: 4.7 },
        { key: "resource", label: "课程资源与评价", score: 4.5 },
        { key: "improve", label: "教学创新与改进", score: 4.1 },
      ],
    },
    {
      id: "course-1-rv-3",
      courseId: "1",
      userId: "demo-user",
      nickname: "匿名同学C",
      avatarUrl: "",
      createdAt: new Date("2026-02-20T10:00:00.000Z"),
      overallScore: 4.8,
      likesCount: 75,
      summary: "每节课前都有回顾，知识点串联得很好，适合跟着做笔记。",
      detailedScoresJson: null,
    },
    {
      id: "course-1-rv-4",
      courseId: "1",
      userId: "demo-user",
      nickname: "匿名同学D",
      avatarUrl: "",
      createdAt: new Date("2026-02-14T10:00:00.000Z"),
      overallScore: 4.2,
      likesCount: 43,
      summary: "希望增加更多分层习题，基础和提高题分开会更友好。",
      detailedScoresJson: null,
    },
  ];

  for (const row of rows) {
    await prisma.courseReview.upsert({
      where: { id: row.id },
      update: {
        courseId: row.courseId,
        userId: row.userId,
        nickname: row.nickname,
        avatarUrl: row.avatarUrl,
        createdAt: row.createdAt,
        overallScore: row.overallScore,
        likesCount: row.likesCount,
        summary: row.summary,
        detailedScoresJson: row.detailedScoresJson,
      },
      create: row,
    });
  }
}

async function seedCourseScoreHistory(prisma) {
  const granularityConfig = [
    { granularity: "SEMESTER", count: 24 },
    { granularity: "YEAR", count: 12 },
    { granularity: "MONTH", count: 24 },
    { granularity: "DAY", count: 60 },
  ];

  for (const config of granularityConfig) {
    for (let index = 0; index < config.count; index += 1) {
      const row = createHistoryRecord("1", config.granularity, index);

      await prisma.courseScoreHistory.upsert({
        where: {
          courseId_granularity_cursorKey: {
            courseId: row.courseId,
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
