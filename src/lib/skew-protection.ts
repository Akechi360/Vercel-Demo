/**
 * Configuración de Skew Protection para Vercel
 * Mitiga problemas entre deploys y asegura consistencia de Server Actions
 */

export interface SkewProtectionConfig {
  enabled: boolean;
  maxAge: number;
  fallbackStrategy: 'error' | 'retry' | 'ignore';
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Configuración por defecto para Skew Protection
 */
export const DEFAULT_SKEW_PROTECTION_CONFIG: SkewProtectionConfig = {
  enabled: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24, // 24 horas en segundos
  fallbackStrategy: 'retry',
  retryAttempts: 3,
  retryDelay: 1000, // 1 segundo
};

/**
 * Verificar si Skew Protection está habilitado
 */
export function isSkewProtectionEnabled(): boolean {
  return process.env.NODE_ENV === 'production' && 
         process.env.VERCEL === '1' &&
         process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY !== undefined;
}

/**
 * Obtener configuración de Skew Protection
 */
export function getSkewProtectionConfig(): SkewProtectionConfig {
  return {
    enabled: isSkewProtectionEnabled(),
    maxAge: parseInt(process.env.SKEW_PROTECTION_MAX_AGE || '86400'),
    fallbackStrategy: (process.env.SKEW_PROTECTION_FALLBACK as any) || 'retry',
    retryAttempts: parseInt(process.env.SKEW_PROTECTION_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.SKEW_PROTECTION_RETRY_DELAY || '1000'),
  };
}

/**
 * Wrapper para Server Actions con Skew Protection
 */
export function withSkewProtection<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  config: SkewProtectionConfig = DEFAULT_SKEW_PROTECTION_CONFIG
) {
  return async (...args: T): Promise<R> => {
    if (!config.enabled) {
      return await action(...args);
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < config.retryAttempts; attempt++) {
      try {
        return await action(...args);
      } catch (error) {
        lastError = error as Error;
        
        // Verificar si es un error de skew
        if (isSkewError(error)) {
          console.warn(`🔄 Skew Protection: Reintentando Server Action (intento ${attempt + 1}/${config.retryAttempts})`);
          
          if (attempt < config.retryAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, config.retryDelay));
            continue;
          }
        }
        
        // Si no es un error de skew o se agotaron los intentos, lanzar el error
        throw error;
      }
    }
    
    throw lastError || new Error('Server Action falló después de múltiples intentos');
  };
}

/**
 * Verificar si un error es causado por skew
 */
function isSkewError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';
  
  // Errores comunes de skew en Server Actions
  const skewErrorPatterns = [
    'failed to find server action',
    'server action not found',
    'action id mismatch',
    'encryption key mismatch',
    'skew protection',
    'deployment mismatch'
  ];
  
  return skewErrorPatterns.some(pattern => 
    errorMessage.includes(pattern) || errorCode.includes(pattern)
  );
}

/**
 * Middleware para detectar y manejar errores de skew
 */
export function createSkewProtectionMiddleware() {
  return async (req: any, res: any, next: any) => {
    try {
      await next();
    } catch (error) {
      if (isSkewError(error)) {
        console.warn('🔄 Skew Protection: Error de skew detectado, aplicando estrategia de fallback');
        
        // Aplicar estrategia de fallback
        const config = getSkewProtectionConfig();
        
        switch (config.fallbackStrategy) {
          case 'retry':
            // El retry se maneja en withSkewProtection
            throw error;
            
          case 'error':
            res.status(503).json({
              error: 'Service temporarily unavailable due to deployment skew',
              retryAfter: config.maxAge
            });
            return;
            
          case 'ignore':
            console.warn('⚠️ Skew Protection: Ignorando error de skew');
            return;
        }
      }
      
      throw error;
    }
  };
}

/**
 * Verificar estado de Skew Protection
 */
export function checkSkewProtectionStatus(): {
  enabled: boolean;
  config: SkewProtectionConfig;
  environment: string;
  vercel: boolean;
  encryptionKey: boolean;
} {
  const config = getSkewProtectionConfig();
  
  return {
    enabled: config.enabled,
    config,
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    encryptionKey: !!process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
  };
}

/**
 * Log de estado de Skew Protection
 */
export function logSkewProtectionStatus(): void {
  const status = checkSkewProtectionStatus();
  
  console.log('🔍 Skew Protection Status:');
  console.log(`  Enabled: ${status.enabled}`);
  console.log(`  Environment: ${status.environment}`);
  console.log(`  Vercel: ${status.vercel}`);
  console.log(`  Encryption Key: ${status.encryptionKey}`);
  console.log(`  Max Age: ${status.config.maxAge}s`);
  console.log(`  Fallback Strategy: ${status.config.fallbackStrategy}`);
  console.log(`  Retry Attempts: ${status.config.retryAttempts}`);
}
