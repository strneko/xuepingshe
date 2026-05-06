import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCopyCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { CompleteMultipartPayload, StorageDriver, UploadPartPayload } from "./storage-driver";

function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`缺少环境变量: ${key}`);
  return value;
}

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    const endpoint = process.env.S3_ENDPOINT;
    _client = new S3Client({
      region: process.env.S3_REGION ?? "auto",
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      credentials: {
        accessKeyId: env("S3_ACCESS_KEY_ID"),
        secretAccessKey: env("S3_SECRET_ACCESS_KEY"),
      },
    });
  }
  return _client;
}

const BUCKET = () => env("S3_BUCKET");

function pkey(key: string): string {
  const base = (process.env.S3_KEY_PREFIX ?? "").replace(/\/$/, "");
  return base ? `${base}/${key}` : key;
}

function tmpPartKey(uploadId: string, partNumber: number): string {
  return pkey(`tmp/${uploadId}/part-${String(partNumber).padStart(5, "0")}`);
}

export class S3StorageDriver implements StorageDriver {
  async initMultipart(_uploadId: string): Promise<void> {
    // S3 objects are created lazily on first putPart
  }

  async putPart(payload: UploadPartPayload): Promise<{ storageKey: string; etag?: string }> {
    const key = tmpPartKey(payload.uploadId, payload.partNumber);
    const result = await getClient().send(
      new PutObjectCommand({
        Bucket: BUCKET(),
        Key: key,
        Body: payload.data,
      }),
    );
    return { storageKey: key, etag: (result as { ETag?: string }).ETag };
  }

  async completeMultipart(payload: CompleteMultipartPayload): Promise<{ storageKey: string }> {
    const client = getClient();
    const bucket = BUCKET();
    const finalKey = pkey(payload.finalStorageKey);

    // Step 1: Create a new S3 multipart upload for the final object
    const createResult = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: finalKey,
      }),
    );
    const s3UploadId = createResult.UploadId!;

    try {
      // Step 2: Copy each temp part into the multipart upload using UploadPartCopy
      const parts: { PartNumber: number; ETag: string }[] = [];
      for (const partNumber of payload.orderedPartNumbers) {
        const srcKey = tmpPartKey(payload.uploadId, partNumber);
        const copyResult = await client.send(
          new UploadPartCopyCommand({
            Bucket: bucket,
            Key: finalKey,
            PartNumber: partNumber,
            UploadId: s3UploadId,
            CopySource: `${bucket}/${srcKey}`,
          }),
        );
        parts.push({ PartNumber: partNumber, ETag: copyResult.CopyPartResult!.ETag! });
      }

      // Step 3: Complete the multipart upload
      await client.send(
        new CompleteMultipartUploadCommand({
          Bucket: bucket,
          Key: finalKey,
          UploadId: s3UploadId,
          MultipartUpload: { Parts: parts },
        }),
      );

      // Step 4: Clean up temp parts
      const tmpPrefix = pkey(`tmp/${payload.uploadId}/`);
      let continuationToken: string | undefined;
      do {
        const listResult = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: tmpPrefix,
            ...(continuationToken ? { ContinuationToken: continuationToken } : {}),
          }),
        );
        const keys = (listResult.Contents ?? []).map((o) => o.Key!);
        if (keys.length > 0) {
          await Promise.all(keys.map((Key) => client.send(new DeleteObjectCommand({ Bucket: bucket, Key }))));
        }
        continuationToken = listResult.NextContinuationToken;
      } while (continuationToken);
    } catch (err) {
      // Abort the multipart upload on failure
      await client.send(
        new AbortMultipartUploadCommand({
          Bucket: bucket,
          Key: finalKey,
          UploadId: s3UploadId,
        }),
      ).catch(() => {});
      throw err;
    }

    return { storageKey: payload.finalStorageKey };
  }

  async openReadStream(storageKey: string): Promise<Readable> {
    const result = await getClient().send(
      new GetObjectCommand({ Bucket: BUCKET(), Key: pkey(storageKey) }),
    );
    if (!result.Body) throw new Error("S3 对象体为空");
    return result.Body as Readable;
  }

  async stat(storageKey: string): Promise<{ size: number; modifiedAt: Date }> {
    const result = await getClient().send(
      new HeadObjectCommand({ Bucket: BUCKET(), Key: pkey(storageKey) }),
    );
    return {
      size: result.ContentLength ?? 0,
      modifiedAt: result.LastModified ?? new Date(),
    };
  }

  async deletePrefix(prefix: string): Promise<void> {
    const client = getClient();
    const bucket = BUCKET();
    const Prefix = pkey(prefix);
    let continuationToken: string | undefined;
    do {
      const listResult = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix,
          ...(continuationToken ? { ContinuationToken: continuationToken } : {}),
        }),
      );
      const keys = (listResult.Contents ?? []).map((o) => o.Key!);
      if (keys.length > 0) {
        await Promise.all(keys.map((Key) => client.send(new DeleteObjectCommand({ Bucket: bucket, Key }))));
      }
      continuationToken = listResult.NextContinuationToken;
    } while (continuationToken);
  }

  async deleteObject(storageKey: string): Promise<void> {
    await getClient().send(
      new DeleteObjectCommand({ Bucket: BUCKET(), Key: pkey(storageKey) }),
    );
  }
}
