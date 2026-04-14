-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('INIT', 'UPLOADING', 'MERGING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "UploadPartStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED');

-- CreateEnum
CREATE TYPE "ResourceStorageType" AS ENUM ('LOCAL_DISK', 'S3', 'OSS', 'COS', 'MINIO');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('ACTIVE', 'DELETED');

-- CreateTable
CREATE TABLE "ResourceUploadSession" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "chunkSize" INTEGER NOT NULL,
    "totalChunks" INTEGER NOT NULL,
    "wholeFileHash" TEXT NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'INIT',
    "uploadedChunks" INTEGER NOT NULL DEFAULT 0,
    "storageType" "ResourceStorageType" NOT NULL DEFAULT 'LOCAL_DISK',
    "storageBucket" TEXT,
    "tempObjectPrefix" TEXT NOT NULL,
    "resourceId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceUploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceUploadPart" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "partNumber" INTEGER NOT NULL,
    "chunkHash" TEXT NOT NULL,
    "chunkSize" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "etag" TEXT,
    "status" "UploadPartStatus" NOT NULL DEFAULT 'UPLOADED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceUploadPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseResource" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageType" "ResourceStorageType" NOT NULL DEFAULT 'LOCAL_DISK',
    "storageBucket" TEXT,
    "storageKey" TEXT NOT NULL,
    "wholeFileHash" TEXT NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceDedupeIndex" (
    "id" TEXT NOT NULL,
    "hashType" TEXT NOT NULL,
    "hashValue" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceDedupeIndex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceUploadSession_uploadId_key" ON "ResourceUploadSession"("uploadId");

-- CreateIndex
CREATE INDEX "ResourceUploadSession_courseId_status_idx" ON "ResourceUploadSession"("courseId", "status");

-- CreateIndex
CREATE INDEX "ResourceUploadSession_userId_createdAt_idx" ON "ResourceUploadSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceUploadSession_wholeFileHash_fileSize_idx" ON "ResourceUploadSession"("wholeFileHash", "fileSize");

-- CreateIndex
CREATE INDEX "ResourceUploadPart_uploadId_status_idx" ON "ResourceUploadPart"("uploadId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceUploadPart_uploadId_partNumber_key" ON "ResourceUploadPart"("uploadId", "partNumber");

-- CreateIndex
CREATE INDEX "CourseResource_courseId_createdAt_idx" ON "CourseResource"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "CourseResource_wholeFileHash_fileSize_idx" ON "CourseResource"("wholeFileHash", "fileSize");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceDedupeIndex_hashType_hashValue_fileSize_key" ON "ResourceDedupeIndex"("hashType", "hashValue", "fileSize");

-- AddForeignKey
ALTER TABLE "ResourceUploadSession" ADD CONSTRAINT "ResourceUploadSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUploadSession" ADD CONSTRAINT "ResourceUploadSession_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "CourseResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUploadPart" ADD CONSTRAINT "ResourceUploadPart_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "ResourceUploadSession"("uploadId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseResource" ADD CONSTRAINT "CourseResource_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceDedupeIndex" ADD CONSTRAINT "ResourceDedupeIndex_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "CourseResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
