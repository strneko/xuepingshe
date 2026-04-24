-- AlterTable
ALTER TABLE "User" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 500;

-- CreateEnum
CREATE TYPE "ShopRedeemStatus" AS ENUM ('SUCCESS', 'CANCELED');

-- CreateTable
CREATE TABLE "ShopProduct" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "needPoints" INTEGER NOT NULL,
    "coverText" TEXT,
    "stock" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopRedeemOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSnapshotName" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "status" "ShopRedeemStatus" NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopRedeemOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopProduct_code_key" ON "ShopProduct"("code");

-- CreateIndex
CREATE INDEX "ShopProduct_isActive_needPoints_idx" ON "ShopProduct"("isActive", "needPoints");

-- CreateIndex
CREATE INDEX "ShopRedeemOrder_userId_createdAt_idx" ON "ShopRedeemOrder"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopRedeemOrder_productId_createdAt_idx" ON "ShopRedeemOrder"("productId", "createdAt");

-- AddForeignKey
ALTER TABLE "ShopRedeemOrder" ADD CONSTRAINT "ShopRedeemOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopRedeemOrder" ADD CONSTRAINT "ShopRedeemOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
