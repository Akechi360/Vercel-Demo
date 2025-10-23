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

  // Debug inicial (temporal)
  console.log('🔔 useNotifications hook initialized:', {
    currentUser: currentUser,
    currentUserId: currentUser?.id,
    isAuthenticated: !!currentUser,
    initialUnreadCount: unreadCount
  });
  
  // Referencias para control de polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  // Control de fetch para evitar loops
  const isFetchingRef = useRef(false);
  const hasFetchedOnceRef = useRef(false);
  
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
    // Validar que haya usuario
    if (!currentUser?.id) {
      console.log('[NOTIFICATIONS] No hay usuario logueado');
      setLoading(false);
      setNotifications([]);
      return;
    }

    // Evitar fetches simultáneos
    if (isFetchingRef.current) {
      console.log('[NOTIFICATIONS] Fetch ya en progreso, ignorando');
      return;
    }

    isFetchingRef.current = true;
    console.log('[NOTIFICATIONS] Cargando notificaciones para usuario:', currentUser.id);
    
    // Poner loading true al inicio
    setLoading(true);
    setError(null);

    // Construir URL con query params
    const activeFilters = { ...filters, ...customFilters };
    const params = new URLSearchParams();
    if (activeFilters.unreadOnly) params.append('unreadOnly', 'true');
    if (activeFilters.type) params.append('type', activeFilters.type);
    if (activeFilters.channel) params.append('channel', activeFilters.channel);
    if (activeFilters.limit) params.append('limit', String(activeFilters.limit));
    if (activeFilters.cursor) params.append('offset', String(activeFilters.cursor));

    const url = `/api/notifications${params.toString() ? `?${params}` : ''}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': currentUser.id
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        const message = errorData.error || `HTTP ${response.status}`;
        
        // Si es error 401 (no autenticado), es normal al inicio - solo loggear
        if (response.status === 401) {
          console.log('[NOTIFICATIONS] ⏳ Usuario aún no autenticado - esperando...');
          setLoading(false);
          isFetchingRef.current = false;
          return;
        }
        
        // Si es error de servidor/servicio no disponible, no lanzar excepción
        if (response.status >= 500 || response.status === 503) {
          console.warn('[NOTIFICATIONS] Servicio temporalmente no disponible. Silenciando error.');
          setLoading(false);
          isFetchingRef.current = false;
          return;
        }
        
        // Para otros errores, solo loggear sin romper la UI
        console.error('[NOTIFICATIONS] ❌ Error:', message);
        setLoading(false);
        isFetchingRef.current = false;
        return; // No lanzar error para no romper la UI
      }

      const data = await response.json();
      console.log('[NOTIFICATIONS] API Response received:', data);

      // Actualizar TODOS los estados
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setTotalCount(data.totalCount || 0);
      setHasMore(data.hasMore || false);

      console.log('[NOTIFICATIONS] Estado actualizado - Notificaciones:', data.notifications?.length || 0);
      
    } catch (error) {
      console.error('[NOTIFICATIONS] Error en fetch:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setNotifications([]);
      setUnreadCount(0);
    }
    
    // CRÍTICO: SIEMPRE poner loading en false AL FINAL
    setLoading(false);
    isFetchingRef.current = false; // Liberar el lock
    console.log('[NOTIFICATIONS] Fetch completado');
    
  }, [currentUser?.id, filters]);

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
          'Content-Type': 'application/json',
          'X-User-ID': currentUser?.id || ''
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
          'Content-Type': 'application/json',
          'X-User-ID': currentUser?.id || ''
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
          'Content-Type': 'application/json',
          'X-User-ID': currentUser?.id || ''
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
    console.log('[NOTIFICATIONS] Refresh manual solicitado');
    // Resetear el flag para permitir un nuevo fetch
    hasFetchedOnceRef.current = false;
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
    // Evitar múltiples fetches simultáneos
    if (!currentUser?.id) {
      console.log('⏳ Esperando autenticación del usuario...');
      return;
    }
    
    // Solo fetch si no se está ejecutando y no se ha fetched aún
    if (isFetchingRef.current || hasFetchedOnceRef.current) {
      console.log('[NOTIFICATIONS] Fetch ya realizado o en progreso, ignorando');
      return;
    }
    
    console.log('[NOTIFICATIONS] useEffect - Iniciando fetch inicial');
    hasFetchedOnceRef.current = true;
    fetchNotifications();
    
  }, [currentUser?.id]); // ← QUITADO fetchNotifications de las dependencias

  // Configurar polling automático (DESHABILITADO para evitar loops)
  // useEffect(() => {
  //   if (enablePolling && currentUser?.id) {
  //     pollingIntervalRef.current = setInterval(() => {
  //       fetchNotifications();
  //     }, pollingInterval);

  //     return () => {
  //       if (pollingIntervalRef.current) {
  //         clearInterval(pollingIntervalRef.current);
  //       }
  //     };
  //   }
  // }, [enablePolling, pollingInterval, currentUser?.id, fetchNotifications]);

  // TODO: Implementar WebSocket para notificaciones en tiempo real
  useEffect(() => {
    if (enableRealtime && currentUser?.id) {
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
  }, [enableRealtime, currentUser?.id]);

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
