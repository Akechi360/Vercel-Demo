'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/use-notifications';
import type { Notification } from '@/lib/notification-types';

/**
 * 🔔 NotificationBell Component
 * 
 * Botón de notificaciones con ícono campana y contador de notificaciones no leídas.
 * Utiliza Popover para mostrar un dropdown con la lista de notificaciones.
 * 
 * TODO: Integrar con hook de notificaciones y backend
 * TODO: Conectar con modelos de Prisma (Notification, UserNotificationPreference)
 * TODO: Implementar acciones de marcar como leída, eliminar, etc.
 */
export default function NotificationBell() {
  // Hook de notificaciones
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotifications({
    enablePolling: true,
    pollingInterval: 30000, // 30 segundos
    filters: { unreadOnly: false }
  });

  // Debug logs (temporal) removed

  const [isOpen, setIsOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const previousUnreadCount = useRef(unreadCount);

  /**
   * 🎵 Animación de "ring" cuando llegan nuevas notificaciones
   * 
   * Detecta cuando el contador de notificaciones no leídas se incrementa
   * y activa la animación de campana por 1 segundo.
   * 
   * TODO: Integrar con notificaciones en tiempo real (WebSocket, Server-Sent Events)
   * TODO: Permitir configurar duración e intensidad de la animación
   * TODO: Agregar sonido opcional (con preferencias de usuario)
   */
  useEffect(() => {
    // Solo animar si el contador aumentó (nueva notificación)
    if (unreadCount > previousUnreadCount.current) {
      setIsRinging(true);

      // Remover la animación después de 1 segundo
      const timer = setTimeout(() => {
        setIsRinging(false);
      }, 1000); // Duración de la animación (1 segundo)

      // Cleanup del timer
      return () => clearTimeout(timer);
    }

    // Actualizar la referencia para la próxima comparación
    previousUnreadCount.current = unreadCount;
  }, [unreadCount]);

  // Las notificaciones ahora vienen del hook useNotifications

  const handleNotificationClick = async (notification: Notification) => {

    // Si ya está leída, solo navegar
    if (notification.isRead) {
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      setIsOpen(false);
      return;
    }

    // Marcar como leída
    try {
      await markAsRead(notification.id);

      // Navegar si tiene URL
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }

      setIsOpen(false);
    } catch (error) {
      console.error('[BELL] Error al marcar como leída:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleViewAllNotifications = () => {
    // TODO: Navegar a página de notificaciones
    setIsOpen(false);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const handleRefreshNotifications = async () => {
    await refreshNotifications();
  };


  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label="Notificaciones"
        >
          <Bell
            className={`h-5 w-5 transition-transform duration-200 ${isRinging ? 'animate-ring' : ''
              }`}
          />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              style={{ zIndex: 10 }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Notificaciones</h4>
            {error && (
              <span className="text-xs text-destructive" title={error}>
                ⚠️
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs font-medium hover:bg-accent"
                onClick={handleMarkAllAsRead}
              >
                Marcar todas leídas
              </Button>
            </>
          )}
        </div>

        <Separator />

        <div className="max-h-80 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="p-4 text-center">
              {loading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : (
                <p className="text-sm text-muted-foreground">No hay notificaciones</p>
              )}
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-3 rounded-md cursor-pointer transition-colors hover:bg-accent ${!notification.isRead ? 'bg-primary/5' : ''
                      }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.isRead ? 'bg-primary' : 'bg-transparent'
                        }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!notification.isRead ? 'font-semibold' : 'font-medium'
                          }`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications && notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2 space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-center text-xs"
                  onClick={handleViewAllNotifications}
                >
                  Ver todas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-center text-xs"
                  onClick={handleRefreshNotifications}
                  disabled={loading}
                >
                  {loading ? '...' : 'Actualizar'}
                </Button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
