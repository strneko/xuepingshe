import { PrismaClient } from "@prisma/client";
import { seedSearchRecommendation } from "./seeds/search-recommendation.seed.mjs";
import { seedCourseDetail } from "./seeds/course-detail.seed.mjs";
import { seedTeacherDetail } from "./seeds/teacher-detail.seed.mjs";
import { seedCommunityTopics } from "./seeds/community.seed.mjs";
import { seedCourseInviteCodes } from "./seeds/enrollment.seed.mjs";
import { seedShopModule } from "./seeds/shop.seed.mjs";

const prisma = new PrismaClient();

async function main() {
  await seedSearchRecommendation(prisma);
  await seedCourseInviteCodes(prisma);
  await seedShopModule(prisma);
  await seedCourseDetail(prisma);
  await seedTeacherDetail(prisma);
  await seedCommunityTopics(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
