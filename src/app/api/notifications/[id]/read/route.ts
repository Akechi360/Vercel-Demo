import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser, createAuthErrorResponse } from '@/lib/auth-utils';
import type { NotificationApiResponse } from '@/lib/notification-types';

/**
 * 🔔 PATCH /api/notifications/[id]/read
 * 
 * Marcar notificación como leída
 * 
 * Parámetros:
 * - id: string - ID de la notificación
 * 
 * TODO: Implementar autenticación JWT si no se usa NextAuth
 * TODO: Agregar validación de entrada con Zod
 * TODO: Implementar optimistic updates en el frontend
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: notificationId } = await params;

    // Validar que el ID existe
    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID de notificación requerido' },
        { status: 400 }
      );
    }

    // Verificar que la notificación existe y pertenece al usuario
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: userId
      }
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    // Si ya está leída, no hacer nada
    if (existingNotification.isRead) {
      const response: NotificationApiResponse = {
        success: true,
        message: 'Notificación ya estaba marcada como leída',
        data: existingNotification
      };
      
      return NextResponse.json(response);
    }

    // Marcar como leída
    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId
      },
      data: {
        isRead: true,
        readAt: new Date(),
        status: 'READ'
      }
    });

    const response: NotificationApiResponse = {
      success: true,
      message: 'Notificación marcada como leída',
      data: updatedNotification
    };

    console.log(`[API] Notificación ${notificationId} marcada como leída por usuario ${userId}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Error al marcar notificación como leída:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
