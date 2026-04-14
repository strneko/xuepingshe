import { LocalDiskStorageDriver } from "./local-disk-storage-driver";
import { StorageDriver } from "./storage-driver";
import { ResourceStorageType } from "@prisma/client";

let storageDriver: StorageDriver | null = null;

export function getStorageDriver(storageType: ResourceStorageType = ResourceStorageType.LOCAL_DISK): StorageDriver {
  if (storageType !== ResourceStorageType.LOCAL_DISK) {
    throw new Error(`未实现的存储类型：${storageType}`);
  }

  if (!storageDriver) {
    storageDriver = new LocalDiskStorageDriver();
  }

  return storageDriver;
}
