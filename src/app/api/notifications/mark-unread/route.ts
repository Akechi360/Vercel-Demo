import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * 🔧 ENDPOINT TEMPORAL DE DESARROLLO
 * Marca las primeras N notificaciones como NO leídas
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, count = 3 } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    console.log(`[MARK_UNREAD] Marcando ${count} notificaciones como NO leídas para usuario ${userId}`);

    // Obtener las notificaciones del usuario
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: count
    });

    if (notifications.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No hay notificaciones para este usuario' 
      });
    }

    // Marcar como NO leídas
    const updated = await prisma.notification.updateMany({
      where: {
        id: { in: notifications.map(n => n.id) }
      },
      data: {
        isRead: false,
        readAt: null
      }
    });

    console.log(`[MARK_UNREAD] ${updated.count} notificaciones marcadas como NO leídas`);

    return NextResponse.json({
      success: true,
      updated: updated.count,
      message: `${updated.count} notificaciones marcadas como NO leídas`
    });

  } catch (error) {
    console.error('[MARK_UNREAD] Error:', error);
    return NextResponse.json(
      { error: 'Error al marcar notificaciones' },
      { status: 500 }
    );
  }
}

