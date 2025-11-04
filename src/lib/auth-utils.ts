import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ROLES } from '@/lib/types';
import type { User } from '@/lib/types';

/**
 * 🔐 Auth Utils para API Routes
 * 
 * Utilidades para manejar autenticación en las API routes del proyecto UroVital.
 * Este proyecto usa un sistema de autenticación personalizado con localStorage
 * en lugar de NextAuth.js.
 */

/**
 * Obtener usuario autenticado desde las cookies de la sesión o headers
 * 
 * @param request - Request de Next.js
 * @returns Usuario autenticado o null si no está autenticado
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  try {
    // Método 1: Intentar obtener desde header X-User-ID (para desarrollo)
    const userIdFromHeader = request.headers.get('X-User-ID');
    
    if (userIdFromHeader) {
      console.log('[Auth] Usando autenticación por header X-User-ID:', userIdFromHeader);
      
      // ===== VERIFICAR BACKDOOR DE DESARROLLO (SIN CONSULTAR BD) =====
      if (process.env.NODE_ENV === 'development' && userIdFromHeader === 'admin-master-001') {
        console.log('[Auth] ✅ Usuario backdoor detectado - acceso concedido sin BD');
        return {
          id: 'admin-master-001',
          userId: 'admin-master-001',
          email: process.env.DEV_BACKDOOR_EMAIL || 'dev-master@urovital.com',
          name: 'Developer Master (Admin)',
          role: ROLES.ADMIN,
          status: 'ACTIVE',
          createdAt: new Date(),
          avatarUrl: null,
          password: '',
          phone: null,
          lastLogin: null
        };
      }
      
      const user = await prisma.user.findUnique({
        where: {
          id: userIdFromHeader
        },
        select: {
          id: true,
          userId: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          avatarUrl: true
        }
      });

      if (user && user.status === 'ACTIVE') {
        return {
          ...user,
          role: user.role as 'ADMIN' | 'DOCTOR' | 'USER' | 'SECRETARIA' | 'PROMOTORA',
          password: '', // No incluimos la contraseña por seguridad
          phone: null,
          lastLogin: null
        };
      }
    }

    // Método 2: Intentar obtener desde cookies de sesión
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (sessionToken) {
      console.log('[Auth] Usando autenticación por cookie session-token');
      
      const user = await prisma.user.findUnique({
        where: {
          id: sessionToken // Asumiendo que el token es el userId
        },
        select: {
          id: true,
          userId: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          avatarUrl: true
        }
      });

      if (user && user.status === 'ACTIVE') {
        return {
          ...user,
          role: user.role as 'ADMIN' | 'DOCTOR' | 'USER' | 'SECRETARIA' | 'PROMOTORA',
          password: '', // No incluimos la contraseña por seguridad
          phone: null,
          lastLogin: null
        };
      }
    }

    console.log('[Auth] No se encontró usuario autenticado');
    return null;

  } catch (error) {
    console.error('[Auth] Error al obtener usuario autenticado:', error);
    return null;
  }
}

/**
 * Middleware de autenticación para API routes
 * 
 * @param request - Request de Next.js
 * @returns Usuario autenticado o lanza error 401
 */
export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  
  return user;
}

/**
 * Verificar si el usuario tiene un rol específico
 * 
 * @param user - Usuario autenticado
 * @param requiredRole - Rol requerido
 * @returns true si el usuario tiene el rol requerido
 */
export function hasRole(user: User, requiredRole: string): boolean {
  return user.role === requiredRole;
}

/**
 * Verificar si el usuario es administrador
 * 
 * @param user - Usuario autenticado
 * @returns true si el usuario es admin
 */
export function isAdmin(user: User): boolean {
  return user.role === ROLES.ADMIN;
}

/**
 * Crear respuesta de error de autenticación
 * 
 * @param message - Mensaje de error
 * @returns NextResponse con error 401
 */
export function createAuthErrorResponse(message: string = 'No autorizado') {
  return {
    error: message,
    status: 401
  };
}

/**
 * Crear respuesta de error de autorización
 * 
 * @param message - Mensaje de error
 * @returns NextResponse con error 403
 */
export function createForbiddenErrorResponse(message: string = 'Acceso denegado') {
  return {
    error: message,
    status: 403
  };
}
