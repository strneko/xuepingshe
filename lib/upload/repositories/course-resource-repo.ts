import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export function findResourceById(resourceId: string) {
  return prisma.courseResource.findUnique({
    where: { id: resourceId },
  });
}

export function listResourcesByCourseId(courseId: string) {
  return prisma.courseResource.findMany({
    where: {
      courseId,
      status: "ACTIVE",
    },
    orderBy: [{ uploadedAt: "desc" }, { createdAt: "desc" }],
  });
}

export function createCourseResource(data: Prisma.CourseResourceCreateInput) {
  return prisma.courseResource.create({ data });
}

export function findInstantResource(params: { hashType: string; hashValue: string; fileSize: number }) {
  return prisma.resourceDedupeIndex.findUnique({
    where: {
      hashType_hashValue_fileSize: {
        hashType: params.hashType,
        hashValue: params.hashValue,
        fileSize: params.fileSize,
      },
    },
    include: {
      resource: true,
    },
  });
}

export function upsertDedupeIndex(data: { hashType: string; hashValue: string; fileSize: number; resourceId: string }) {
  return prisma.resourceDedupeIndex.upsert({
    where: {
      hashType_hashValue_fileSize: {
        hashType: data.hashType,
        hashValue: data.hashValue,
        fileSize: data.fileSize,
      },
    },
    create: {
      hashType: data.hashType,
      hashValue: data.hashValue,
      fileSize: data.fileSize,
      resourceId: data.resourceId,
    },
    update: {
      resourceId: data.resourceId,
    },
  });
}
