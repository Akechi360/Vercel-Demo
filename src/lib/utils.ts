// Todas las funciones exportadas aquí son únicas y centralizadas para evitar duplicidad de definición e importación.
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { User, UserRole } from "./types"
import { getPrismaClient, isDatabaseAvailable } from "./db"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string = ''): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Validates that a user has the expected role
 * @param user - The user to validate
 * @param expectedRole - The expected role from UserRole enum
 * @throws Error if user doesn't have the expected role
 */
export function validateUserRole(user: User, expectedRole: UserRole): void {
  if (user.role !== expectedRole) {
    throw new Error(`Usuario ${user.name} no es un ${expectedRole}. Rol actual: ${user.role}`);
  }
}

/**
 * Validates date format and ensures it's a future date
 * @param dateString - The date string to validate
 * @param fieldName - The name of the field being validated (for error messages)
 * @throws Error if date is invalid or not in the future
 */
export function validateDate(dateString: string, fieldName: string): Date {
  // Check if dateString is provided
  if (!dateString || dateString.trim() === '') {
    throw new Error(`${fieldName} es requerido`);
  }

  // Parse the date
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    throw new Error(`${fieldName} tiene un formato inválido. Use el formato YYYY-MM-DD`);
  }

  // Check if date is in the future
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (inputDate < today) {
    throw new Error(`${fieldName} debe ser una fecha futura. Fecha proporcionada: ${dateString}`);
  }

  // Check if date is too far in the future (more than 1 year)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (date > oneYearFromNow) {
    throw new Error(`${fieldName} no puede ser más de un año en el futuro. Fecha proporcionada: ${dateString}`);
  }

  return date;
}

/**
 * Centralized database error handler for consistent error messages
 */
export class DatabaseErrorHandler {
  /**
   * Handles Prisma and database errors with consistent messaging
   * @param error - The error to handle (can be any type)
   * @param context - Context where the error occurred (e.g., 'crear cita', 'actualizar paciente')
   * @throws Error with user-friendly message
   */
  static handle(error: unknown, context: string): never {
    // Handle non-Error objects
    if (!(error instanceof Error)) {
      throw new Error(`Error inesperado al ${context}`);
    }

    const errorMessage = error.message || 'Error desconocido';
    
    // Handle Prisma error codes
    if ('code' in error) {
      const errorCode = (error as any).code;
      
      switch (errorCode) {
        case 'P2002':
          throw new Error('Ya existe un registro con estos datos. Verifique la información e intente nuevamente.');
          
        case 'P2003':
          throw new Error('Error de referencia: El registro relacionado no existe. Verifique que todos los datos sean válidos.');
          
        case 'P2025':
          throw new Error('El registro que intenta modificar no existe.');
          
        case 'P2014':
          throw new Error('Error de relación: No se puede realizar esta operación debido a restricciones de datos.');
          
        // Add more Prisma error codes as needed
      }
    }
    
    // Handle connection errors
    if (errorMessage.toLowerCase().includes('connect') || 
        errorMessage.toLowerCase().includes('connection') ||
        errorMessage.toLowerCase().includes('conexión')) {
      throw new Error('Error de conexión a la base de datos. Verifique la configuración e intente nuevamente.');
    }
    
    // Handle foreign key constraint errors
    if (errorMessage.includes('Foreign key constraint') || 
        errorMessage.includes('clave foránea') ||
        errorMessage.includes('referential integrity')) {
      throw new Error('Error de referencia: Los datos relacionados no existen. Verifique la información.');
    }
    
    // Handle unique constraint errors
    if (errorMessage.includes('Unique constraint failed') || 
        errorMessage.includes('restricción única') ||
        errorMessage.includes('duplicate key')) {
      throw new Error('Ya existe un registro con estos datos. Verifique la información e intente nuevamente.');
    }
    
    // Handle validation errors
    if (errorMessage.toLowerCase().includes('required') || 
        errorMessage.toLowerCase().includes('obligatorio') ||
        errorMessage.toLowerCase().includes('validat')) {
      throw new Error('Faltan campos requeridos o son inválidos. Complete toda la información necesaria.');
    }
    
    // Handle permission errors
    if (errorMessage.toLowerCase().includes('permission') || 
        errorMessage.toLowerCase().includes('permiso') ||
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('forbidden')) {
      throw new Error('No tiene permisos para realizar esta acción.');
    }
    
    // Handle timeout errors
    if (errorMessage.toLowerCase().includes('timeout') || 
        errorMessage.toLowerCase().includes('tiempo de espera') ||
        errorMessage.toLowerCase().includes('timed out')) {
      throw new Error('La operación tardó demasiado tiempo. Intente nuevamente.');
    }
    
    // Handle generic database errors
    if (errorMessage.toLowerCase().includes('database') || 
        errorMessage.toLowerCase().includes('base de datos') ||
        errorMessage.toLowerCase().includes('prisma')) {
      throw new Error('Error en la base de datos. Intente nuevamente más tarde.');
    }
    
    // Re-throw known custom errors that should be shown as-is
    if (errorMessage.includes('no encontrado') || 
        errorMessage.includes('no es un') || 
        errorMessage.includes('Ya existe') ||
        errorMessage.includes('no encontrada')) {
      throw error;
    }
    
    // Fallback for unknown errors
    throw new Error(`Error al ${context}: ${errorMessage}`);
  }
}

/**
 * Wraps database operations in transactions for atomicity
 * @param operation - The database operation to execute
 * @param fallbackValue - Optional fallback value if database is unavailable
 * @returns Promise with the operation result
 */
export async function withTransaction<T>(
  operation: (tx: any) => Promise<T>,
  fallbackValue?: T
): Promise<T> {
  // During build time, use fallback if available
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    console.log('Build time - using fallback value');
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    return [] as T;
  }

  const isAvailable = await isDatabaseAvailable();
  if (!isAvailable) {
    console.log('Database not available - using fallback value');
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    throw new Error('Base de datos no configurada');
  }

  const prisma = getPrismaClient();
  
  try {
    // ✅ CONFIGURACIÓN OPTIMIZADA - Timeout y validaciones mínimas
    return await prisma.$transaction(async (tx) => {
      // Validación mínima para performance
      if (!tx.user || !tx.consultation) {
        throw new Error('Modelos requeridos no disponibles en la transacción');
      }
      
      console.log('✅ Cliente de transacción validado correctamente');
      
      return await operation(tx);
    }, {
      timeout: 10000, // ✅ 10 segundos timeout
      isolationLevel: 'ReadCommitted' // ✅ Nivel de aislamiento optimizado
    });
  } catch (error) {
    DatabaseErrorHandler.handle(error, 'ejecutar transacción');
  }
}

