/**
 * 🔐 DEVELOPMENT MIDDLEWARE
 * 
 * Middleware seguro para el backdoor de desarrollo
 * 
 * ⚠️  SECURITY WARNING:
 * - Solo activo en NODE_ENV=development
 * - Todas las operaciones son loggeadas
 * - Acceso restringido por IP (opcional)
 * - Timeout de sesión más corto
 * 
 * 🛡️  SECURITY FEATURES:
 * - Validación de entorno
 * - Logging de auditoría
 * - Restricciones de IP
 * - Timeout automático
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  isBackdoorSafe, 
  validateBackdoorCredentials, 
  isBackdoorUser,
  logBackdoorAccess,
  getBackdoorPermissions 
} from './dev-credentials';

// ===== TIPOS DE MIDDLEWARE =====
interface DevMiddlewareOptions {
  requireBackdoor?: boolean;
  logAccess?: boolean;
  allowedIPs?: string[];
  timeout?: number;
}

interface DevUserContext {
  isBackdoor: boolean;
  permissions: string[];
  sessionStart: Date;
  lastActivity: Date;
}

// ===== MIDDLEWARE PRINCIPAL =====

/**
 * Middleware de desarrollo para validar acceso backdoor
 * @param request - Request de Next.js
 * @param options - Opciones de configuración
 * @returns Response o null si debe continuar
 */
export function devMiddleware(
  request: NextRequest, 
  options: DevMiddlewareOptions = {}
): NextResponse | null {
  
  // Solo procesar en desarrollo
  if (!isBackdoorSafe()) {
    return null; // Continuar normalmente
  }
  
  const {
    requireBackdoor = false,
    logAccess = true,
    allowedIPs = [],
    timeout = 30 * 60 * 1000 // 30 minutos
  } = options;
  
  // Obtener IP del cliente
  const clientIP = getClientIP(request);
  
  // Verificar IP permitida (si se especifica)
  if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
    if (logAccess) {
      logBackdoorAccess('IP_BLOCKED', { 
        ip: clientIP, 
        allowedIPs,
        path: request.nextUrl.pathname 
      });
    }
    return NextResponse.json(
      { error: 'Access denied' }, 
      { status: 403 }
    );
  }
  
  // Verificar timeout de sesión
  const sessionData = getSessionData(request);
  if (sessionData && isSessionExpired(sessionData, timeout)) {
    if (logAccess) {
      logBackdoorAccess('SESSION_EXPIRED', { 
        userId: sessionData.userId,
        sessionStart: sessionData.sessionStart 
      });
    }
    clearSessionData(request);
    return NextResponse.json(
      { error: 'Session expired' }, 
      { status: 401 }
    );
  }
  
  // Log de acceso si está habilitado
  if (logAccess) {
    logBackdoorAccess('MIDDLEWARE_ACCESS', {
      path: request.nextUrl.pathname,
      method: request.method,
      ip: clientIP,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  }
  
  return null; // Continuar con la request
}

/**
 * Valida credenciales de backdoor de forma segura
 * @param email - Email del usuario
 * @param password - Password del usuario
 * @returns Resultado de la validación
 */
export function validateDevCredentials(email: string, password: string): {
  isValid: boolean;
  isBackdoor: boolean;
  permissions: string[];
  sessionData?: DevUserContext;
} {
  
  // Verificar que el backdoor esté activo
  if (!isBackdoorSafe()) {
    return {
      isValid: false,
      isBackdoor: false,
      permissions: []
    };
  }
  
  // Validar credenciales
  const isValid = validateBackdoorCredentials(email, password);
  const isBackdoor = isValid && email === (process.env.DEV_BACKDOOR_EMAIL || '[REDACTED]');
  
  if (isValid && isBackdoor) {
    logBackdoorAccess('LOGIN_SUCCESS', { email });
    
    return {
      isValid: true,
      isBackdoor: true,
      permissions: getBackdoorPermissions(),
      sessionData: {
        isBackdoor: true,
        permissions: getBackdoorPermissions(),
        sessionStart: new Date(),
        lastActivity: new Date()
      }
    };
  }
  
  if (isValid) {
    logBackdoorAccess('LOGIN_SUCCESS', { email, isBackdoor: false });
  } else {
    logBackdoorAccess('LOGIN_FAILED', { email });
  }
  
  return {
    isValid,
    isBackdoor: false,
    permissions: []
  };
}

/**
 * Verifica si un usuario tiene permisos de backdoor
 * @param userId - ID del usuario
 * @param permission - Permiso a verificar
 * @returns True si tiene el permiso
 */
export function hasBackdoorPermission(userId: string, permission: string): boolean {
  if (!isBackdoorSafe() || !isBackdoorUser(userId)) {
    return false;
  }
  
  const permissions = getBackdoorPermissions();
  const hasPermission = permissions.includes(permission) || permissions.includes('*');
  
  if (hasPermission) {
    logBackdoorAccess('PERMISSION_CHECK', { 
      userId, 
      permission, 
      granted: true 
    });
  }
  
  return hasPermission;
}

/**
 * Middleware para rutas que requieren backdoor
 * @param request - Request de Next.js
 * @returns Response o null
 */
export function requireBackdoorAccess(request: NextRequest): NextResponse | null {
  return devMiddleware(request, { 
    requireBackdoor: true,
    logAccess: true 
  });
}

/**
 * Middleware para operaciones críticas del sistema
 * @param request - Request de Next.js
 * @param operation - Operación a realizar
 * @returns Response o null
 */
export function requireSystemAccess(
  request: NextRequest, 
  operation: string
): NextResponse | null {
  
  // Verificar que sea backdoor
  const userId = getUserIdFromRequest(request);
  if (!userId || !isBackdoorUser(userId)) {
    logBackdoorAccess('SYSTEM_ACCESS_DENIED', { 
      operation, 
      userId,
      ip: getClientIP(request) 
    });
    
    return NextResponse.json(
      { error: 'System access denied' }, 
      { status: 403 }
    );
  }
  
  // Verificar permiso específico
  if (!hasBackdoorPermission(userId, `system:${operation}`)) {
    logBackdoorAccess('SYSTEM_PERMISSION_DENIED', { 
      operation, 
      userId 
    });
    
    return NextResponse.json(
      { error: 'Insufficient permissions' }, 
      { status: 403 }
    );
  }
  
  logBackdoorAccess('SYSTEM_ACCESS_GRANTED', { 
    operation, 
    userId 
  });
  
  return null;
}

// ===== FUNCIONES AUXILIARES =====

/**
 * Obtiene la IP del cliente
 * @param request - Request de Next.js
 * @returns IP del cliente
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return (request as any).ip || '127.0.0.1';
}

/**
 * Obtiene datos de sesión del request
 * @param request - Request de Next.js
 * @returns Datos de sesión o null
 */
function getSessionData(request: NextRequest): any {
  // Implementar lógica de sesión según tu sistema
  // Por ejemplo, usando cookies o headers
  const sessionCookie = request.cookies.get('dev-session');
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Verifica si la sesión ha expirado
 * @param sessionData - Datos de la sesión
 * @param timeout - Timeout en milisegundos
 * @returns True si ha expirado
 */
function isSessionExpired(sessionData: any, timeout: number): boolean {
  if (!sessionData.lastActivity) {
    return true;
  }
  
  const now = new Date();
  const lastActivity = new Date(sessionData.lastActivity);
  
  return (now.getTime() - lastActivity.getTime()) > timeout;
}

/**
 * Limpia datos de sesión
 * @param request - Request de Next.js
 */
function clearSessionData(request: NextRequest): void {
  // Implementar limpieza de sesión
  // Por ejemplo, eliminar cookies
}

/**
 * Obtiene el ID de usuario del request
 * @param request - Request de Next.js
 * @returns ID del usuario o null
 */
function getUserIdFromRequest(request: NextRequest): string | null {
  // Implementar según tu sistema de autenticación
  // Por ejemplo, desde headers, cookies, o JWT
  return request.headers.get('x-user-id');
}

/**
 * Crea respuesta de error para backdoor
 * @param message - Mensaje de error
 * @param status - Código de estado
 * @returns Response de error
 */
export function createBackdoorErrorResponse(
  message: string, 
  status: number = 403
): NextResponse {
  
  logBackdoorAccess('ERROR_RESPONSE', { message, status });
  
  return NextResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV 
    }, 
    { status }
  );
}
