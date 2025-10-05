import { PrismaClient } from '@prisma/client';

// Configuración condicional de Prisma
const createPrismaClient = () => {
  // Verificar si DATABASE_URL está disponible
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not found. Using mock data mode.');
    return null;
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
};

// Crear instancia de Prisma
const prisma = createPrismaClient();

// Función para verificar si la base de datos está disponible
export const isDatabaseAvailable = (): boolean => {
  return prisma !== null && !!process.env.DATABASE_URL;
};

// Función para obtener el cliente de Prisma
export const getPrismaClient = () => {
  if (!isDatabaseAvailable()) {
    throw new Error('Database not available. Please configure DATABASE_URL.');
  }
  return prisma!;
};

// Exportar la instancia por defecto
export default prisma;
