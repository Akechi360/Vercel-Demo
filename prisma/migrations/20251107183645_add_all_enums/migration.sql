/*
  Warnings:

  - You are about to drop the column `providerId` on the `appointments` table. All the data in the column will be lost.
  - The `estado` column on the `lab_results` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bloodType` column on the `patient_info` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `gender` column on the `patient_info` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `receipts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `providers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supplies` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `role` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'O_PLUS', 'O_MINUS', 'A_PLUS', 'A_MINUS', 'B_PLUS', 'B_MINUS', 'AB_PLUS', 'AB_MINUS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMENINO', 'OTRO');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PAGADO', 'PENDIENTE', 'CANCELADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LabResultStatus" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'PATIENT';
ALTER TYPE "UserRole" ADD VALUE 'SECRETARIA';

-- DropForeignKey
ALTER TABLE "public"."appointments" DROP CONSTRAINT "appointments_providerId_fkey";

-- DropIndex
DROP INDEX "public"."lab_results_estado_idx";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "providerId";

-- AlterTable
ALTER TABLE "doctor_info" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "lab_results" DROP COLUMN "estado",
ADD COLUMN     "estado" "LabResultStatus" NOT NULL DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "patient_info" DROP COLUMN "bloodType",
ADD COLUMN     "bloodType" "BloodType",
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender";

-- AlterTable
ALTER TABLE "receipts" DROP COLUMN "status",
ADD COLUMN     "status" "ReceiptStatus" NOT NULL DEFAULT 'PAGADO';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "status",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL;

-- DropTable
DROP TABLE "public"."providers";

-- DropTable
DROP TABLE "public"."supplies";

-- DropEnum
DROP TYPE "public"."SupplyStatus";
