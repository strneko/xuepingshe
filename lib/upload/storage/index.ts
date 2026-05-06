import { ResourceStorageType } from "@prisma/client";
import { StorageDriver } from "./storage-driver";
import { LocalDiskStorageDriver } from "./local-disk-storage-driver";
import { S3StorageDriver } from "./s3-storage-driver";

let storageDriver: StorageDriver | null = null;

export function getStorageDriver(storageType?: ResourceStorageType): StorageDriver {
  const resolvedType = storageType ?? resolveStorageType();

  if (storageDriver) return storageDriver;

  switch (resolvedType) {
    case ResourceStorageType.LOCAL_DISK:
      storageDriver = new LocalDiskStorageDriver();
      break;
    case ResourceStorageType.S3:
      storageDriver = new S3StorageDriver();
      break;
    default:
      throw new Error(`未实现的存储类型：${resolvedType}`);
  }

  return storageDriver;
}

export function resolveStorageType(): ResourceStorageType {
  const env = process.env.UPLOAD_STORAGE?.toUpperCase();
  if (env === "S3") return ResourceStorageType.S3;
  if (env === "LOCAL_DISK" || !env) return ResourceStorageType.LOCAL_DISK;
  // Also recognise S3-compatible aliases
  if (env === "OSS" || env === "COS" || env === "MINIO") return ResourceStorageType.S3;
  return ResourceStorageType.LOCAL_DISK;
}

/** Reset driver instance (for testing) */
export function resetStorageDriver(): void {
  storageDriver = null;
}
