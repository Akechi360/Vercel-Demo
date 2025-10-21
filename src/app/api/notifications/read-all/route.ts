import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser, createAuthErrorResponse } from '@/lib/auth-utils';
import type { NotificationApiResponse } from '@/lib/notification-types';

/**
 * 🔔 PATCH /api/notifications/read-all
 * 
 * Marcar todas las notificaciones del usuario como leídas
 * 
 * TODO: Implementar autenticación JWT si no se usa NextAuth
 * TODO: Agregar validación de entrada con Zod
 * TODO: Implementar batch updates para mejor performance
 */

export async function PATCH(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      const errorResponse = createAuthErrorResponse();
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    }

    const userId = user.id;

    // Contar notificaciones no leídas antes de la actualización
    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    });

    // Si no hay notificaciones no leídas, retornar inmediatamente
    if (unreadCount === 0) {
      const response: NotificationApiResponse = {
        success: true,
        message: 'No hay notificaciones no leídas',
        data: { updatedCount: 0 }
      };
      
      return NextResponse.json(response);
    }

    // Marcar todas las notificaciones no leídas como leídas
    const updateResult = await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date(),
        status: 'READ'
      }
    });

    const response: NotificationApiResponse = {
      success: true,
      message: `${updateResult.count} notificaciones marcadas como leídas`,
      data: { 
        updatedCount: updateResult.count,
        previousUnreadCount: unreadCount
      }
    };

    console.log(`[API] ${updateResult.count} notificaciones marcadas como leídas para usuario ${userId}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Error al marcar todas las notificaciones como leídas:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
