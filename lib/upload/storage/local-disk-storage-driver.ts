import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { getUploadLocalRoot } from "../constants";
import { UploadError } from "../errors";
import { CompleteMultipartPayload, StorageDriver, UploadPartPayload } from "./storage-driver";

function ensureSafeUploadId(uploadId: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(uploadId)) {
    throw new UploadError("uploadId 非法", 400, "INVALID_UPLOAD_ID");
  }
}

function buildTmpDir(uploadId: string) {
  ensureSafeUploadId(uploadId);
  return path.join(getUploadLocalRoot(), "tmp", uploadId);
}

function buildPartPath(uploadId: string, partNumber: number) {
  return path.join(buildTmpDir(uploadId), `part-${partNumber}`);
}

function buildResourcePath(storageKey: string) {
  return path.join(getUploadLocalRoot(), storageKey);
}

export class LocalDiskStorageDriver implements StorageDriver {
  async initMultipart(uploadId: string): Promise<void> {
    const dir = buildTmpDir(uploadId);
    await fs.mkdir(dir, { recursive: true });
  }

  async putPart(payload: UploadPartPayload): Promise<{ storageKey: string; etag?: string }> {
    const partPath = buildPartPath(payload.uploadId, payload.partNumber);
    await fs.mkdir(path.dirname(partPath), { recursive: true });
    await fs.writeFile(partPath, payload.data);

    const etag = createHash("sha1").update(payload.data).digest("hex");
    return {
      storageKey: path.join("tmp", payload.uploadId, `part-${payload.partNumber}`).replaceAll("\\", "/"),
      etag,
    };
  }

  async completeMultipart(payload: CompleteMultipartPayload): Promise<{ storageKey: string }> {
    const finalPath = buildResourcePath(payload.finalStorageKey);
    await fs.mkdir(path.dirname(finalPath), { recursive: true });

    const chunks: Buffer[] = [];
    for (const partNumber of payload.orderedPartNumbers) {
      const partPath = buildPartPath(payload.uploadId, partNumber);
      chunks.push(await fs.readFile(partPath));
    }

    await fs.writeFile(finalPath, Buffer.concat(chunks));
    return { storageKey: payload.finalStorageKey };
  }

  async openReadStream(storageKey: string): Promise<Readable> {
    const target = buildResourcePath(storageKey);
    await fs.access(target);
    return createReadStream(target);
  }

  async stat(storageKey: string): Promise<{ size: number; modifiedAt: Date }> {
    const target = buildResourcePath(storageKey);
    const stats = await fs.stat(target);
    return {
      size: stats.size,
      modifiedAt: stats.mtime,
    };
  }

  async deletePrefix(prefix: string): Promise<void> {
    const safePrefix = prefix.replaceAll("/", path.sep);
    const target = path.join(getUploadLocalRoot(), safePrefix);
    await fs.rm(target, { recursive: true, force: true });
  }

  async deleteObject(storageKey: string): Promise<void> {
    const target = buildResourcePath(storageKey);
    await fs.rm(target, { force: true });
  }
}
