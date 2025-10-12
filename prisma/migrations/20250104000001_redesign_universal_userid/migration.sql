-- Rediseño de arquitectura con userId universal
-- Esta migración implementa el nuevo diseño con userId como clave universal

-- 1. Agregar columna userId a tabla users
ALTER TABLE "users" ADD COLUMN "userId" TEXT;

-- 2. Generar userIds únicos para usuarios existentes
UPDATE "users" SET "userId" = 'U' || LPAD(ROW_NUMBER() OVER (ORDER BY "createdAt")::TEXT, 4, '0') WHERE "userId" IS NULL;

-- 3. Hacer userId único y no nulo
ALTER TABLE "users" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_userId_key" UNIQUE ("userId");

-- 4. Crear tabla patient_info
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

-- 5. Crear tabla doctor_info
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

-- 6. Migrar datos de pacientes existentes a patient_info
INSERT INTO "patient_info" ("id", "userId", "cedula", "fechaNacimiento", "telefono", "direccion", "bloodType", "gender", "createdAt", "updatedAt")
SELECT 
    p."id",
    u."userId",
    p."cedula",
    p."fechaNacimiento",
    p."telefono",
    p."direccion",
    p."bloodType",
    p."gender",
    p."createdAt",
    p."updatedAt"
FROM "patients" p
JOIN "users" u ON u."patientId" = p."id"
WHERE u."role" = 'patient';

-- 7. Migrar datos de doctores existentes a doctor_info
INSERT INTO "doctor_info" ("id", "userId", "especialidad", "cedula", "telefono", "direccion", "area", "contacto", "createdAt", "updatedAt")
SELECT 
    d."id",
    u."userId",
    d."especialidad",
    d."cedula",
    d."telefono",
    d."direccion",
    d."area",
    d."contacto",
    d."createdAt",
    d."updatedAt"
FROM "doctors" d
JOIN "users" u ON u."email" = d."email"
WHERE u."role" = 'Doctor';

-- 8. Actualizar tabla appointments para usar userId
ALTER TABLE "appointments" ADD COLUMN "patientUserId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "doctorUserId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "createdBy" TEXT;

-- 9. Migrar datos de appointments
UPDATE "appointments" SET 
    "patientUserId" = u."userId"
FROM "users" u
WHERE "appointments"."pacienteId" = u."patientId";

UPDATE "appointments" SET 
    "doctorUserId" = u."userId"
FROM "users" u
JOIN "doctors" d ON d."id" = "appointments"."doctorId"
WHERE u."email" = d."email";

UPDATE "appointments" SET 
    "createdBy" = u."userId"
FROM "users" u
WHERE "appointments"."userId" = u."id";

-- 10. Actualizar tabla consultations para usar userId
ALTER TABLE "consultations" ADD COLUMN "patientUserId" TEXT;
ALTER TABLE "consultations" ADD COLUMN "doctorUserId" TEXT;
ALTER TABLE "consultations" ADD COLUMN "createdBy" TEXT;

-- 11. Migrar datos de consultations
UPDATE "consultations" SET 
    "patientUserId" = u."userId"
FROM "users" u
WHERE "consultations"."pacienteId" = u."patientId";

UPDATE "consultations" SET 
    "doctorUserId" = u."userId"
FROM "users" u
JOIN "doctors" d ON d."id" = "consultations"."doctorId"
WHERE u."email" = d."email";

UPDATE "consultations" SET 
    "createdBy" = u."userId"
FROM "users" u
WHERE "consultations"."userId" = u."id";

-- 12. Actualizar tabla payments para usar userId
ALTER TABLE "payments" ADD COLUMN "patientUserId" TEXT;
ALTER TABLE "payments" ADD COLUMN "createdBy" TEXT;

-- 13. Migrar datos de payments
UPDATE "payments" SET 
    "patientUserId" = u."userId"
FROM "users" u
WHERE "payments"."pacienteId" = u."patientId";

UPDATE "payments" SET 
    "createdBy" = u."userId"
FROM "users" u
WHERE "payments"."userId" = u."id";

-- 14. Actualizar tabla lab_results para usar userId
ALTER TABLE "lab_results" ADD COLUMN "patientUserId" TEXT;

-- 15. Migrar datos de lab_results
UPDATE "lab_results" SET 
    "patientUserId" = u."userId"
FROM "users" u
WHERE "lab_results"."pacienteId" = u."patientId";

-- 16. Actualizar tabla prescriptions para usar userId
ALTER TABLE "prescriptions" ADD COLUMN "patientUserId" TEXT;

-- 17. Migrar datos de prescriptions
UPDATE "prescriptions" SET 
    "patientUserId" = u."userId"
FROM "users" u
WHERE "prescriptions"."pacienteId" = u."patientId";

-- 18. Actualizar tabla receipts para usar userId
ALTER TABLE "receipts" ADD COLUMN "patientUserId" TEXT;
ALTER TABLE "receipts" ADD COLUMN "createdBy" TEXT;

-- 19. Migrar datos de receipts
UPDATE "receipts" SET 
    "patientUserId" = u."userId"
FROM "users" u
WHERE "receipts"."patientId" = u."patientId";

UPDATE "receipts" SET 
    "createdBy" = u."userId"
FROM "users" u
WHERE "receipts"."createdBy" = u."id";

-- 20. Agregar constraints de foreign key
ALTER TABLE "patient_info" ADD CONSTRAINT "patient_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_info" ADD CONSTRAINT "doctor_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- 21. Agregar constraints para las nuevas columnas
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorUserId_fkey" FOREIGN KEY ("doctorUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctorUserId_fkey" FOREIGN KEY ("doctorUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- 22. Hacer las nuevas columnas NOT NULL después de migrar datos
ALTER TABLE "appointments" ALTER COLUMN "patientUserId" SET NOT NULL;
ALTER TABLE "appointments" ALTER COLUMN "createdBy" SET NOT NULL;

ALTER TABLE "consultations" ALTER COLUMN "patientUserId" SET NOT NULL;
ALTER TABLE "consultations" ALTER COLUMN "createdBy" SET NOT NULL;

ALTER TABLE "payments" ALTER COLUMN "patientUserId" SET NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "createdBy" SET NOT NULL;

ALTER TABLE "lab_results" ALTER COLUMN "patientUserId" SET NOT NULL;

ALTER TABLE "prescriptions" ALTER COLUMN "patientUserId" SET NOT NULL;

ALTER TABLE "receipts" ALTER COLUMN "patientUserId" SET NOT NULL;
ALTER TABLE "receipts" ALTER COLUMN "createdBy" SET NOT NULL;

-- 23. Eliminar columnas obsoletas (comentado para seguridad)
-- ALTER TABLE "appointments" DROP COLUMN "pacienteId";
-- ALTER TABLE "appointments" DROP COLUMN "doctorId";
-- ALTER TABLE "appointments" DROP COLUMN "userId";

-- ALTER TABLE "consultations" DROP COLUMN "pacienteId";
-- ALTER TABLE "consultations" DROP COLUMN "doctorId";
-- ALTER TABLE "consultations" DROP COLUMN "userId";

-- ALTER TABLE "payments" DROP COLUMN "pacienteId";
-- ALTER TABLE "payments" DROP COLUMN "userId";

-- ALTER TABLE "lab_results" DROP COLUMN "pacienteId";

-- ALTER TABLE "prescriptions" DROP COLUMN "pacienteId";

-- ALTER TABLE "receipts" DROP COLUMN "patientId";

-- ALTER TABLE "users" DROP COLUMN "patientId";

-- 24. Eliminar tablas obsoletas (comentado para seguridad)
-- DROP TABLE "patients";
-- DROP TABLE "doctors";
