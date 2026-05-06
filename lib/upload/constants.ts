import path from "node:path";

export const DEMO_USER_ID = "demo-user";
export const HASH_TYPE_SHA256 = "SHA256";

/** Maximum total file size in bytes. Default 20MB, configurable via UPLOAD_MAX_FILE_SIZE_MB */
function readMaxFileSize(): number {
  const mb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB);
  if (Number.isFinite(mb) && mb > 0) return mb * 1024 * 1024;
  return 20 * 1024 * 1024; // 20MB default
}

/** Maximum size per chunk in bytes. Default 5MB */
function readMaxChunkSize(): number {
  const mb = Number(process.env.UPLOAD_MAX_CHUNK_SIZE_MB);
  if (Number.isFinite(mb) && mb > 0) return mb * 1024 * 1024;
  return 4 * 1024 * 1024; // 4MB default (under Vercel 4.5MB body limit)
}

export const DEFAULT_MAX_FILE_SIZE = readMaxFileSize();
export const DEFAULT_MAX_CHUNK_SIZE = readMaxChunkSize();

/** Maximum number of chunks per upload */
export const DEFAULT_MAX_CHUNKS = Math.ceil(DEFAULT_MAX_FILE_SIZE / 1024); // ~20,000 at 1KB min chunk — allow reasonable range

export const DEFAULT_UPLOAD_EXPIRES_HOURS = 24;

export function getUploadLocalRoot() {
  return process.env.UPLOAD_LOCAL_ROOT
    ? path.resolve(process.env.UPLOAD_LOCAL_ROOT)
    : path.resolve(process.cwd(), ".uploads");
}
