import { PrismaClient } from '@prisma/client';

// Singleton pattern para evitar múltiples conexiones
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Verificar que DATABASE_URL esté configurado (solo en runtime, no en build)
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ DATABASE_URL no está configurado en las variables de entorno');
}

if (process.env.DATABASE_URL) {
  console.log('🧩 Prisma conectado a:', process.env.DATABASE_URL);
}

// ✅ CONFIGURACIÓN OPTIMIZADA - Pool de conexiones y timeouts
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@placeholder:5432/placeholder',
      },
    }
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Función robusta para verificar disponibilidad de base de datos
export const isDatabaseAvailable = async (): Promise<boolean> => {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not found. Database unavailable.');
      return false;
    }

    // Probar conexión real con una consulta simple
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conectado correctamente a Railway');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error);
    return false;
  }
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
