-- Script SQL para crear todas las tablas de UroVital en Neon
-- Ejecuta este script completo en el SQL Editor de Neon

-- Crear Enums
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DOCTOR', 'USER', 'PROMOTORA');
CREATE TYPE "AppointmentType" AS ENUM ('CONSULTA', 'SEGUIMIENTO', 'URGENCIA', 'PROCEDIMIENTO');
CREATE TYPE "AppointmentStatus" AS ENUM ('PROGRAMADA', 'CONFIRMADA', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO');
CREATE TYPE "PaymentType" AS ENUM ('CONSULTA_GENERAL', 'CONSULTA_SEGUIMIENTO', 'AFILIACION_ANUAL', 'ESTUDIO_LABORATORIO', 'PROCEDIMIENTO_MENOR');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDIENTE', 'PAGADO', 'CANCELADO', 'REEMBOLSADO');
CREATE TYPE "AffiliationStatus" AS ENUM ('ACTIVA', 'INACTIVA', 'SUSPENDIDA', 'VENCIDA');
CREATE TYPE "SupplyStatus" AS ENUM ('DISPONIBLE', 'AGOTADO', 'VENCIDO', 'RESERVADO');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- Crear tabla users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "phone" TEXT,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Crear tabla patients
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- Crear tabla doctors
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "area" TEXT,
    "contacto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- Crear tabla companies
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rif" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "contacto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- Crear tabla providers
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- Crear tabla appointments
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora" TEXT NOT NULL,
    "tipo" "AppointmentType" NOT NULL,
    "estado" "AppointmentStatus" NOT NULL DEFAULT 'PROGRAMADA',
    "notas" TEXT,
    "pacienteId" TEXT NOT NULL,
    "doctorId" TEXT,
    "providerId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- Crear tabla consultations
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "sintomas" TEXT,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "observaciones" TEXT,
    "pacienteId" TEXT NOT NULL,
    "doctorId" TEXT,
    "appointmentId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- Crear tabla lab_results
CREATE TABLE "lab_results" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "valores" JSONB,
    "fecha" TIMESTAMP(3) NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "consultationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- Crear tabla prescriptions
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "medicamento" TEXT NOT NULL,
    "dosis" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL,
    "duracion" TEXT,
    "instrucciones" TEXT,
    "pacienteId" TEXT NOT NULL,
    "consultationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- Crear tabla payments
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "tipo" "PaymentType" NOT NULL,
    "metodo" TEXT NOT NULL,
    "estado" "PaymentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "fecha" TIMESTAMP(3) NOT NULL,
    "referencia" TEXT,
    "notas" TEXT,
    "pacienteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- Crear tabla affiliations
CREATE TABLE "affiliations" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "estado" "AffiliationStatus" NOT NULL DEFAULT 'ACTIVA',
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "monto" DECIMAL(10,2) NOT NULL,
    "beneficiarios" JSONB,
    "companyId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "affiliations_pkey" PRIMARY KEY ("id")
);

-- Crear tabla supplies
CREATE TABLE "supplies" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "cantidad" INTEGER NOT NULL,
    "unidad" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "proveedor" TEXT,
    "fechaVencimiento" TIMESTAMP(3),
    "estado" "SupplyStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplies_pkey" PRIMARY KEY ("id")
);

-- Crear tabla reports
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "contenido" JSONB NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "autor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- Crear tabla estudios
CREATE TABLE "estudios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "duracion" INTEGER,
    "requisitos" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "estudios_pkey" PRIMARY KEY ("id")
);

-- Crear tabla system_config
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "clinicName" TEXT NOT NULL DEFAULT 'UroVital',
    "clinicAddress" TEXT,
    "clinicPhone" TEXT,
    "clinicEmail" TEXT,
    "workingHours" TEXT,
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "autoBackup" BOOLEAN NOT NULL DEFAULT true,
    "dataRetention" TEXT NOT NULL DEFAULT '2 años',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- Crear índices únicos
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "patients_cedula_key" ON "patients"("cedula");
CREATE UNIQUE INDEX "doctors_cedula_key" ON "doctors"("cedula");
CREATE UNIQUE INDEX "companies_rif_key" ON "companies"("rif");

-- Crear Foreign Keys
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consultations" ADD CONSTRAINT "consultations_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "affiliations" ADD CONSTRAINT "affiliations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "affiliations" ADD CONSTRAINT "affiliations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insertar configuración inicial del sistema
INSERT INTO "system_config" ("id", "clinicName", "clinicAddress", "clinicPhone", "clinicEmail", "workingHours") 
VALUES ('clinic-config-001', 'UroVital', 'Caracas, Venezuela', '+58 212 123-4567', 'info@urovital.com', 'Lunes a Viernes: 8:00 AM - 6:00 PM');

-- Insertar usuario administrador por defecto
INSERT INTO "users" ("id", "email", "name", "password", "role", "status") 
VALUES ('admin-001', 'master@urovital.com', 'Administrador', '$2a$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA', 'ADMIN', 'ACTIVE');

-- Insertar algunos estudios por defecto
INSERT INTO "estudios" ("id", "nombre", "descripcion", "tipo", "precio", "duracion", "requisitos") VALUES
('estudio-001', 'Consulta General', 'Consulta médica general de urología', 'CONSULTA', 50.00, 30, 'Ayuno no requerido'),
('estudio-002', 'Ecografía Renal', 'Ecografía de riñones y vías urinarias', 'DIAGNOSTICO', 80.00, 45, 'Vejiga llena'),
('estudio-003', 'PSA Total', 'Antígeno prostático específico', 'LABORATORIO', 25.00, 15, 'Ayuno de 8 horas'),
('estudio-004', 'Uroflujometría', 'Estudio del flujo urinario', 'FUNCIONAL', 60.00, 30, 'Vejiga llena'),
('estudio-005', 'Cistoscopia', 'Exploración endoscópica de la vejiga', 'DIAGNOSTICO', 150.00, 60, 'Ayuno de 6 horas');

-- Mensaje de confirmación
SELECT 'Base de datos UroVital creada exitosamente!' as mensaje;
