/**
 * Script para crear notificaciones para el usuario actualmente logueado
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createNotificationsForCurrentUser() {
  try {
    console.log('🔔 Creando notificaciones para el usuario logueado...\n');

    // Buscar el usuario por email
    const user = await prisma.user.findFirst({
      where: {
        email: 'dev-master-mguwx79b@urovital.com'
      }
    });

    if (!user) {
      console.log('❌ No se encontró usuario con email: dev-master-mguwx79b@urovital.com');
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.name} (${user.id})`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role}`);

    // Crear 3 notificaciones de prueba
    const notifications = [
      {
        title: 'Bienvenido al sistema de notificaciones',
        message: 'Las notificaciones están funcionando correctamente',
        type: 'SYSTEM_ALERT',
        channel: 'IN_APP',
        priority: 'HIGH',
        isRead: false
      },
      {
        title: 'Nueva cita programada',
        message: 'Tienes una nueva cita programada para mañana',
        type: 'APPOINTMENT',
        channel: 'IN_APP',
        priority: 'MEDIUM',
        isRead: false
      },
      {
        title: 'Recordatorio de pago',
        message: 'Recuerda realizar el pago pendiente',
        type: 'PAYMENT_REMINDER',
        channel: 'IN_APP',
        priority: 'LOW',
        isRead: true
      }
    ];

    console.log('\n📝 Creando notificaciones...');

    for (const notificationData of notifications) {
      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          type: notificationData.type as any,
          channel: notificationData.channel as any,
          status: 'SENT',
          title: notificationData.title,
          message: notificationData.message,
          priority: notificationData.priority as any,
          isRead: notificationData.isRead,
          actionUrl: '/dashboard',
          actionText: 'Ver dashboard'
        }
      });

      console.log(`✅ Creada: ${notification.title} (${notification.isRead ? 'Leída' : 'No leída'})`);
    }

    // Verificar estado final
    const totalCount = await prisma.notification.count({
      where: { userId: user.id }
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false }
    });

    console.log(`\n📊 Estado final para ${user.name}:`);
    console.log(`   Total notificaciones: ${totalCount}`);
    console.log(`   No leídas: ${unreadCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createNotificationsForCurrentUser();
