import { ResourceStorageType } from "@prisma/client";
import { UploadError } from "../errors";
import { findResourceById } from "../repositories/course-resource-repo";
import { getStorageDriver } from "../storage";
import { sanitizeFileName } from "./shared";

function buildContentDisposition(fileName: string) {
  const safeName = sanitizeFileName(fileName);
  const encoded = encodeURIComponent(safeName);
  return `attachment; filename="${safeName}"; filename*=UTF-8''${encoded}`;
}

export async function getResourceDownloadPayload(resourceId: string) {
  const resource = await findResourceById(resourceId);
  if (!resource || resource.status !== "ACTIVE") {
    throw new UploadError("资源不存在", 404, "RESOURCE_NOT_FOUND");
  }

  const driver = getStorageDriver(resource.storageType as ResourceStorageType);
  const [stream, stat] = await Promise.all([
    driver.openReadStream(resource.storageKey),
    driver.stat(resource.storageKey),
  ]);

  return {
    stream,
    headers: {
      "Content-Type": resource.mimeType || "application/octet-stream",
      "Content-Disposition": buildContentDisposition(resource.fileName),
      "Content-Length": String(stat.size),
      "Last-Modified": stat.modifiedAt.toUTCString(),
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  };
}
