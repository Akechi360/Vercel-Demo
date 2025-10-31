-- DropIndex
DROP INDEX "public"."receipts_patientId_idx";

-- AlterTable
ALTER TABLE "receipts" ALTER COLUMN "updatedAt" DROP DEFAULT;
