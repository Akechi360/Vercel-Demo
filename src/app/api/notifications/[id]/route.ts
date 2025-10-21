import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser, createAuthErrorResponse } from '@/lib/auth-utils';
import type { NotificationApiResponse } from '@/lib/notification-types';

/**
 * 🔔 DELETE /api/notifications/[id]
 * 
 * Eliminar notificación
 * 
 * Parámetros:
 * - id: string - ID de la notificación
 * 
 * TODO: Implementar autenticación JWT si no se usa NextAuth
 * TODO: Agregar validación de entrada con Zod
 * TODO: Considerar soft delete en lugar de eliminación física
 */

export async function DELETE(
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

    // Eliminar la notificación
    await prisma.notification.delete({
      where: {
        id: notificationId
      }
    });

    const response: NotificationApiResponse = {
      success: true,
      message: 'Notificación eliminada exitosamente',
      data: { deletedId: notificationId }
    };

    console.log(`[API] Notificación ${notificationId} eliminada por usuario ${userId}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Error al eliminar notificación:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * 🔔 GET /api/notifications/[id]
 * 
 * Obtener notificación específica
 * 
 * TODO: Implementar si se necesita obtener detalles de una notificación específica
 */
export async function GET(
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

    // Obtener la notificación
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: userId
      }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);

  } catch (error) {
    console.error('[API] Error al obtener notificación:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
