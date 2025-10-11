-- Add bloodType and gender fields to patients table
ALTER TABLE "patients" ADD COLUMN "bloodType" TEXT;
ALTER TABLE "patients" ADD COLUMN "gender" TEXT;
