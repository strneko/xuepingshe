import { DEFAULT_MAX_CHUNK_SIZE } from "../constants";
import { UploadError } from "../errors";
import { findPart, upsertPart } from "../repositories/upload-part-repo";
import { countUploadedParts, findSessionByUploadId, updateSession } from "../repositories/upload-session-repo";
import { getStorageDriver } from "../storage";
import { computeSha256Hex } from "./shared";

export async function uploadPartToSession(input: {
  uploadId: string;
  partNumber: number;
  chunkHash: string;
  data: Buffer;
}) {
  if (!/^[a-zA-Z0-9_-]+$/.test(input.uploadId)) {
    throw new UploadError("Upload-Id 非法", 400, "INVALID_UPLOAD_ID");
  }

  if (!Number.isInteger(input.partNumber) || input.partNumber <= 0) {
    throw new UploadError("Part-Number 非法", 400, "INVALID_PART_NUMBER");
  }

  if (!/^[a-fA-F0-9]{64}$/.test(input.chunkHash)) {
    throw new UploadError("Chunk-Hash 非法", 400, "INVALID_CHUNK_HASH");
  }

  const session = await findSessionByUploadId(input.uploadId);
  if (!session) {
    throw new UploadError("上传会话不存在", 404, "SESSION_NOT_FOUND");
  }

  if (input.partNumber > session.totalChunks) {
    throw new UploadError("Part-Number 超出范围", 400, "PART_NUMBER_OUT_OF_RANGE");
  }

  if (session.status === "CANCELED") {
    throw new UploadError("上传会话已取消", 409, "SESSION_CANCELED");
  }
  if (session.status === "COMPLETED") {
    throw new UploadError("上传会话已完成", 409, "SESSION_COMPLETED");
  }
  if (session.status === "MERGING") {
    throw new UploadError("上传会话正在合并", 409, "SESSION_MERGING");
  }

  if (input.data.length > DEFAULT_MAX_CHUNK_SIZE) {
    throw new UploadError("分片大小超过限制", 413, "CHUNK_TOO_LARGE");
  }

  const computedHash = computeSha256Hex(input.data);
  if (computedHash !== input.chunkHash.toLowerCase()) {
    throw new UploadError("分片哈希校验失败", 400, "CHUNK_HASH_MISMATCH");
  }

  const existing = await findPart(input.uploadId, input.partNumber);
  if (existing && existing.status === "UPLOADED") {
    if (existing.chunkHash.toLowerCase() !== input.chunkHash.toLowerCase()) {
      throw new UploadError("同一分片哈希冲突", 409, "PART_HASH_CONFLICT");
    }

    return {
      etag: existing.etag ?? undefined,
    };
  }

  const { storageKey, etag } = await getStorageDriver().putPart({
    uploadId: input.uploadId,
    partNumber: input.partNumber,
    data: input.data,
  });

  await upsertPart({
    uploadId: input.uploadId,
    partNumber: input.partNumber,
    chunkHash: input.chunkHash.toLowerCase(),
    chunkSize: input.data.length,
    storageKey,
    etag,
  });

  const uploadedChunks = await countUploadedParts(input.uploadId);
  await updateSession(input.uploadId, {
    status: "UPLOADING",
    uploadedChunks,
  });

  return {
    etag,
  };
}
