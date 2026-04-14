import { Readable } from "node:stream";

export interface UploadPartPayload {
  uploadId: string;
  partNumber: number;
  data: Buffer;
}

export interface CompleteMultipartPayload {
  uploadId: string;
  finalStorageKey: string;
  orderedPartNumbers: number[];
}

export interface StorageDriver {
  initMultipart(uploadId: string): Promise<void>;
  putPart(payload: UploadPartPayload): Promise<{ storageKey: string; etag?: string }>;
  completeMultipart(payload: CompleteMultipartPayload): Promise<{ storageKey: string }>;
  openReadStream(storageKey: string): Promise<Readable>;
  stat(storageKey: string): Promise<{ size: number; modifiedAt: Date }>;
  deletePrefix(prefix: string): Promise<void>;
  deleteObject(storageKey: string): Promise<void>;
}
