import path from "node:path";

export const DEMO_USER_ID = "demo-user";
export const HASH_TYPE_SHA256 = "SHA256";

export const DEFAULT_MAX_FILE_SIZE = 500 * 1024 * 1024;
export const DEFAULT_MAX_CHUNKS = 1024;

export const DEFAULT_UPLOAD_EXPIRES_HOURS = 24;

export function getUploadLocalRoot() {
  return process.env.UPLOAD_LOCAL_ROOT
    ? path.resolve(process.env.UPLOAD_LOCAL_ROOT)
    : path.resolve(process.cwd(), ".uploads");
}
