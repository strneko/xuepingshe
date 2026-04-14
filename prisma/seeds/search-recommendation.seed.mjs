export async function seedSearchRecommendation(prisma) {
  await seedSearchDocuments(prisma);
  await seedRecommendedReviews(prisma);
  await seedSearchKeywords(prisma);
}

async function seedSearchDocuments(prisma) {
  const docs = [
    {
      docType: "COURSE",
      docId: "1",
      title: "高等数学",
      subtitle: "任课教师：张教授",
      department: "数学与统计学院",
      scoreSnapshot: 4.8,
      reviewCountSnapshot: 126,
      snippet: "极限、导数、积分讲解系统，重难点拆解细致，作业反馈及时。",
      searchableText: "高等数学 张教授 数学与统计学院 极限 导数 积分",
    },
    {
      docType: "TEACHER",
      docId: "1",
      title: "张教授",
      subtitle: "教授 / 博导",
      department: "数学与统计学院",
      scoreSnapshot: 4.8,
      reviewCountSnapshot: 331,
      snippet: "长期承担高等数学、线性代数课程，注重课堂互动与知识体系搭建。",
      searchableText: "张教授 高等数学 线性代数 教授 博导",
    },
    {
      docType: "COURSE",
      docId: "2",
      title: "线性代数",
      subtitle: "任课教师：李教授",
      department: "数学与统计学院",
      scoreSnapshot: 4.6,
      reviewCountSnapshot: 98,
      snippet: "矩阵与向量空间讲解清晰，课后习题覆盖考试重点。",
      searchableText: "线性代数 李教授 矩阵 向量空间",
    },
    {
      docType: "TEACHER",
      docId: "2",
      title: "李教授",
      subtitle: "副教授",
      department: "数学与统计学院",
      scoreSnapshot: 4.6,
      reviewCountSnapshot: 214,
      snippet: "线性代数课堂节奏适中，善于通过例题建立抽象概念。",
      searchableText: "李教授 线性代数 副教授",
    },
    {
      docType: "COURSE",
      docId: "3",
      title: "概率论与数理统计",
      subtitle: "任课教师：王教授",
      department: "统计学院",
      scoreSnapshot: 4.7,
      reviewCountSnapshot: 143,
      snippet: "案例驱动教学，统计推断章节结构化程度高。",
      searchableText: "概率论 数理统计 王教授 统计推断",
    },
    {
      docType: "TEACHER",
      docId: "3",
      title: "王教授",
      subtitle: "教授",
      department: "统计学院",
      scoreSnapshot: 4.7,
      reviewCountSnapshot: 267,
      snippet: "擅长用真实数据案例解释概率模型，课堂实践性强。",
      searchableText: "王教授 概率模型 统计学院",
    },
  ];

  for (const doc of docs) {
    await prisma.searchDocument.upsert({
      where: {
        docType_docId: {
          docType: doc.docType,
          docId: doc.docId,
        },
      },
      update: {
        title: doc.title,
        subtitle: doc.subtitle,
        department: doc.department,
        scoreSnapshot: doc.scoreSnapshot,
        reviewCountSnapshot: doc.reviewCountSnapshot,
        snippet: doc.snippet,
        searchableText: doc.searchableText,
      },
      create: doc,
    });
  }
}

async function seedRecommendedReviews(prisma) {
  const rows = [
    {
      reviewId: "rec-rv-1",
      nickname: "匿名同学K",
      sourceCourseId: "1",
      sourceCourseName: "高等数学",
      sourceTeacherId: "1",
      sourceTeacherName: "张教授",
      overallScore: 4.9,
      likesCount: 160,
      summary: "讲解系统、例题覆盖全面，适合打基础。",
      detailedScoresJson: [
        { key: "attitude", label: "教学态度与师德", score: 5.0 },
        { key: "content", label: "教学内容与设计", score: 4.8 },
        { key: "method", label: "教学方法与技巧", score: 4.9 },
        { key: "effect", label: "教学效果与成果", score: 4.8 },
        { key: "interaction", label: "师生互动与氛围", score: 4.9 },
        { key: "resource", label: "课程资源与评价", score: 4.7 },
        { key: "improve", label: "教学创新与改进", score: 4.8 },
      ],
      rankScore: 98,
      isActive: true,
      batchKey: "default",
    },
    {
      reviewId: "rec-rv-2",
      nickname: "匿名同学L",
      sourceCourseId: "2",
      sourceCourseName: "线性代数",
      sourceTeacherId: "2",
      sourceTeacherName: "李教授",
      overallScore: 4.7,
      likesCount: 132,
      summary: "课堂互动自然，知识点拆分清晰，复习压力小。",
      detailedScoresJson: null,
      rankScore: 92,
      isActive: true,
      batchKey: "default",
    },
    {
      reviewId: "rec-rv-3",
      nickname: "匿名同学M",
      sourceCourseId: "3",
      sourceCourseName: "概率论与数理统计",
      sourceTeacherId: "3",
      sourceTeacherName: "王教授",
      overallScore: 4.8,
      likesCount: 118,
      summary: "案例很贴近考试题型，重点题讲得非常透彻。",
      detailedScoresJson: null,
      rankScore: 89,
      isActive: true,
      batchKey: "default",
    },
    {
      reviewId: "rec-rv-4",
      nickname: "匿名同学N",
      sourceCourseId: null,
      sourceCourseName: "离散数学",
      sourceTeacherId: null,
      sourceTeacherName: "陈教授",
      overallScore: 4.6,
      likesCount: 105,
      summary: "教学节奏合理，课后资料结构化程度高。",
      detailedScoresJson: null,
      rankScore: 86,
      isActive: true,
      batchKey: "default",
    },
  ];

  for (const row of rows) {
    await prisma.recommendedReview.upsert({
      where: { reviewId: row.reviewId },
      update: {
        nickname: row.nickname,
        sourceCourseId: row.sourceCourseId,
        sourceCourseName: row.sourceCourseName,
        sourceTeacherId: row.sourceTeacherId,
        sourceTeacherName: row.sourceTeacherName,
        overallScore: row.overallScore,
        likesCount: row.likesCount,
        summary: row.summary,
        detailedScoresJson: row.detailedScoresJson,
        rankScore: row.rankScore,
        isActive: row.isActive,
        batchKey: row.batchKey,
      },
      create: row,
    });
  }
}

async function seedSearchKeywords(prisma) {
  const keywords = [
    { keyword: "高数", searchCount: 28 },
    { keyword: "线代", searchCount: 21 },
    { keyword: "概率论", searchCount: 19 },
    { keyword: "张教授", searchCount: 16 },
    { keyword: "选课建议", searchCount: 13 },
  ];

  for (const item of keywords) {
    await prisma.searchKeyword.upsert({
      where: { keyword: item.keyword },
      update: {
        searchCount: item.searchCount,
        lastSearchedAt: new Date(),
      },
      create: {
        keyword: item.keyword,
        searchCount: item.searchCount,
        lastSearchedAt: new Date(),
      },
    });
  }
}
