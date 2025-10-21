#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function markNotificationsAsUnread() {
  console.log('📝 Marcando algunas notificaciones como NO leídas...');
  
  try {
    // Obtener el usuario backdoor
    const user = await prisma.user.findUnique({
      where: { email: 'dev-master-mguwx79b@urovital.com' }
    });

    if (!user) {
      console.error('❌ Usuario no encontrado');
      process.exit(1);
    }

    console.log(`👤 Usuario encontrado: ${user.email} (${user.id})`);

    // Obtener las notificaciones del usuario
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5 // Tomar las 5 más recientes
    });

    console.log(`📬 Encontradas ${notifications.length} notificaciones`);

    if (notifications.length === 0) {
      console.log('⚠️  No hay notificaciones para este usuario');
      process.exit(0);
    }

    // Marcar las primeras 3 como NO leídas
    const notificationsToUpdate = notifications.slice(0, 3);
    
    console.log(`🔄 Marcando ${notificationsToUpdate.length} notificaciones como NO leídas...`);

    for (const notification of notificationsToUpdate) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          isRead: false,
          readAt: null
        }
      });
      console.log(`  ✓ ${notification.title} - NO leída`);
    }

    console.log('\n✅ Proceso completado!');
    console.log(`📊 ${notificationsToUpdate.length} notificaciones marcadas como NO leídas`);
    console.log('\n🔔 Ahora recarga la aplicación para ver el contador de notificaciones no leídas');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

markNotificationsAsUnread();

