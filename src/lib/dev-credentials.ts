/**
 * 🔐 DEV BACKDOOR CREDENTIALS
 * 
 * ⚠️  SECURITY WARNING: This file contains development backdoor credentials.
 * 
 * 🚨 CRITICAL SECURITY NOTES:
 * - These credentials are ONLY for development and testing
 * - NEVER use in production environments
 * - Remove or modify before production deployment
 * - Access is restricted to development mode only
 * 
 * 📋 USAGE:
 * - Only active when NODE_ENV=development
 * - IP restrictions can be added for additional security
 * - All access is logged for security auditing
 * 
 * 🛡️  SECURITY MEASURES:
 * - Credentials are not exposed to frontend
 * - No API routes expose these credentials
 * - Server-side only validation
 * - Development environment checks
 */

import { hash } from 'bcryptjs';

// ===== DESARROLLO BACKDOOR CONFIGURATION =====
export const DEV_BACKDOOR_CONFIG = {
  // Solo activo en desarrollo
  isActive: process.env.NODE_ENV === 'development',
  
  // Credenciales del backdoor (NUNCA exponer al frontend)
  credentials: {
    email: process.env.DEV_BACKDOOR_EMAIL || '[REDACTED]',
    password: process.env.DEV_BACKDOOR_PASSWORD || '[REDACTED]',
    userId: 'admin-master-001',
    role: 'superadmin' as const,
    name: 'Developer Master',
    status: 'ACTIVE' as const,
  },
  
  // Configuración de seguridad
  security: {
    // IPs permitidas (opcional, para mayor seguridad)
    allowedIPs: process.env.DEV_ALLOWED_IPS?.split(',') || ['127.0.0.1', '::1'],
    
    // Flags de debug adicionales
    debugMode: process.env.DEV_DEBUG === 'true',
    
    // Logging de acceso
    logAccess: true,
  },
  
  // Permisos especiales del backdoor
  permissions: {
    // Acceso completo a todos los módulos
    modules: ['*'],
    
    // Operaciones especiales permitidas
    operations: [
      'user:create',
      'user:update', 
      'user:delete',
      'user:impersonate',
      'system:debug',
      'system:reset',
      'database:direct',
      'cache:clear',
      'logs:view',
      'security:bypass'
    ],
    
    // Restricciones de seguridad
    restrictions: {
      // Solo en desarrollo
      environmentOnly: 'development',
      
      // Logging obligatorio
      requireLogging: true,
      
      // Timeout de sesión más corto
      sessionTimeout: 30 * 60 * 1000, // 30 minutos
    }
  }
};

// ===== FUNCIONES DE VALIDACIÓN SEGURA =====

/**
 * Valida si el backdoor está activo y es seguro usarlo
 * @returns {boolean} True si es seguro usar el backdoor
 */
export function isBackdoorSafe(): boolean {
  // Solo en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  // Verificar que no estemos en producción
  if (process.env.NODE_ENV !== 'development') {
    console.warn('🚨 SECURITY: Backdoor access attempted in production - BLOCKED');
    return false;
  }
  
  return true;
}

/**
 * Valida las credenciales del backdoor de forma segura
 * @param email - Email a validar
 * @param password - Password a validar
 * @returns {boolean} True si las credenciales son válidas
 */
export function validateBackdoorCredentials(email: string, password: string): boolean {
  // Verificar que el backdoor esté activo
  if (!isBackdoorSafe()) {
    return false;
  }
  
  // Validar credenciales
  const isValid = 
    email === DEV_BACKDOOR_CONFIG.credentials.email &&
    password === DEV_BACKDOOR_CONFIG.credentials.password;
  
  // Log de acceso (si está habilitado)
  if (DEV_BACKDOOR_CONFIG.security.logAccess) {
    console.log(`🔐 DEV BACKDOOR ACCESS: ${isValid ? 'GRANTED' : 'DENIED'} for ${email}`);
  }
  
  return isValid;
}

/**
 * Obtiene la configuración del usuario backdoor de forma segura
 * @returns {object|null} Configuración del usuario o null si no es seguro
 */
export function getBackdoorUserConfig() {
  if (!isBackdoorSafe()) {
    return null;
  }
  
  return {
    ...DEV_BACKDOOR_CONFIG.credentials,
    permissions: DEV_BACKDOOR_CONFIG.permissions,
    isBackdoor: true,
    createdAt: new Date(),
    lastAccess: new Date(),
  };
}

/**
 * Genera el hash de password para el usuario backdoor
 * @returns {Promise<string>} Hash del password
 */
export async function generateBackdoorPasswordHash(): Promise<string> {
  return await hash(DEV_BACKDOOR_CONFIG.credentials.password, 12);
}

/**
 * Verifica si un usuario es el backdoor de desarrollo
 * @param userId - ID del usuario a verificar
 * @returns {boolean} True si es el usuario backdoor
 */
export function isBackdoorUser(userId: string): boolean {
  return isBackdoorSafe() && userId === DEV_BACKDOOR_CONFIG.credentials.userId;
}

/**
 * Obtiene los permisos especiales del backdoor
 * @returns {string[]} Array de permisos especiales
 */
export function getBackdoorPermissions(): string[] {
  if (!isBackdoorSafe()) {
    return [];
  }
  
  return DEV_BACKDOOR_CONFIG.permissions.operations;
}

/**
 * Registra el acceso del backdoor para auditoría
 * @param action - Acción realizada
 * @param details - Detalles adicionales
 */
export function logBackdoorAccess(action: string, details?: any): void {
  if (!DEV_BACKDOOR_CONFIG.security.logAccess) {
    return;
  }
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    details,
    environment: process.env.NODE_ENV,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    ip: 'localhost', // En desarrollo
  };
  
  console.log('🔐 BACKDOOR ACCESS LOG:', logEntry);
  
  // En un entorno real, aquí se enviaría a un sistema de logging
  // como Winston, Pino, o un servicio externo como DataDog
}
