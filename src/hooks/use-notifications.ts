'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/layout/auth-provider';
import type {
  Notification,
  GetNotificationsResponse,
  NotificationFilters,
  UpdateNotificationRequest,
  NotificationStats,
  UseNotificationsOptions,
  NotificationApiResponse
} from '@/lib/notification-types';

/**
 * 🔔 useNotifications Hook
 * 
 * Hook React para manejar la lógica de notificaciones del cliente.
 * Proporciona estado, funciones y efectos para gestionar notificaciones.
 * 
 * TODO: Conectar con API real /api/notifications
 * TODO: Implementar WebSocket para notificaciones en tiempo real
 * TODO: Agregar cache con React Query o SWR
 * TODO: Implementar optimistic updates
 */

interface UseNotificationsReturn {
  // Estado
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  
  // Funciones
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  
  // Utilidades
  getNotificationById: (id: string) => Notification | undefined;
  getNotificationsByType: (type: string) => Notification[];
  getUnreadNotifications: () => Notification[];
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { currentUser } = useAuth();
  
  // Estado principal
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  
  // Referencias para control de polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  // Configuración por defecto
  const {
    enablePolling = false,
    pollingInterval = 30000, // 30 segundos
    filters = {},
    enableRealtime = false
  } = options;

  /**
   * 🚀 Función para obtener notificaciones desde la API
   * 
   * Conecta con el endpoint real /api/notifications
   * Implementa filtros, paginación y manejo de errores
   */
  const fetchNotifications = useCallback(async (customFilters?: NotificationFilters) => {
    if (!currentUser?.userId) {
      setError('Usuario no autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Construir query parameters
      const queryParams = new URLSearchParams();
      
      // Aplicar filtros
      const activeFilters = { ...filters, ...customFilters };
      
      if (activeFilters.unreadOnly) {
        queryParams.append('unreadOnly', 'true');
      }
      
      if (activeFilters.type) {
        queryParams.append('type', activeFilters.type);
      }
      
      if (activeFilters.channel) {
        queryParams.append('channel', activeFilters.channel);
      }
      
      if (activeFilters.limit) {
        queryParams.append('limit', activeFilters.limit.toString());
      }
      
      if (activeFilters.cursor) {
        queryParams.append('offset', activeFilters.cursor);
      }

      // Llamada real a la API
      const response = await fetch(`/api/notifications?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Incluir cookies de sesión
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data: GetNotificationsResponse = await response.json();

      if (isMountedRef.current) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setTotalCount(data.totalCount);
        setHasMore(data.hasMore);
      }

    } catch (err) {
      console.error('Error fetching notifications:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Error al obtener notificaciones');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentUser?.userId, filters]);

  /**
   * ✅ Marcar notificación como leída
   * 
   * Conecta con el endpoint real /api/notifications/[id]/read
   * Implementa optimistic updates para mejor UX
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistic update primero
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Llamada real a la API
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json' 
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al marcar como leída');
      }

      const result = await response.json();
      console.log('Notificación marcada como leída:', result);

    } catch (err) {
      console.error('Error marking notification as read:', err);
      
      // Revertir optimistic update en caso de error
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: false, readAt: undefined }
            : notification
        )
      );
      
      setUnreadCount(prev => prev + 1);
      setError(err instanceof Error ? err.message : 'Error al marcar como leída');
    }
  }, []);

  /**
   * ✅ Marcar todas las notificaciones como leídas
   * 
   * Conecta con el endpoint real /api/notifications/read-all
   * Implementa optimistic updates para mejor UX
   */
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update primero
      const now = new Date();
      const previousUnreadCount = unreadCount;
      
      setNotifications(prev => 
        prev.map(notification => 
          !notification.isRead 
            ? { ...notification, isRead: true, readAt: now }
            : notification
        )
      );
      
      setUnreadCount(0);

      // Llamada real a la API
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json' 
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al marcar todas como leídas');
      }

      const result = await response.json();
      console.log('Todas las notificaciones marcadas como leídas:', result);

    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      
      // Revertir optimistic update en caso de error
      setNotifications(prev => 
        prev.map(notification => 
          notification.isRead && notification.readAt 
            ? { ...notification, isRead: false, readAt: undefined }
            : notification
        )
      );
      
      setUnreadCount(prev => prev + unreadCount);
      setError(err instanceof Error ? err.message : 'Error al marcar todas como leídas');
    }
  }, [unreadCount]);

  /**
   * 🗑️ Eliminar notificación
   * 
   * Conecta con el endpoint real /api/notifications/[id]
   * Implementa optimistic updates para mejor UX
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    let notificationToDelete: Notification | undefined;
    
    try {
      // Optimistic update primero
      notificationToDelete = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notificationToDelete && !notificationToDelete.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setTotalCount(prev => Math.max(0, prev - 1));

      // Llamada real a la API
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json' 
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al eliminar notificación');
      }

      const result = await response.json();
      console.log('Notificación eliminada:', result);

    } catch (err) {
      console.error('Error deleting notification:', err);
      
      // Revertir optimistic update en caso de error
      if (notificationToDelete) {
        setNotifications(prev => [notificationToDelete!, ...prev]);
        
        if (!notificationToDelete.isRead) {
          setUnreadCount(prev => prev + 1);
        }
        
        setTotalCount(prev => prev + 1);
      }
      
      setError(err instanceof Error ? err.message : 'Error al eliminar notificación');
    }
  }, [notifications]);

  /**
   * 🔄 Refrescar notificaciones
   */
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);


  /**
   * 🔍 Utilidades para buscar notificaciones
   */
  const getNotificationById = useCallback((id: string) => {
    return notifications.find(n => n.id === id);
  }, [notifications]);

  const getNotificationsByType = useCallback((type: string) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.isRead);
  }, [notifications]);

  /**
   * 🎯 Efectos
   */
  
  // Cargar notificaciones al montar el componente
  useEffect(() => {
    if (currentUser?.userId) {
      fetchNotifications();
    }
  }, [currentUser?.userId, fetchNotifications]);

  // Configurar polling automático
  useEffect(() => {
    if (enablePolling && currentUser?.userId) {
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications();
      }, pollingInterval);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [enablePolling, pollingInterval, currentUser?.userId, fetchNotifications]);

  // TODO: Implementar WebSocket para notificaciones en tiempo real
  useEffect(() => {
    if (enableRealtime && currentUser?.userId) {
      // TODO: Conectar con WebSocket
      // const ws = new WebSocket(`ws://localhost:3000/notifications/${currentUser.userId}`);
      // 
      // ws.onmessage = (event) => {
      //   const newNotification = JSON.parse(event.data);
      //   setNotifications(prev => [newNotification, ...prev]);
      //   setUnreadCount(prev => prev + 1);
      // };
      // 
      // return () => {
      //   ws.close();
      // };
    }
  }, [enableRealtime, currentUser?.userId]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    // Estado
    notifications,
    unreadCount,
    totalCount,
    loading,
    error,
    hasMore,
    
    // Funciones
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    
    // Utilidades
    getNotificationById,
    getNotificationsByType,
    getUnreadNotifications
  };
}

/**
 * 🎯 Hook simplificado para casos básicos
 * 
 * TODO: Usar cuando solo se necesite el contador de notificaciones
 */
export function useNotificationCount() {
  const { unreadCount, loading, error } = useNotifications({
    enablePolling: true,
    pollingInterval: 60000, // 1 minuto
    filters: { unreadOnly: true }
  });

  return { unreadCount, loading, error };
}

/**
 * 📊 Hook para estadísticas de notificaciones
 * 
 * TODO: Implementar cuando se necesiten estadísticas detalladas
 */
export function useNotificationStats() {
  const { notifications, loading, error } = useNotifications();
  
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    byType: notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byChannel: notifications.reduce((acc, n) => {
      acc[n.channel] = (acc[n.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: notifications.reduce((acc, n) => {
      acc[n.status] = (acc[n.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    today: notifications.filter(n => {
      const today = new Date();
      const notificationDate = new Date(n.createdAt);
      return notificationDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: notifications.filter(n => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(n.createdAt) > weekAgo;
    }).length
  };

  return { stats, loading, error };
}
