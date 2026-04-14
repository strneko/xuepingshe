import { prisma } from "@/lib/prisma";
import { UploadError } from "../errors";
import { createCourseResource } from "../repositories/course-resource-repo";
import { deletePartsByUploadId, listUploadedParts } from "../repositories/upload-part-repo";
import { findSessionByUploadId, updateSession } from "../repositories/upload-session-repo";
import { getStorageDriver } from "../storage";
import { HASH_TYPE_SHA256 } from "../constants";
import { buildFinalStorageKey, ensureDemoUser } from "./shared";

export async function completeUploadSession(input: {
  uploadId: string;
  uploadedPartsMeta: Array<{ partNumber: number; chunkHash: string }>;
}) {
  const session = await findSessionByUploadId(input.uploadId);
  if (!session) {
    throw new UploadError("上传会话不存在", 404, "SESSION_NOT_FOUND");
  }

  if (session.status === "COMPLETED") {
    return {
      accepted: true,
      status: "COMPLETED" as const,
      resourceId: session.resourceId ?? undefined,
    };
  }

  if (session.status === "CANCELED") {
    throw new UploadError("上传会话已取消", 409, "SESSION_CANCELED");
  }

  if (session.status === "MERGING") {
    return {
      accepted: true,
      status: "MERGING" as const,
      resourceId: session.resourceId ?? undefined,
    };
  }

  const uploadedParts = await listUploadedParts(input.uploadId);
  if (uploadedParts.length !== session.totalChunks) {
    throw new UploadError("分片未上传完整", 400, "PARTS_INCOMPLETE");
  }

  for (let i = 0; i < uploadedParts.length; i += 1) {
    if (uploadedParts[i].partNumber !== i + 1) {
      throw new UploadError("分片序号不连续", 400, "PARTS_NOT_CONTIGUOUS");
    }
  }

  const metaMap = new Map(input.uploadedPartsMeta.map((item) => [item.partNumber, item.chunkHash.toLowerCase()]));
  for (const part of uploadedParts) {
    const expected = metaMap.get(part.partNumber);
    if (!expected || expected !== part.chunkHash.toLowerCase()) {
      throw new UploadError(`分片 ${part.partNumber} 哈希不匹配`, 400, "PART_META_MISMATCH");
    }
  }

  await updateSession(input.uploadId, { status: "MERGING" });

  try {
    const userId = await ensureDemoUser();
    const resource = await createCourseResource({
      courseId: session.courseId,
      fileName: session.fileName,
      mimeType: session.mimeType,
      fileSize: session.fileSize,
      storageType: session.storageType,
      storageBucket: session.storageBucket,
      storageKey: "pending",
      wholeFileHash: session.wholeFileHash,
      status: "ACTIVE",
      uploader: {
        connect: {
          id: userId,
        },
      },
    });

    const finalStorageKey = buildFinalStorageKey(resource.id, session.fileName);
    await getStorageDriver().completeMultipart({
      uploadId: input.uploadId,
      finalStorageKey,
      orderedPartNumbers: uploadedParts.map((item) => item.partNumber),
    });

    await prisma.$transaction(async (tx) => {
      await tx.courseResource.update({
        where: { id: resource.id },
        data: {
          storageKey: finalStorageKey,
        },
      });

      await tx.resourceDedupeIndex.upsert({
        where: {
          hashType_hashValue_fileSize: {
            hashType: HASH_TYPE_SHA256,
            hashValue: session.wholeFileHash,
            fileSize: session.fileSize,
          },
        },
        create: {
          hashType: HASH_TYPE_SHA256,
          hashValue: session.wholeFileHash,
          fileSize: session.fileSize,
          resourceId: resource.id,
        },
        update: {
          resourceId: resource.id,
        },
      });

      await tx.resourceUploadSession.update({
        where: { uploadId: input.uploadId },
        data: {
          status: "COMPLETED",
          resourceId: resource.id,
          uploadedChunks: session.totalChunks,
        },
      });

      await deletePartsByUploadId(tx, input.uploadId);
    });

    await getStorageDriver().deletePrefix(session.tempObjectPrefix);

    return {
      accepted: true,
      status: "MERGING" as const,
      resourceId: resource.id,
    };
  } catch (error) {
    await updateSession(input.uploadId, { status: "FAILED" });
    throw error;
  }
}
