# 🔔 API de Notificaciones - UroVital

Documentación completa de los endpoints de notificaciones para el sistema UroVital.

## 📋 Tabla de Contenidos

- [Endpoints Disponibles](#endpoints-disponibles)
- [Autenticación](#autenticación)
- [Tipos de Datos](#tipos-de-datos)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Códigos de Error](#códigos-de-error)
- [Consideraciones de Seguridad](#consideraciones-de-seguridad)

## 🚀 Endpoints Disponibles

### 1. GET /api/notifications

Obtener notificaciones del usuario autenticado con filtros y paginación.

#### Parámetros de Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `unreadOnly` | boolean | No | Solo notificaciones no leídas |
| `type` | string | No | Filtrar por tipo de notificación |
| `channel` | string | No | Filtrar por canal |
| `limit` | number | No | Límite de resultados (default: 20, max: 100) |
| `offset` | number | No | Offset para paginación (default: 0) |

#### Tipos de Notificación Válidos

```typescript
type NotificationType = 
  | 'APPOINTMENT_REMINDER'
  | 'PAYMENT_CONFIRMATION'
  | 'SYSTEM_ALERT'
  | 'APPOINTMENT_CANCELLATION'
  | 'NEW_MESSAGE'
  | 'LAB_RESULT_READY'
  | 'PRESCRIPTION_READY'
  | 'AFFILIATION_EXPIRING'
  | 'MAINTENANCE_NOTICE';
```

#### Canales Válidos

```typescript
type NotificationChannel = 
  | 'EMAIL'
  | 'SMS'
  | 'PUSH'
  | 'IN_APP';
```

#### Respuesta Exitosa (200)

```json
{
  "notifications": [
    {
      "id": "clx1234567890",
      "userId": "user_123",
      "type": "APPOINTMENT_REMINDER",
      "channel": "IN_APP",
      "status": "DELIVERED",
      "title": "Recordatorio de cita",
      "message": "Tienes una cita mañana a las 10:00 AM",
      "data": {},
      "sentAt": "2025-01-15T10:00:00Z",
      "readAt": null,
      "createdAt": "2025-01-15T09:00:00Z",
      "updatedAt": "2025-01-15T09:00:00Z",
      "isRead": false,
      "priority": "MEDIUM",
      "actionUrl": "/appointments",
      "actionText": "Ver cita"
    }
  ],
  "totalCount": 25,
  "unreadCount": 3,
  "hasMore": true,
  "nextCursor": "20"
}
```

### 2. PATCH /api/notifications/[id]/read

Marcar una notificación específica como leída.

#### Parámetros de Ruta

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string | Sí | ID de la notificación |

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Notificación marcada como leída",
  "data": {
    "id": "clx1234567890",
    "isRead": true,
    "readAt": "2025-01-15T10:30:00Z",
    "status": "READ"
  }
}
```

### 3. PATCH /api/notifications/read-all

Marcar todas las notificaciones del usuario como leídas.

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "5 notificaciones marcadas como leídas",
  "data": {
    "updatedCount": 5,
    "previousUnreadCount": 5
  }
}
```

### 4. DELETE /api/notifications/[id]

Eliminar una notificación específica.

#### Parámetros de Ruta

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string | Sí | ID de la notificación |

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Notificación eliminada exitosamente",
  "data": {
    "deletedId": "clx1234567890"
  }
}
```

### 5. GET /api/notifications/[id]

Obtener una notificación específica.

#### Parámetros de Ruta

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string | Sí | ID de la notificación |

#### Respuesta Exitosa (200)

```json
{
  "id": "clx1234567890",
  "userId": "user_123",
  "type": "APPOINTMENT_REMINDER",
  "channel": "IN_APP",
  "status": "DELIVERED",
  "title": "Recordatorio de cita",
  "message": "Tienes una cita mañana a las 10:00 AM",
  "data": {},
  "sentAt": "2025-01-15T10:00:00Z",
  "readAt": null,
  "createdAt": "2025-01-15T09:00:00Z",
  "updatedAt": "2025-01-15T09:00:00Z",
  "isRead": false,
  "priority": "MEDIUM",
  "actionUrl": "/appointments",
  "actionText": "Ver cita"
}
```

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante el sistema personalizado de UroVital.

### Sistema de Autenticación

El proyecto UroVital usa un sistema de autenticación personalizado con:
- **Frontend**: `AuthProvider` con localStorage
- **Backend**: Utilidades de autenticación en `src/lib/auth-utils.ts`
- **Sesiones**: Cookies de sesión personalizadas

### Headers Requeridos

```http
Cookie: session-token=user-id-here
```

### Verificación de Permisos

- ✅ **Usuario autenticado**: Solo puede acceder a sus propias notificaciones
- ✅ **Validación de propiedad**: Cada endpoint verifica que la notificación pertenezca al usuario
- ✅ **Seguridad de sesión**: Usa cookies personalizadas para mayor seguridad
- ✅ **Validación de base de datos**: Verifica que el usuario existe en la BD

## 📊 Tipos de Datos

### Notification

```typescript
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  message: string;
  data?: Record<string, any>;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isRead: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  actionUrl?: string;
  actionText?: string;
}
```

### GetNotificationsResponse

```typescript
interface GetNotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
  nextCursor?: string;
}
```

### NotificationApiResponse

```typescript
interface NotificationApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}
```

## 💡 Ejemplos de Uso

### Obtener Notificaciones No Leídas

```javascript
const response = await fetch('/api/notifications?unreadOnly=true&limit=10', {
  method: 'GET',
  credentials: 'include', // Incluye cookies de sesión
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(`Tienes ${data.unreadCount} notificaciones no leídas`);
```

### Filtrar por Tipo de Notificación

```javascript
const response = await fetch('/api/notifications?type=APPOINTMENT_REMINDER', {
  method: 'GET',
  credentials: 'include'
});

const data = await response.json();
console.log('Recordatorios de citas:', data.notifications);
```

### Marcar Notificación como Leída

```javascript
const response = await fetch('/api/notifications/clx1234567890/read', {
  method: 'PATCH',
  credentials: 'include'
});

const result = await response.json();
console.log(result.message); // "Notificación marcada como leída"
```

### Marcar Todas como Leídas

```javascript
const response = await fetch('/api/notifications/read-all', {
  method: 'PATCH',
  credentials: 'include'
});

const result = await response.json();
console.log(`${result.data.updatedCount} notificaciones marcadas como leídas`);
```

### Eliminar Notificación

```javascript
const response = await fetch('/api/notifications/clx1234567890', {
  method: 'DELETE',
  credentials: 'include'
});

const result = await response.json();
console.log(result.message); // "Notificación eliminada exitosamente"
```

### Paginación

```javascript
// Primera página
const page1 = await fetch('/api/notifications?limit=10&offset=0', {
  credentials: 'include'
});

// Segunda página
const page2 = await fetch('/api/notifications?limit=10&offset=10', {
  credentials: 'include'
});
```

## ❌ Códigos de Error

### 400 - Bad Request

```json
{
  "error": "ID de notificación requerido"
}
```

### 401 - Unauthorized

```json
{
  "error": "No autorizado"
}
```

### 404 - Not Found

```json
{
  "error": "Notificación no encontrada"
}
```

### 500 - Internal Server Error

```json
{
  "error": "Error interno del servidor"
}
```

## 🔒 Consideraciones de Seguridad

### Validaciones Implementadas

- ✅ **Autenticación obligatoria**: Todos los endpoints requieren sesión válida
- ✅ **Autorización por usuario**: Solo se puede acceder a notificaciones propias
- ✅ **Validación de entrada**: Parámetros validados antes de procesar
- ✅ **Límites de paginación**: Máximo 100 resultados por consulta
- ✅ **Sanitización de datos**: Datos de entrada limpiados antes de usar

### Mejores Prácticas

1. **Usar HTTPS** en producción
2. **Implementar rate limiting** para prevenir abuso
3. **Logging de auditoría** para operaciones sensibles
4. **Validación de tipos** con Zod o similar
5. **Cache con TTL** para mejorar performance

## 🚀 Próximas Mejoras

### Funcionalidades Pendientes

- [ ] **WebSocket** para notificaciones en tiempo real
- [ ] **Push notifications** con service workers
- [ ] **Filtros avanzados** por fecha, prioridad, etc.
- [ ] **Búsqueda de texto** en títulos y mensajes
- [ ] **Notificaciones masivas** para administradores
- [ ] **Templates de notificación** reutilizables
- [ ] **Métricas y analytics** de notificaciones
- [ ] **Soft delete** en lugar de eliminación física

### Optimizaciones

- [ ] **Cache con Redis** para consultas frecuentes
- [ ] **Índices de base de datos** optimizados
- [ ] **Compresión de respuestas** para reducir ancho de banda
- [ ] **CDN** para assets estáticos
- [ ] **Database connection pooling** para mejor performance

## 📝 Logging

Todos los endpoints incluyen logging detallado:

```typescript
console.log(`[API] Notificaciones obtenidas para usuario ${userId}: ${notifications.length} de ${totalCount} total`);
console.log(`[API] Notificación ${notificationId} marcada como leída por usuario ${userId}`);
console.log(`[API] ${updateResult.count} notificaciones marcadas como leídas para usuario ${userId}`);
```

## 🧪 Testing

### Endpoints para Testing

```bash
# Obtener notificaciones
curl -X GET "http://localhost:3000/api/notifications" \
  -H "Cookie: session-token=user-id-here"

# Marcar como leída
curl -X PATCH "http://localhost:3000/api/notifications/123/read" \
  -H "Cookie: session-token=user-id-here"

# Marcar todas como leídas
curl -X PATCH "http://localhost:3000/api/notifications/read-all" \
  -H "Cookie: session-token=user-id-here"

# Eliminar notificación
curl -X DELETE "http://localhost:3000/api/notifications/123" \
  -H "Cookie: session-token=user-id-here"
```

---

**Última actualización**: 15 de Enero, 2025  
**Versión**: 1.0.0  
**Autor**: Sistema UroVital
