/**
 * 🔔 Notification Types
 * 
 * Definiciones de tipos TypeScript para el sistema de notificaciones de UroVital.
 * Incluye interfaces para notificaciones, preferencias de usuario y tokens de dispositivos.
 * 
 * TODO: Sincronizar con modelos de Prisma cuando se implemente el backend
 * TODO: Agregar validaciones con Zod si es necesario
 * TODO: Expandir tipos según necesidades del negocio
 */

// ===== TIPOS DE NOTIFICACIÓN =====

/**
 * Tipos de notificación disponibles en el sistema
 * TODO: Sincronizar con enum NotificationType de Prisma
 */
export type NotificationType = 
  | 'APPOINTMENT_REMINDER'
  | 'PAYMENT_CONFIRMATION'
  | 'SYSTEM_ALERT'
  | 'APPOINTMENT_CANCELLATION'
  | 'NEW_MESSAGE'
  | 'LAB_RESULT_READY'
  | 'PRESCRIPTION_READY'
  | 'AFFILIATION_EXPIRING'
  | 'MAINTENANCE_NOTICE';

/**
 * Canales de notificación disponibles
 * TODO: Sincronizar con enum NotificationChannel de Prisma
 */
export type NotificationChannel = 
  | 'EMAIL'
  | 'SMS'
  | 'PUSH'
  | 'IN_APP';

/**
 * Estados de notificación
 * TODO: Sincronizar con enum NotificationStatus de Prisma
 */
export type NotificationStatus = 
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED';

// ===== INTERFACES PRINCIPALES =====

/**
 * Interfaz principal para notificaciones
 * TODO: Sincronizar con modelo Notification de Prisma
 */
export interface Notification {
  /** Identificador único de la notificación */
  id: string;
  
  /** ID del usuario destinatario */
  userId: string;
  
  /** Tipo de notificación */
  type: NotificationType;
  
  /** Canal por el cual se envió/recibió */
  channel: NotificationChannel;
  
  /** Estado actual de la notificación */
  status: NotificationStatus;
  
  /** Título de la notificación */
  title: string;
  
  /** Mensaje o contenido de la notificación */
  message: string;
  
  /** Datos adicionales en formato JSON (opcional) */
  data?: Record<string, any>;
  
  /** Fecha y hora de envío (opcional) */
  sentAt?: Date;
  
  /** Fecha y hora de lectura (opcional) */
  readAt?: Date;
  
  /** Fecha de creación */
  createdAt: Date;
  
  /** Fecha de última actualización */
  updatedAt: Date;
  
  /** Indica si la notificación ha sido leída por el usuario */
  isRead: boolean;
  
  /** Prioridad de la notificación (opcional) */
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  /** URL de acción asociada (opcional) */
  actionUrl?: string;
  
  /** Texto del botón de acción (opcional) */
  actionText?: string;
}

/**
 * Interfaz para crear nuevas notificaciones
 * TODO: Usar para validación de entrada en API routes
 */
export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  actionUrl?: string;
  actionText?: string;
}

/**
 * Interfaz para actualizar notificaciones
 * TODO: Usar para operaciones de actualización
 */
export interface UpdateNotificationRequest {
  id: string;
  status?: NotificationStatus;
  readAt?: Date;
  isRead?: boolean;
}

// ===== PREFERENCIAS DE NOTIFICACIÓN =====

/**
 * Preferencias de notificación por usuario
 * TODO: Sincronizar con modelo UserNotificationPreference de Prisma
 */
export interface UserNotificationPreference {
  /** Identificador único */
  id: string;
  
  /** ID del usuario */
  userId: string;
  
  /** Notificaciones por email habilitadas */
  emailEnabled: boolean;
  
  /** Notificaciones por SMS habilitadas */
  smsEnabled: boolean;
  
  /** Notificaciones push habilitadas */
  pushEnabled: boolean;
  
  /** Recordatorios de citas habilitados */
  appointmentReminders: boolean;
  
  /** Notificaciones de pagos habilitadas */
  paymentNotifications: boolean;
  
  /** Alertas del sistema habilitadas */
  systemAlerts: boolean;
  
  /** Emails de marketing habilitados */
  marketingEmails: boolean;
  
  /** Fecha de creación */
  createdAt: Date;
  
  /** Fecha de última actualización */
  updatedAt: Date;
}

/**
 * Interfaz para actualizar preferencias
 * TODO: Usar en formularios de configuración
 */
export interface UpdateNotificationPreferenceRequest {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  appointmentReminders?: boolean;
  paymentNotifications?: boolean;
  systemAlerts?: boolean;
  marketingEmails?: boolean;
}

// ===== TOKENS DE DISPOSITIVO =====

/**
 * Token de dispositivo para notificaciones push
 * TODO: Sincronizar con modelo DeviceToken de Prisma
 */
export interface DeviceToken {
  /** Identificador único */
  id: string;
  
  /** ID del usuario propietario */
  userId: string;
  
  /** Token del dispositivo */
  token: string;
  
  /** Plataforma del dispositivo */
  platform: 'ios' | 'android' | 'web';
  
  /** Indica si el token está activo */
  isActive: boolean;
  
  /** Fecha de creación */
  createdAt: Date;
  
  /** Fecha de última actualización */
  updatedAt: Date;
  
  /** Información adicional del dispositivo (opcional) */
  deviceInfo?: {
    model?: string;
    osVersion?: string;
    appVersion?: string;
  };
}

/**
 * Interfaz para registrar nuevos tokens
 * TODO: Usar en registro de dispositivos
 */
export interface RegisterDeviceTokenRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceInfo?: {
    model?: string;
    osVersion?: string;
    appVersion?: string;
  };
}

// ===== TIPOS DE RESPUESTA DE API =====

/**
 * Respuesta de la API para obtener notificaciones
 * TODO: Usar en API routes
 */
export interface GetNotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Respuesta de la API para operaciones de notificación
 * TODO: Usar en respuestas de API
 */
export interface NotificationApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// ===== TIPOS DE FILTROS Y BÚSQUEDA =====

/**
 * Filtros para obtener notificaciones
 * TODO: Usar en queries de notificaciones
 */
export interface NotificationFilters {
  /** Filtrar por tipo de notificación */
  type?: NotificationType;
  
  /** Filtrar por canal */
  channel?: NotificationChannel;
  
  /** Filtrar por estado */
  status?: NotificationStatus;
  
  /** Filtrar solo no leídas */
  unreadOnly?: boolean;
  
  /** Filtrar por prioridad */
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  /** Fecha desde */
  fromDate?: Date;
  
  /** Fecha hasta */
  toDate?: Date;
  
  /** Límite de resultados */
  limit?: number;
  
  /** Cursor para paginación */
  cursor?: string;
}

// ===== TIPOS DE ESTADÍSTICAS =====

/**
 * Estadísticas de notificaciones
 * TODO: Usar en dashboard de notificaciones
 */
export interface NotificationStats {
  /** Total de notificaciones */
  total: number;
  
  /** Notificaciones no leídas */
  unread: number;
  
  /** Notificaciones por tipo */
  byType: Record<NotificationType, number>;
  
  /** Notificaciones por canal */
  byChannel: Record<NotificationChannel, number>;
  
  /** Notificaciones por estado */
  byStatus: Record<NotificationStatus, number>;
  
  /** Notificaciones de hoy */
  today: number;
  
  /** Notificaciones de esta semana */
  thisWeek: number;
}

// ===== TIPOS DE UTILIDAD =====

/**
 * Configuración de notificaciones del sistema
 * TODO: Usar en configuración global
 */
export interface NotificationConfig {
  /** Habilitar notificaciones globalmente */
  enabled: boolean;
  
  /** Retención de notificaciones en días */
  retentionDays: number;
  
  /** Límite de notificaciones por usuario */
  maxNotificationsPerUser: number;
  
  /** Intervalo de limpieza automática en horas */
  cleanupIntervalHours: number;
}

/**
 * Opciones para el hook de notificaciones
 * TODO: Usar en useNotifications hook
 */
export interface UseNotificationsOptions {
  /** Habilitar polling automático */
  enablePolling?: boolean;
  
  /** Intervalo de polling en milisegundos */
  pollingInterval?: number;
  
  /** Filtrar notificaciones */
  filters?: NotificationFilters;
  
  /** Habilitar notificaciones en tiempo real */
  enableRealtime?: boolean;
}
