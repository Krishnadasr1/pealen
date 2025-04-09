-- AlterTable
ALTER TABLE "Videos" ADD COLUMN     "muxAssetId" TEXT,
ADD COLUMN     "muxUploadId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';
