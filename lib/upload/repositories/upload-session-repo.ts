import { prisma } from "@/lib/prisma";
import { Prisma, UploadStatus } from "@prisma/client";

export function findSessionByUploadId(uploadId: string) {
  return prisma.resourceUploadSession.findUnique({
    where: { uploadId },
  });
}

export function findReusableSession(params: {
  userId: string;
  courseId: string;
  wholeFileHash: string;
  fileSize: number;
  now: Date;
}) {
  return prisma.resourceUploadSession.findFirst({
    where: {
      userId: params.userId,
      courseId: params.courseId,
      wholeFileHash: params.wholeFileHash,
      fileSize: params.fileSize,
      status: { in: [UploadStatus.INIT, UploadStatus.UPLOADING, UploadStatus.FAILED] },
      expiresAt: { gt: params.now },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function createSession(data: Prisma.ResourceUploadSessionCreateInput) {
  return prisma.resourceUploadSession.create({ data });
}

export function updateSession(uploadId: string, data: Prisma.ResourceUploadSessionUpdateInput) {
  return prisma.resourceUploadSession.update({
    where: { uploadId },
    data,
  });
}

export function countUploadedParts(uploadId: string) {
  return prisma.resourceUploadPart.count({
    where: {
      uploadId,
      status: "UPLOADED",
    },
  });
}
