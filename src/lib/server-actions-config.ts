/**
 * Configuración para Server Actions de Next.js
 * Asegura que las Server Actions funcionen correctamente en todos los entornos
 */

// Generar clave de encriptación para Server Actions
// Comando para generar: openssl rand -base64 32
export const SERVER_ACTIONS_CONFIG = {
  // Clave de encriptación para Server Actions (32 caracteres base64)
  encryptionKey: process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY || 'default-key-for-development-only',
  
  // Configuración de Skew Protection para Vercel
  skewProtection: {
    enabled: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 horas en segundos
  },
  
  // Configuración de cache para Server Actions
  cache: {
    enabled: true,
    maxAge: 5 * 60, // 5 minutos
  },
  
  // Configuración de validación
  validation: {
    strictMode: process.env.NODE_ENV === 'production',
    logErrors: process.env.NODE_ENV === 'development',
  }
};

/**
 * Verificar que la configuración de Server Actions esté correcta
 */
export function validateServerActionsConfig(): boolean {
  const issues: string[] = [];
  
  // Verificar clave de encriptación
  if (!process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY) {
    issues.push('NEXT_SERVER_ACTIONS_ENCRYPTION_KEY no está definida');
  } else if (process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY === 'default-key-for-development-only') {
    issues.push('NEXT_SERVER_ACTIONS_ENCRYPTION_KEY está usando valor por defecto (no seguro para producción)');
  }
  
  // Verificar longitud de la clave
  if (process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY && 
      process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY.length < 32) {
    issues.push('NEXT_SERVER_ACTIONS_ENCRYPTION_KEY debe tener al menos 32 caracteres');
  }
  
  if (issues.length > 0) {
    console.warn('⚠️ Problemas de configuración de Server Actions:');
    issues.forEach(issue => console.warn(`  - ${issue}`));
    return false;
  }
  
  console.log('✅ Configuración de Server Actions válida');
  return true;
}

/**
 * Generar clave de encriptación segura para Server Actions
 */
export function generateEncryptionKey(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Configuración para diferentes entornos
 */
export const ENVIRONMENT_CONFIG = {
  development: {
    encryptionKey: 'development-key-not-secure',
    skewProtection: false,
    cache: false,
    validation: {
      strictMode: false,
      logErrors: true,
    }
  },
  
  production: {
    encryptionKey: process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,
    skewProtection: true,
    cache: true,
    validation: {
      strictMode: true,
      logErrors: false,
    }
  }
};

/**
 * Obtener configuración para el entorno actual
 */
export function getCurrentConfig() {
  const env = process.env.NODE_ENV || 'development';
  return ENVIRONMENT_CONFIG[env as keyof typeof ENVIRONMENT_CONFIG] || ENVIRONMENT_CONFIG.development;
}
