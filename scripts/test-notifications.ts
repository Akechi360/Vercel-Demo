/**
 * Script de prueba para el sistema de notificaciones
 * 
 * Este script crea notificaciones de prueba y verifica que la API funcione correctamente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestNotifications() {
  try {
    console.log('🧪 Creando notificaciones de prueba...');

    // Buscar un usuario admin para las pruebas
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (!adminUser) {
      console.error('❌ No se encontró usuario admin para las pruebas');
      return;
    }

    console.log(`✅ Usuario admin encontrado: ${adminUser.name} (${adminUser.id})`);

    // Crear notificaciones de prueba
    const testNotifications = [
      {
        userId: adminUser.id,
        type: 'APPOINTMENT_REMINDER' as const,
        channel: 'IN_APP' as const,
        status: 'SENT' as const,
        title: 'Recordatorio de cita médica',
        message: 'Tienes una cita programada para mañana a las 10:00 AM',
        priority: 'MEDIUM',
        isRead: false,
        actionUrl: '/appointments',
        actionText: 'Ver citas'
      },
      {
        userId: adminUser.id,
        type: 'SYSTEM_ALERT' as const,
        channel: 'IN_APP' as const,
        status: 'SENT' as const,
        title: 'Actualización del sistema',
        message: 'Se ha actualizado el sistema de notificaciones',
        priority: 'LOW',
        isRead: false,
        actionUrl: '/settings',
        actionText: 'Ver configuración'
      },
      {
        userId: adminUser.id,
        type: 'PAYMENT_CONFIRMATION' as const,
        channel: 'IN_APP' as const,
        status: 'SENT' as const,
        title: 'Pago confirmado',
        message: 'Tu pago de $150.00 ha sido procesado exitosamente',
        priority: 'HIGH',
        isRead: true,
        readAt: new Date(),
        actionUrl: '/finanzas',
        actionText: 'Ver finanzas'
      }
    ];

    // Eliminar notificaciones existentes del usuario
    await prisma.notification.deleteMany({
      where: {
        userId: adminUser.id
      }
    });

    console.log('🗑️ Notificaciones anteriores eliminadas');

    // Crear las nuevas notificaciones
    for (const notification of testNotifications) {
      await prisma.notification.create({
        data: notification
      });
    }

    console.log(`✅ ${testNotifications.length} notificaciones de prueba creadas`);

    // Verificar las notificaciones creadas
    const createdNotifications = await prisma.notification.findMany({
      where: {
        userId: adminUser.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📋 Notificaciones creadas:');
    createdNotifications.forEach((notification, index) => {
      console.log(`${index + 1}. ${notification.title} (${notification.isRead ? 'Leída' : 'No leída'})`);
    });

    const unreadCount = createdNotifications.filter(n => !n.isRead).length;
    console.log(`\n📊 Total: ${createdNotifications.length} notificaciones, ${unreadCount} no leídas`);

    console.log('\n🔑 Información para pruebas:');
    console.log(`User ID: ${adminUser.id}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Role: ${adminUser.role}`);

  } catch (error) {
    console.error('❌ Error creando notificaciones de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
createTestNotifications();
