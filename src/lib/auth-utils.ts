import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import type { User } from '@/lib/types';

/**
 * 🔐 Auth Utils para API Routes
 * 
 * Utilidades para manejar autenticación en las API routes del proyecto UroVital.
 * Este proyecto usa un sistema de autenticación personalizado con localStorage
 * en lugar de NextAuth.js.
 */

/**
 * Obtener usuario autenticado desde las cookies de la sesión
 * 
 * @param request - Request de Next.js
 * @returns Usuario autenticado o null si no está autenticado
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  try {
    // Obtener el token de sesión desde las cookies
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return null;
    }

    // TODO: Implementar validación del token JWT si se usa
    // Por ahora, asumimos que el token contiene el userId
    // En un sistema real, deberías validar y decodificar el JWT
    
    // Buscar el usuario en la base de datos
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

    if (!user) {
      return null;
    }

    // Mapear el usuario de Prisma al tipo User del proyecto
    const mappedUser: User = {
      id: user.id,
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role.toLowerCase() as 'admin' | 'doctor' | 'secretaria' | 'promotora',
      status: user.status,
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl
    };

    return mappedUser;

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
  return user.role === 'admin';
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
