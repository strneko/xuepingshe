export async function seedCommunityTopics(prisma) {
  await seedBaseTopics(prisma);
  await seedRecommendedTopics(prisma);
}

async function seedBaseTopics(prisma) {
  const topics = [
    { name: "课程体验", postCount: 18, followerCount: 46, isRecommended: false },
    { name: "学习方法", postCount: 22, followerCount: 58, isRecommended: false },
    { name: "校园生活", postCount: 15, followerCount: 37, isRecommended: false },
    { name: "考试攻略", postCount: 19, followerCount: 51, isRecommended: false },
    { name: "选课建议", postCount: 21, followerCount: 63, isRecommended: false },
    { name: "社团活动", postCount: 11, followerCount: 29, isRecommended: false },
    { name: "宿舍日常", postCount: 9, followerCount: 24, isRecommended: false },
    { name: "保研经验", postCount: 8, followerCount: 33, isRecommended: false },
    { name: "实习分享", postCount: 14, followerCount: 41, isRecommended: false },
    { name: "资源整理", postCount: 16, followerCount: 39, isRecommended: false },
  ];

  for (const topic of topics) {
    await prisma.communityTopic.upsert({
      where: { name: topic.name },
      update: {
        postCount: topic.postCount,
        followerCount: topic.followerCount,
        isRecommended: topic.isRecommended,
      },
      create: topic,
    });
  }
}

async function seedRecommendedTopics(prisma) {
  const recommendedTopics = [
    { name: "期末突击", postCount: 35, followerCount: 96, isRecommended: true },
    { name: "复习计划", postCount: 33, followerCount: 91, isRecommended: true },
    { name: "高赞笔记", postCount: 31, followerCount: 88, isRecommended: true },
    { name: "课堂避坑", postCount: 29, followerCount: 84, isRecommended: true },
    { name: "课程资料", postCount: 27, followerCount: 79, isRecommended: true },
    { name: "上岸经验", postCount: 25, followerCount: 76, isRecommended: true },
  ];

  for (const topic of recommendedTopics) {
    await prisma.communityTopic.upsert({
      where: { name: topic.name },
      update: {
        postCount: topic.postCount,
        followerCount: topic.followerCount,
        isRecommended: topic.isRecommended,
      },
      create: topic,
    });
  }
}
