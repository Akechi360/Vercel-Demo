import { PrismaClient } from '@prisma/client';

// Singleton pattern para evitar múltiples conexiones
let prisma: PrismaClient | null = null;

// Configuración condicional de Prisma
const createPrismaClient = () => {
  // Verificar si DATABASE_URL está disponible
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not found. Using mock data mode.');
    return null;
  }

  // Si ya existe una instancia, reutilizarla
  if (prisma) {
    return prisma;
  }

  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  return prisma;
};

// Función para verificar si la base de datos está disponible
export const isDatabaseAvailable = (): boolean => {
  return prisma !== null && !!process.env.DATABASE_URL;
};

// Función para obtener el cliente de Prisma
export const getPrismaClient = () => {
  if (!isDatabaseAvailable()) {
    throw new Error('Database not available. Please configure DATABASE_URL.');
  }
  return createPrismaClient()!;
};

// Exportar la instancia por defecto
export default prisma;
