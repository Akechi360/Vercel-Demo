import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser, createAuthErrorResponse } from '@/lib/auth-utils';
import type { NotificationFilters, GetNotificationsResponse } from '@/lib/notification-types';

/**
 * 🔔 GET /api/notifications
 * 
 * Obtener notificaciones del usuario autenticado
 * 
 * Query parameters:
 * - unreadOnly: boolean - Solo notificaciones no leídas
 * - type: string - Filtrar por tipo de notificación
 * - channel: string - Filtrar por canal
 * - limit: number - Límite de resultados (default: 20)
 * - offset: number - Offset para paginación (default: 0)
 * 
 * TODO: Implementar autenticación JWT si no se usa NextAuth
 * TODO: Agregar validación de entrada con Zod
 * TODO: Implementar cache con Redis para mejor performance
 */

export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/notifications - Iniciando...');
    
    // Obtener usuario autenticado
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      console.log('[API] GET /api/notifications - Usuario no autenticado');
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    console.log('[API] GET /api/notifications - Usuario autenticado:', user.name);

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    
    // Extraer parámetros de query
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');
    const channel = searchParams.get('channel');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validar parámetros
    if (limit > 100) {
      return NextResponse.json(
        { error: 'El límite máximo es 100' },
        { status: 400 }
      );
    }

    // Construir filtros para Prisma
    const where: any = {
      userId: userId
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (type) {
      where.type = type;
    }

    if (channel) {
      where.channel = channel;
    }

    // Obtener notificaciones con paginación
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          userId: true,
          type: true,
          channel: true,
          status: true,
          title: true,
          message: true,
          data: true,
          sentAt: true,
          readAt: true,
          createdAt: true,
          updatedAt: true,
          isRead: true,
          priority: true,
          actionUrl: true,
          actionText: true
        }
      }),
      prisma.notification.count({
        where: {
          userId: userId
        }
      }),
      prisma.notification.count({
        where: {
          userId: userId,
          isRead: false
        }
      })
    ]);

    // Formatear respuesta
    const response: GetNotificationsResponse = {
      notifications: notifications.map(notification => ({
        ...notification,
        data: notification.data as Record<string, any> | undefined,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        sentAt: notification.sentAt || undefined,
        readAt: notification.readAt || undefined,
        priority: (notification.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || undefined,
        actionUrl: notification.actionUrl || undefined,
        actionText: notification.actionText || undefined
      })),
      totalCount,
      unreadCount,
      hasMore: offset + limit < totalCount,
      nextCursor: offset + limit < totalCount ? (offset + limit).toString() : undefined
    };

    console.log(`[API] Notificaciones obtenidas para usuario ${userId}: ${notifications.length} de ${totalCount} total`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Error al obtener notificaciones:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * 🔔 POST /api/notifications
 * 
 * Crear nueva notificación (para uso interno del sistema)
 * 
 * TODO: Implementar cuando se necesite crear notificaciones desde el backend
 * TODO: Agregar validación de permisos (solo admin/sistema)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      const errorResponse = createAuthErrorResponse();
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    // TODO: Implementar creación de notificaciones
    return NextResponse.json(
      { error: 'Endpoint no implementado aún' },
      { status: 501 }
    );

  } catch (error) {
    console.error('[API] Error al crear notificación:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
