-- Migración: Normalizar y convertir role a enum UserRole 
-- Fecha: 2025-11-03 
-- Objetivo: Convertir users.role de text a enum sin perder datos 

-- PASO 1: Normalizar valores existentes a UPPERCASE 
UPDATE users SET role = 'ADMIN' WHERE LOWER(role) = 'admin'; 
UPDATE users SET role = 'DOCTOR' WHERE LOWER(role) = 'doctor'; 
UPDATE users SET role = 'USER' WHERE LOWER(role) = 'user'; 
UPDATE users SET role = 'PROMOTORA' WHERE LOWER(role) = 'promotora'; 

-- PASO 2: Crear el tipo enum UserRole en PostgreSQL 
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DOCTOR', 'USER', 'PROMOTORA'); 

-- PASO 3: Convertir la columna role de text a UserRole usando CAST 
ALTER TABLE users 
  ALTER COLUMN role TYPE "UserRole" 
  USING role::"UserRole"; 

-- PASO 4 (Opcional): Verificar que todos los valores se convirtieron correctamente 
-- SELECT role, COUNT(*) FROM users GROUP BY role;