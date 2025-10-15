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
   * @param error - The error to handle
   * @param context - Context where the error occurred (e.g., 'crear cita', 'actualizar paciente')
   * @throws Error with user-friendly message
   */
  static handle(error: any, context: string): never {
    // Prisma error codes
    if (error.code === 'P2002') {
      throw new Error('Ya existe un registro con estos datos. Verifique la información e intente nuevamente.');
    }
    
    if (error.code === 'P2003') {
      throw new Error('Error de referencia: El registro relacionado no existe. Verifique que todos los datos sean válidos.');
    }
    
    if (error.code === 'P2025') {
      throw new Error('El registro que intenta modificar no existe.');
    }
    
    if (error.code === 'P2014') {
      throw new Error('Error de relación: No se puede realizar esta operación debido a restricciones de datos.');
    }
    
    // Connection errors
    if (error.message?.includes('connect') || error.message?.includes('connection')) {
      throw new Error('Error de conexión a la base de datos. Verifique la configuración e intente nuevamente.');
    }
    
    // Foreign key constraint errors
    if (error.message?.includes('Foreign key constraint') || error.message?.includes('clave foránea')) {
      throw new Error('Error de referencia: Los datos relacionados no existen. Verifique la información.');
    }
    
    // Unique constraint errors
    if (error.message?.includes('Unique constraint failed') || error.message?.includes('restricción única')) {
      throw new Error('Ya existe un registro con estos datos. Verifique la información e intente nuevamente.');
    }
    
    // Validation errors
    if (error.message?.includes('required') || error.message?.includes('obligatorio')) {
      throw new Error('Faltan campos requeridos. Complete toda la información necesaria.');
    }
    
    // Permission errors
    if (error.message?.includes('permission') || error.message?.includes('permiso')) {
      throw new Error('No tiene permisos para realizar esta acción.');
    }
    
    // Timeout errors
    if (error.message?.includes('timeout') || error.message?.includes('tiempo de espera')) {
      throw new Error('La operación tardó demasiado tiempo. Intente nuevamente.');
    }
    
    // Generic database errors
    if (error.message?.includes('database') || error.message?.includes('base de datos')) {
      throw new Error('Error en la base de datos. Intente nuevamente más tarde.');
    }
    
    // Re-throw known custom errors
    if (error.message?.includes('no encontrado') || 
        error.message?.includes('no es un') || 
        error.message?.includes('Ya existe')) {
      throw error;
    }
    
    // Fallback for unknown errors
    throw new Error(`Error al ${context}: ${error.message || 'Error desconocido'}`);
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

