import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export function listUploadedPartNumbers(uploadId: string) {
  return prisma.resourceUploadPart.findMany({
    where: {
      uploadId,
      status: "UPLOADED",
    },
    orderBy: { partNumber: "asc" },
    select: { partNumber: true },
  });
}

export function findPart(uploadId: string, partNumber: number) {
  return prisma.resourceUploadPart.findUnique({
    where: {
      uploadId_partNumber: {
        uploadId,
        partNumber,
      },
    },
  });
}

export function upsertPart(data: {
  uploadId: string;
  partNumber: number;
  chunkHash: string;
  chunkSize: number;
  storageKey: string;
  etag?: string;
}) {
  return prisma.resourceUploadPart.upsert({
    where: {
      uploadId_partNumber: {
        uploadId: data.uploadId,
        partNumber: data.partNumber,
      },
    },
    create: {
      uploadId: data.uploadId,
      partNumber: data.partNumber,
      chunkHash: data.chunkHash,
      chunkSize: data.chunkSize,
      storageKey: data.storageKey,
      etag: data.etag,
      status: "UPLOADED",
    },
    update: {
      chunkHash: data.chunkHash,
      chunkSize: data.chunkSize,
      storageKey: data.storageKey,
      etag: data.etag,
      status: "UPLOADED",
    },
  });
}

export function listUploadedParts(uploadId: string) {
  return prisma.resourceUploadPart.findMany({
    where: {
      uploadId,
      status: "UPLOADED",
    },
    orderBy: { partNumber: "asc" },
    select: {
      partNumber: true,
      chunkHash: true,
      chunkSize: true,
    },
  });
}

export function deletePartsByUploadId(tx: Prisma.TransactionClient, uploadId: string) {
  return tx.resourceUploadPart.deleteMany({
    where: { uploadId },
  });
}
