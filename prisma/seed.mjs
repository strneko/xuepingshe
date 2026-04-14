import { PrismaClient } from "@prisma/client";
import { seedSearchRecommendation } from "./seeds/search-recommendation.seed.mjs";
import { seedCourseDetail } from "./seeds/course-detail.seed.mjs";
import { seedTeacherDetail } from "./seeds/teacher-detail.seed.mjs";

const prisma = new PrismaClient();

async function main() {
  await seedSearchRecommendation(prisma);
  await seedCourseDetail(prisma);
  await seedTeacherDetail(prisma);
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
