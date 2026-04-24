import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { DEFAULT_MAX_CHUNKS, DEFAULT_MAX_FILE_SIZE, DEFAULT_UPLOAD_EXPIRES_HOURS } from "../constants";
import { UploadError } from "../errors";

export interface InitUploadInput {
  courseId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  wholeFileHash: string;
  chunkSize: number;
  totalChunks: number;
}

export function sanitizeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|\x00-\x1F]/g, "_").slice(0, 180) || "file";
}

export function assertInitInput(input: InitUploadInput) {
  if (!input.courseId) throw new UploadError("courseId 不能为空", 400, "INVALID_COURSE_ID");
  if (!input.fileName) throw new UploadError("fileName 不能为空", 400, "INVALID_FILE_NAME");
  if (!Number.isInteger(input.fileSize) || input.fileSize <= 0) {
    throw new UploadError("fileSize 非法", 400, "INVALID_FILE_SIZE");
  }
  if (input.fileSize > DEFAULT_MAX_FILE_SIZE) {
    throw new UploadError("文件大小超过限制", 413, "FILE_TOO_LARGE");
  }
  if (!Number.isInteger(input.chunkSize) || input.chunkSize <= 0) {
    throw new UploadError("chunkSize 非法", 400, "INVALID_CHUNK_SIZE");
  }
  if (!Number.isInteger(input.totalChunks) || input.totalChunks <= 0 || input.totalChunks > DEFAULT_MAX_CHUNKS) {
    throw new UploadError("totalChunks 非法", 400, "INVALID_TOTAL_CHUNKS");
  }
  if (!/^[a-fA-F0-9]{64}$/.test(input.wholeFileHash)) {
    throw new UploadError("wholeFileHash 非法", 400, "INVALID_WHOLE_FILE_HASH");
  }
}

export function createUploadId() {
  return `upl_${randomUUID().replaceAll("-", "")}`;
}

export function buildTempObjectPrefix(uploadId: string) {
  return `tmp/${uploadId}`;
}

export function buildFinalStorageKey(resourceId: string, fileName: string, now = new Date()) {
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const safe = sanitizeFileName(path.basename(fileName));
  return `resources/${yyyy}/${mm}/${resourceId}-${safe}`;
}

export function computeSha256Hex(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function getExpiresAt(now = new Date()) {
  const next = new Date(now);
  next.setHours(next.getHours() + DEFAULT_UPLOAD_EXPIRES_HOURS);
  return next;
}
