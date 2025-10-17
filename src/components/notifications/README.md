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
✅ **Animación de "ring"** (campana suena al llegar nuevas notificaciones)  
✅ **Diseño responsive** (compatible con móvil y desktop)  
✅ **Tema claro/oscuro** (compatible con next-themes)  
✅ **Estilo consistente** (variant="ghost", size="icon")  
✅ **Accesibilidad** (aria-label, screen reader support)  

## Funcionalidades Actuales

- **Contador dinámico**: Muestra número de notificaciones no leídas
- **Animación de ring**: Campana se balancea cuando llegan nuevas notificaciones
- **Dropdown interactivo**: Lista de notificaciones con hover effects
- **Marcar como leída**: Botón para marcar todas como leídas
- **Ver todas**: Enlace para ver todas las notificaciones
- **Placeholder**: Mensaje cuando no hay notificaciones
- **Botón de prueba**: Simular nuevas notificaciones para testing

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

## ✅ Archivos del Sistema de Notificaciones

### 📁 Estructura de Archivos
```
src/
├── lib/
│   └── notification-types.ts      # ✅ Tipos TypeScript
├── hooks/
│   └── use-notifications.ts       # ✅ Hook de notificaciones
└── components/
    └── notifications/
        ├── notification-bell.tsx  # ✅ Componente principal
        ├── index.ts               # ✅ Exportaciones
        └── README.md              # ✅ Documentación
```

### 🔧 Archivos Implementados

#### `src/lib/notification-types.ts`
- ✅ **Interfaces TypeScript** completas para notificaciones
- ✅ **Tipos de notificación** (APPOINTMENT_REMINDER, PAYMENT_CONFIRMATION, etc.)
- ✅ **Canales de notificación** (EMAIL, SMS, PUSH, IN_APP)
- ✅ **Estados de notificación** (PENDING, SENT, DELIVERED, READ, FAILED)
- ✅ **Interfaces para preferencias** de usuario y tokens de dispositivo
- ✅ **Tipos de respuesta de API** y filtros
- ✅ **Comentarios TODO** para sincronización con Prisma

#### `src/hooks/use-notifications.ts`
- ✅ **Hook React completo** con TypeScript
- ✅ **Estado de notificaciones** (lista, contador, loading, error)
- ✅ **Funciones CRUD** (obtener, marcar como leída, eliminar)
- ✅ **Polling automático** configurable
- ✅ **Optimistic updates** para mejor UX
- ✅ **Utilidades de búsqueda** (por ID, tipo, no leídas)
- ✅ **Hooks adicionales** (useNotificationCount, useNotificationStats)
- ✅ **Datos dummy** para desarrollo y testing

## 🎵 Animación de "Ring"

### Características de la Animación

- **Trigger**: Se activa cuando `unreadCount` se incrementa
- **Duración**: 1 segundo (configurable)
- **Efecto**: Balanceo de -15° a +15° con decaimiento gradual
- **Compatibilidad**: Funciona en tema claro y oscuro
- **Accesibilidad**: No interfiere con screen readers

### Configuración en Tailwind

```typescript
// tailwind.config.ts
keyframes: {
  'ring': {
    '0%, 100%': { transform: 'rotate(0deg)' },
    '10%': { transform: 'rotate(-15deg)' },
    '20%': { transform: 'rotate(15deg)' },
    // ... más keyframes para efecto de decaimiento
  }
},
animation: {
  'ring': 'ring 1s ease-in-out',
}
```

### Lógica de Activación

```typescript
useEffect(() => {
  // Solo animar si el contador aumentó (nueva notificación)
  if (unreadCount > previousUnreadCount.current) {
    setIsRinging(true);
    setTimeout(() => setIsRinging(false), 1000);
  }
  previousUnreadCount.current = unreadCount;
}, [unreadCount]);
```

## Próximos Pasos de Integración

### 1. ✅ Hook de Notificaciones - COMPLETADO
```typescript
// src/hooks/use-notifications.ts - YA IMPLEMENTADO
export function useNotifications(options?: UseNotificationsOptions) {
  // ✅ Estado completo de notificaciones
  // ✅ Funciones CRUD implementadas
  // ✅ Polling automático configurable
  // ✅ Optimistic updates
  // ✅ Conectado con API real /api/notifications
  // TODO: Implementar WebSocket para tiempo real
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

### 3. ✅ Integración con Backend - COMPLETADO
- ✅ **Modelos Prisma**: `Notification`, `UserNotificationPreference`, `DeviceToken`
- ✅ **API Routes**: `/api/notifications` (5 endpoints implementados)
- ✅ **Autenticación**: NextAuth.js con validación de sesión
- ✅ **Base de datos**: PostgreSQL con Prisma (tablas creadas)
- ✅ **Documentación**: README completo con ejemplos de uso
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

## 🔗 API Endpoints

### Endpoints Disponibles

- ✅ `GET /api/notifications` - Obtener notificaciones con filtros
- ✅ `PATCH /api/notifications/[id]/read` - Marcar como leída
- ✅ `PATCH /api/notifications/read-all` - Marcar todas como leídas
- ✅ `DELETE /api/notifications/[id]` - Eliminar notificación
- ✅ `GET /api/notifications/[id]` - Obtener notificación específica

### Documentación Completa

Ver [API Documentation](./api/README.md) para ejemplos detallados, tipos de datos, y códigos de error.

### Ejemplo de Uso con API

```typescript
// Obtener notificaciones no leídas
const response = await fetch('/api/notifications?unreadOnly=true', {
  credentials: 'include'
});
const data = await response.json();

// Marcar como leída
await fetch('/api/notifications/123/read', {
  method: 'PATCH',
  credentials: 'include'
});
```

## 🧪 Testing de la Animación

### Cómo Probar la Animación

1. **Abrir el dropdown** de notificaciones
2. **Hacer clic** en "🧪 Simular nueva notificación"
3. **Observar** la animación de balanceo de la campana
4. **Verificar** que el contador se incrementa

### Configuración de Testing

```typescript
// Función de prueba incluida (remover en producción)
const simulateNewNotification = () => {
  setUnreadCount(prev => prev + 1);
};
```

### Ajustes de Animación

Para modificar la animación, editar en `tailwind.config.ts`:

- **Duración**: Cambiar `1s` en la animación
- **Intensidad**: Modificar los grados de rotación (-15° a +15°)
- **Suavidad**: Ajustar `ease-in-out` por otro timing function

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
