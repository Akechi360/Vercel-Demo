import { PrismaClient } from '@prisma/client';

// Singleton pattern para evitar múltiples conexiones
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Verificar que DATABASE_URL esté configurado (solo en runtime, no en build)
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ DATABASE_URL no está configurado en las variables de entorno');
}

// ⚡ CONFIGURACIÓN OPTIMIZADA - Sin logs innecesarios
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'], // Solo errores críticos, sin 'query', 'info', 'warn'
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@placeholder:5432/placeholder',
      },
    }
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ⚡ OPTIMIZADO: Verificar disponibilidad SIN queries innecesarias
// Solo valida que DATABASE_URL existe - No hace queries a BD
export const isDatabaseAvailable = (): boolean => {
  // Simplemente verificar que DATABASE_URL existe
  // No hacer queries, solo validar configuración
  return !!process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';
};

// Función para obtener el cliente de Prisma
export const getPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not found, using placeholder connection');
  }
  return prisma;
};

// Exportar la instancia por defecto
export default prisma;
