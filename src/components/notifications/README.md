# 🔔 NotificationBell Component

## Descripción

Componente de notificaciones que muestra un botón con ícono de campana y contador de notificaciones no leídas. Utiliza un Popover para mostrar un dropdown con la lista de notificaciones.

## Ubicación

- **Archivo**: `src/components/notifications/notification-bell.tsx`
- **Integrado en**: `src/components/layout/app-header.tsx` (línea 83)

## Características Implementadas

✅ **Botón con ícono campana** (Bell de Lucide React)  
✅ **Contador de notificaciones** (Badge rojo con número)  
✅ **Dropdown con Popover** (lista de notificaciones)  
✅ **Diseño responsive** (compatible con móvil y desktop)  
✅ **Tema claro/oscuro** (compatible con next-themes)  
✅ **Estilo consistente** (variant="ghost", size="icon")  
✅ **Accesibilidad** (aria-label, screen reader support)  

## Funcionalidades Actuales

- **Contador dinámico**: Muestra número de notificaciones no leídas
- **Dropdown interactivo**: Lista de notificaciones con hover effects
- **Marcar como leída**: Botón para marcar todas como leídas
- **Ver todas**: Enlace para ver todas las notificaciones
- **Placeholder**: Mensaje cuando no hay notificaciones

## Datos Dummy Actuales

```typescript
const unreadCount = 3; // Contador fijo
const notifications = [
  {
    id: '1',
    title: 'Nueva cita programada',
    message: 'Tienes una cita mañana a las 10:00 AM',
    type: 'APPOINTMENT_REMINDER',
    isRead: false,
  },
  // ... más notificaciones
];
```

## Próximos Pasos de Integración

### 1. Hook de Notificaciones
```typescript
// src/hooks/use-notifications.ts
export function useNotifications() {
  // Conectar con Prisma y backend
  // Obtener notificaciones reales del usuario
  // Manejar estado de lectura/no lectura
}
```

### 2. Servicio de Notificaciones
```typescript
// src/lib/notification-service.ts
export class NotificationService {
  // Crear notificaciones
  // Marcar como leídas
  // Eliminar notificaciones
  // Conectar con modelos de Prisma
}
```

### 3. Integración con Backend
- **Modelos Prisma**: `Notification`, `UserNotificationPreference`
- **API Routes**: `/api/notifications`
- **Server Actions**: Para operaciones CRUD
- **WebSocket**: Para notificaciones en tiempo real

### 4. Funcionalidades Adicionales
- **Notificaciones push**: Integración con service workers
- **Sonidos**: Notificaciones audibles
- **Filtros**: Por tipo de notificación
- **Paginación**: Para listas largas de notificaciones

## Estructura de Archivos

```
src/components/notifications/
├── notification-bell.tsx      # Componente principal
├── index.ts                   # Exportaciones
└── README.md                  # Documentación
```

## Uso

```tsx
import NotificationBell from '@/components/notifications/notification-bell';

// En el header
<NotificationBell />
```

## Estilos

- **Tamaño**: `h-8 w-8` (consistente con otros botones del header)
- **Posición**: Entre toggle de tema y dropdown de usuario
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Temas**: Compatible con light/dark mode

## Accesibilidad

- **aria-label**: "Notificaciones"
- **Screen reader**: Soporte para lectores de pantalla
- **Keyboard navigation**: Navegación con teclado
- **Focus management**: Manejo de foco en el dropdown
