'use server'

import { prisma } from '@/lib/db'

/**
 * 🔔 Servicio Central de Notificaciones UroVital
 * 
 * Maneja la creación automática de notificaciones para eventos del sistema.
 */

import type { NotificationType, NotificationChannel } from '@prisma/client'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  channel: NotificationChannel
  title: string
  message: string
  priority?: string
  actionUrl?: string
  actionText?: string
  data?: any
}

/**
 * Crea una notificación en la base de datos
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        channel: params.channel,
        status: 'SENT',
        title: params.title,
        message: params.message,
        priority: params.priority || 'MEDIUM',
        actionUrl: params.actionUrl,
        actionText: params.actionText,
        data: params.data,
        isRead: false,
        sentAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log('[NOTIFICATIONS] ✅ Creada:', notification.id, 'para usuario:', params.userId)
    return notification
  } catch (error) {
    console.error('[NOTIFICATIONS] ❌ Error:', error)
    throw error
  }
}

/**
 * 🗓️ EVENTO: Nueva Cita Agendada
 * 
 * Notifica al doctor asignado y a todos los administradores.
 */
export async function notifyNewAppointment(appointmentId: string) {
  try {
    console.log('[NOTIFICATIONS] 📅 Nueva cita:', appointmentId)
    
    // Obtener datos de la cita con relaciones
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, name: true, userId: true } },
        doctor: { select: { id: true, name: true, userId: true } }
      }
    })
    
    if (!appointment) {
      console.log('[NOTIFICATIONS] ⚠️ Cita no encontrada')
      return
    }
    
    const patientName = appointment.patient.name
    const fechaHora = `${new Date(appointment.fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })} a las ${appointment.hora}`
    
    // 1️⃣ Notificar al DOCTOR (si está asignado)
    if (appointment.doctor && appointment.doctorUserId) {
      await createNotification({
        userId: appointment.doctor.id, // ✅ Usar User.id (CUID), NO userId (custom)
        type: 'APPOINTMENT',
        channel: 'IN_APP',
        title: 'Nueva cita agendada',
        message: `El paciente ${patientName} ha agendado una cita para el ${fechaHora}`,
        priority: 'HIGH',
        actionUrl: `/appointments/${appointmentId}`,
        actionText: 'Ver cita',
        data: { appointmentId, patientName, fecha: appointment.fecha }
      })
      console.log('[NOTIFICATIONS] ✅ Doctor notificado:', appointment.doctor.name)
    }
    
    // 2️⃣ Notificar a ADMINISTRADORES
    const admins = await prisma.user.findMany({
      where: { 
        role: 'ADMIN',
        status: 'ACTIVE'
      },
      select: { id: true, name: true }
    })
    
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'APPOINTMENT',
        channel: 'IN_APP',
        title: 'Nueva cita en el sistema',
        message: `Cita: ${patientName} ${appointment.doctor ? `con Dr. ${appointment.doctor.name}` : '(sin doctor asignado)'}`,
        priority: 'MEDIUM',
        actionUrl: `/appointments`,
        actionText: 'Ver citas'
      })
    }
    
    console.log(`[NOTIFICATIONS] ✅ ${admins.length} administradores notificados`)
    
  } catch (error) {
    console.error('[NOTIFICATIONS] ❌ Error en notifyNewAppointment:', error)
  }
}

