import { ResourceStorageType } from "@prisma/client";
import { UploadError } from "../errors";
import {
  deleteDedupeEntriesByResourceId,
  findResourceById,
  markResourceDeleted,
} from "../repositories/course-resource-repo";
import { getStorageDriver } from "../storage";

export async function deleteResource(resourceId: string) {
  const resource = await findResourceById(resourceId);

  if (!resource) {
    throw new UploadError("资源不存在", 404, "RESOURCE_NOT_FOUND");
  }

  if (resource.status === "DELETED") {
    return {
      deleted: true,
      resourceId,
    };
  }

  const driver = getStorageDriver(resource.storageType as ResourceStorageType);
  await driver.deleteObject(resource.storageKey);

  await Promise.all([markResourceDeleted(resourceId), deleteDedupeEntriesByResourceId(resourceId)]);

  return {
    deleted: true,
    resourceId,
  };
}
