import { UploadError } from "../errors";
import { findResourceById } from "../repositories/course-resource-repo";

export async function getResourceDetail(resourceId: string) {
  const resource = await findResourceById(resourceId);
  if (!resource || resource.status !== "ACTIVE") {
    throw new UploadError("资源不存在", 404, "RESOURCE_NOT_FOUND");
  }

  return {
    id: resource.id,
    courseId: resource.courseId,
    fileName: resource.fileName,
    mimeType: resource.mimeType,
    fileSize: resource.fileSize,
    storageType: resource.storageType,
    storageKey: resource.storageKey,
    status: resource.status,
    uploadedAt: resource.uploadedAt.toISOString(),
  };
}
