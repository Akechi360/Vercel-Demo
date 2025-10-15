-- Script de inicialización para UroVital
-- Este archivo se ejecuta automáticamente cuando se crea el contenedor

-- Crear la base de datos si no existe
CREATE DATABASE urovital;

-- Conectar a la base de datos
\c urovital;

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Mensaje de confirmación
SELECT 'Base de datos UroVital inicializada correctamente' as status;
