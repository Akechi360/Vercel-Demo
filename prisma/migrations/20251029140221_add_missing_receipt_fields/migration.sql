/*
  Warnings:

  - You are about to drop the column `doctorId` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `pacienteId` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `doctorId` on the `consultations` table. All the data in the column will be lost.
  - You are about to drop the column `pacienteId` on the `consultations` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `consultations` table. All the data in the column will be lost.
  - You are about to drop the column `pacienteId` on the `lab_results` table. All the data in the column will be lost.
  - You are about to drop the column `pacienteId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `pacienteId` on the `prescriptions` table. All the data in the column will be lost.
  - You are about to drop the column `patientId` on the `receipts` table. All the data in the column will be lost.
  - You are about to drop the column `patientId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `doctors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `patients` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdBy` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientUserId` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `consultations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientUserId` to the `consultations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientUserId` to the `lab_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientUserId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientUserId` to the `prescriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientUserId` to the `receipts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentType` to the `receipts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `receipts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientUserId` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_REMINDER', 'PAYMENT_CONFIRMATION', 'SYSTEM_ALERT', 'APPOINTMENT_CANCELLATION', 'NEW_MESSAGE', 'APPOINTMENT', 'PAYMENT_REMINDER', 'LAB_RESULT_READY', 'PRESCRIPTION_READY', 'AFFILIATION_EXPIRING', 'MAINTENANCE_NOTICE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AffiliationStatus" ADD VALUE 'ABONO';
ALTER TYPE "AffiliationStatus" ADD VALUE 'INICIAL';

-- DropForeignKey
ALTER TABLE "public"."affiliations" DROP CONSTRAINT "affiliations_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."appointments" DROP CONSTRAINT "appointments_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."appointments" DROP CONSTRAINT "appointments_pacienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."appointments" DROP CONSTRAINT "appointments_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."consultations" DROP CONSTRAINT "consultations_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."consultations" DROP CONSTRAINT "consultations_pacienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."consultations" DROP CONSTRAINT "consultations_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."lab_results" DROP CONSTRAINT "lab_results_pacienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_pacienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."prescriptions" DROP CONSTRAINT "prescriptions_pacienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."receipts" DROP CONSTRAINT "receipts_patientId_fkey";

-- AlterTable
ALTER TABLE "affiliations" ADD COLUMN     "tipoPago" TEXT;

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "doctorId",
DROP COLUMN "pacienteId",
DROP COLUMN "userId",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "doctorUserId" TEXT,
ADD COLUMN     "patientUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "consultations" DROP COLUMN "doctorId",
DROP COLUMN "pacienteId",
DROP COLUMN "userId",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "doctorUserId" TEXT,
ADD COLUMN     "patientUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "lab_results" DROP COLUMN "pacienteId",
ADD COLUMN     "archivoContenido" TEXT,
ADD COLUMN     "archivoNombre" TEXT,
ADD COLUMN     "archivoTamaño" INTEGER,
ADD COLUMN     "archivoTipo" TEXT,
ADD COLUMN     "doctorUserId" TEXT,
ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "patientUserId" TEXT NOT NULL,
ALTER COLUMN "fecha" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "pacienteId",
DROP COLUMN "userId",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "patientUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "prescriptions" DROP COLUMN "pacienteId",
ADD COLUMN     "patientUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "receipts" DROP COLUMN "patientId",
ADD COLUMN     "doctorId" TEXT,
ADD COLUMN     "patientUserId" TEXT NOT NULL,
ADD COLUMN     "paymentType" TEXT NOT NULL,
ADD COLUMN     "plan" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "createdBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "archivoContenido" TEXT,
ADD COLUMN     "archivoNombre" TEXT,
ADD COLUMN     "archivoTamaño" INTEGER,
ADD COLUMN     "archivoTipo" TEXT,
ADD COLUMN     "archivoUrl" TEXT,
ADD COLUMN     "consultationId" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "patientUserId" TEXT NOT NULL,
ALTER COLUMN "fecha" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "patientId",
ADD COLUMN     "avatarUrl" TEXT DEFAULT '/images/avatars/default-doctor.png',
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."doctors";

-- DropTable
DROP TABLE "public"."patients";

-- CreateTable
CREATE TABLE "patient_info" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "bloodType" TEXT,
    "gender" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_info" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "area" TEXT,
    "contacto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotora_info" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "areaAsignada" TEXT,
    "supervisor" TEXT,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "salario" DECIMAL(10,2),
    "comision" DECIMAL(5,2),
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotora_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secretaria_info" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "turno" TEXT,
    "supervisor" TEXT,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "salario" DECIMAL(10,2),
    "especialidades" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secretaria_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipss_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "puntaje" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "respuestas" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ipss_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_reports" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'Informe',
    "archivoNombre" TEXT,
    "archivoUrl" TEXT,
    "archivoTipo" TEXT,
    "archivoTamaño" INTEGER,
    "patientUserId" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivoContenido" TEXT,

    CONSTRAINT "consultation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "actionText" TEXT,
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT DEFAULT 'MEDIUM',

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "appointmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "paymentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "systemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_info_userId_key" ON "patient_info"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_info_cedula_key" ON "patient_info"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_info_userId_key" ON "doctor_info"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_info_cedula_key" ON "doctor_info"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "promotora_info_userId_key" ON "promotora_info"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "promotora_info_cedula_key" ON "promotora_info"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "secretaria_info_userId_key" ON "secretaria_info"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "secretaria_info_cedula_key" ON "secretaria_info"("cedula");

-- CreateIndex
CREATE INDEX "ipss_scores_userId_idx" ON "ipss_scores"("userId");

-- CreateIndex
CREATE INDEX "ipss_scores_fecha_idx" ON "ipss_scores"("fecha");

-- CreateIndex
CREATE INDEX "notifications_userId_status_idx" ON "notifications"("userId", "status");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_userId_isActive_idx" ON "device_tokens"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_preferences_userId_key" ON "user_notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "lab_results_patientUserId_idx" ON "lab_results"("patientUserId");

-- CreateIndex
CREATE INDEX "lab_results_doctorUserId_idx" ON "lab_results"("doctorUserId");

-- CreateIndex
CREATE INDEX "lab_results_estado_idx" ON "lab_results"("estado");

-- CreateIndex
CREATE INDEX "receipts_patientUserId_idx" ON "receipts"("patientUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_userId_key" ON "users"("userId");

-- AddForeignKey
ALTER TABLE "patient_info" ADD CONSTRAINT "patient_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_info" ADD CONSTRAINT "doctor_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotora_info" ADD CONSTRAINT "promotora_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secretaria_info" ADD CONSTRAINT "secretaria_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorUserId_fkey" FOREIGN KEY ("doctorUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctorUserId_fkey" FOREIGN KEY ("doctorUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_doctorUserId_fkey" FOREIGN KEY ("doctorUserId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipss_scores" ADD CONSTRAINT "ipss_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipss_scores" ADD CONSTRAINT "ipss_scores_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_reports" ADD CONSTRAINT "consultation_reports_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_reports" ADD CONSTRAINT "consultation_reports_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_reports" ADD CONSTRAINT "consultation_reports_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliations" ADD CONSTRAINT "affiliations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
