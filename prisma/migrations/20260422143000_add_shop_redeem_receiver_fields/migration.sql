-- AlterTable
ALTER TABLE "ShopRedeemOrder"
ADD COLUMN "receiverName" TEXT,
ADD COLUMN "receiverPhone" TEXT,
ADD COLUMN "receiverAddress" TEXT,
ADD COLUMN "remark" TEXT;

-- Backfill existing rows for non-nullable conversion
UPDATE "ShopRedeemOrder"
SET
  "receiverName" = COALESCE("receiverName", '未填写'),
  "receiverPhone" = COALESCE("receiverPhone", '00000000000'),
  "receiverAddress" = COALESCE("receiverAddress", '未填写');

-- Enforce required fields for new and existing records
ALTER TABLE "ShopRedeemOrder"
ALTER COLUMN "receiverName" SET NOT NULL,
ALTER COLUMN "receiverPhone" SET NOT NULL,
ALTER COLUMN "receiverAddress" SET NOT NULL;