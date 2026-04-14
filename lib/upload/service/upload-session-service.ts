import { ResourceStatus } from "@prisma/client";
import { HASH_TYPE_SHA256 } from "../constants";
import { UploadError } from "../errors";
import { findInstantResource, findResourceById } from "../repositories/course-resource-repo";
import { listUploadedPartNumbers } from "../repositories/upload-part-repo";
import { createSession, findReusableSession } from "../repositories/upload-session-repo";
import { getStorageDriver } from "../storage";
import {
  assertInitInput,
  buildTempObjectPrefix,
  createUploadId,
  ensureDemoUser,
  getExpiresAt,
  InitUploadInput,
} from "./shared";

export async function initUploadSession(input: InitUploadInput) {
  assertInitInput(input);
  const userId = await ensureDemoUser();

  const dedupe = await findInstantResource({
    hashType: HASH_TYPE_SHA256,
    hashValue: input.wholeFileHash,
    fileSize: input.fileSize,
  });

  if (dedupe?.resource && dedupe.resource.status === ResourceStatus.ACTIVE) {
    const resource = await findResourceById(dedupe.resource.id);
    if (resource) {
      return {
        code: "INSTANT_SUCCESS" as const,
        resourceId: resource.id,
      };
    }
  }

  const now = new Date();
  let session = await findReusableSession({
    userId,
    courseId: input.courseId,
    wholeFileHash: input.wholeFileHash,
    fileSize: input.fileSize,
    now,
  });

  if (!session) {
    const uploadId = createUploadId();
    const tempObjectPrefix = buildTempObjectPrefix(uploadId);

    session = await createSession({
      uploadId,
      courseId: input.courseId,
      user: { connect: { id: userId } },
      fileName: input.fileName,
      mimeType: input.mimeType || "application/octet-stream",
      fileSize: input.fileSize,
      chunkSize: input.chunkSize,
      totalChunks: input.totalChunks,
      wholeFileHash: input.wholeFileHash,
      status: "UPLOADING",
      storageType: "LOCAL_DISK",
      tempObjectPrefix,
      expiresAt: getExpiresAt(now),
    });

    await getStorageDriver().initMultipart(uploadId);
  }

  if (session.status === "COMPLETED" && session.resourceId) {
    return {
      code: "INSTANT_SUCCESS" as const,
      resourceId: session.resourceId,
    };
  }

  if (session.status === "CANCELED") {
    throw new UploadError("上传会话已取消，请重新初始化", 409, "SESSION_CANCELED");
  }

  const uploadedParts = (await listUploadedPartNumbers(session.uploadId)).map((item) => item.partNumber);

  return {
    code: "UPLOAD_REQUIRED" as const,
    uploadId: session.uploadId,
    uploadedParts,
    concurrencyHint: 3,
  };
}
