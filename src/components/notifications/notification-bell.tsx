'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

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
  // TODO: Reemplazar con hook real de notificaciones
  const [unreadCount] = useState(3); // Dummy data - conectar con backend
  const [isOpen, setIsOpen] = useState(false);

  // TODO: Obtener notificaciones reales del backend
  const notifications = [
    // Dummy data - reemplazar con datos reales
    {
      id: '1',
      title: 'Nueva cita programada',
      message: 'Tienes una cita mañana a las 10:00 AM',
      type: 'APPOINTMENT_REMINDER',
      createdAt: new Date(),
      isRead: false,
    },
    {
      id: '2',
      title: 'Pago confirmado',
      message: 'Tu pago de $50.00 ha sido procesado',
      type: 'PAYMENT_CONFIRMATION',
      createdAt: new Date(),
      isRead: false,
    },
    {
      id: '3',
      title: 'Sistema actualizado',
      message: 'Nuevas funcionalidades disponibles',
      type: 'SYSTEM_ALERT',
      createdAt: new Date(),
      isRead: true,
    },
  ];

  const handleNotificationClick = (notificationId: string) => {
    // TODO: Implementar lógica para marcar como leída
    console.log('Notification clicked:', notificationId);
    // TODO: Navegar a página relevante o mostrar detalles
  };

  const handleMarkAllAsRead = () => {
    // TODO: Implementar lógica para marcar todas como leídas
    console.log('Mark all as read');
  };

  const handleViewAllNotifications = () => {
    // TODO: Navegar a página de notificaciones
    console.log('View all notifications');
    setIsOpen(false);
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
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
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
          <h4 className="font-semibold text-sm">Notificaciones</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleMarkAllAsRead}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>
        
        <Separator />
        
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No hay notificaciones
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-3 rounded-md cursor-pointer transition-colors hover:bg-accent ${
                      !notification.isRead ? 'bg-accent/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        !notification.isRead ? 'bg-primary' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.createdAt.toLocaleTimeString('es-ES', {
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
        
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={handleViewAllNotifications}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
