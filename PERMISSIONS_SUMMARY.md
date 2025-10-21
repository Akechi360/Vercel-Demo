# Sistema de Permisos UroVital

## Roles Implementados

### 1. **Admin** 
- **Acceso**: Absolutamente todo
- **Módulos visibles**: Todos
- **Datos**: Acceso completo a todos los datos
- **Funcionalidades**: Crear, editar, eliminar cualquier registro

### 2. **Doctor**
- **Acceso**: Solo información del médico logueado
- **Módulos visibles**: 
  - Panel (dashboard)
  - Pacientes (solo los que ha atendido)
  - Citas (solo las suyas)
  - Configuración (solo cambiar contraseña)
- **Datos**: No puede ver información de otros doctores
- **Restricciones**: No puede acceder a empresas, finanzas, afiliaciones

### 3. **Paciente**
- **Acceso**: Solo su propia información
- **Módulos visibles**:
  - Panel (su información personal)
  - Citas (solo las suyas)
  - Configuración (solo cambiar contraseña)
  - Finanzas (solo sus pagos)
- **Datos**: Solo su historia médica, no la de otros pacientes
- **Restricciones**: No puede acceder a otros módulos

### 4. **Secretaria**
- **Acceso**: Panel y gráficas generales
- **Módulos visibles**:
  - Panel (dashboard)
  - Pacientes (todos)
  - Citas (todas)
  - Empresas (todas)
  - Finanzas (todas)
  - Configuración (solo cambiar contraseña)
- **Datos**: Puede ver y gestionar pacientes, citas, empresas y pagos
- **Restricciones**: No puede ver afiliaciones

### 5. **Promotora** (Nuevo rol)
- **Acceso**: Solo información de la promotora logueada
- **Módulos visibles**:
  - Panel (dashboard básico)
  - Afiliaciones (solo las suyas)
  - Configuración (solo cambiar contraseña)
- **Datos**: Solo sus afiliaciones, no puede ver información de otras promotoras
- **Restricciones**: Todas las demás opciones están restringidas

## Permisos Técnicos

### Permisos Base
- `admin:all` - Acceso total (solo Admin)
- `dashboard:read` - Ver panel principal
- `appointments:read/write` - Ver/crear citas
- `patients:read/write` - Ver/crear pacientes
- `companies:read/write` - Ver/crear empresas
- `finance:read/write` - Ver/crear pagos
- `affiliations:read/write` - Ver/crear afiliaciones
- `settings:read/write` - Ver/editar configuración
- `medical_history:read` - Ver historias médicas
- `own_data:read/write` - Ver/editar datos propios

### Filtros de Datos
- Los datos se filtran automáticamente según el rol del usuario
- Cada función de datos tiene su propio filtro por rol
- Los pacientes solo ven sus propios datos
- Los doctores solo ven datos de sus pacientes
- Las promotoras solo ven sus afiliaciones

## Componentes de Seguridad

### 1. Hook `usePermissions`
- Verifica permisos del usuario actual
- Funciones helper para roles específicos
- Validación de acceso a módulos

### 2. Componente `RoleBasedContent`
- Renderiza contenido solo para roles específicos
- Componentes predefinidos: `AdminOnly`, `DoctorOnly`, etc.
- Fallback para usuarios sin permisos

### 3. Filtros de Datos
- `filterPatientsByRole()` - Filtra pacientes por rol
- `filterAppointmentsByRole()` - Filtra citas por rol
- `filterCompaniesByRole()` - Filtra empresas por rol
- `filterPaymentsByRole()` - Filtra pagos por rol
- `filterAffiliationsByRole()` - Filtra afiliaciones por rol

## Navegación
- La navegación se actualiza dinámicamente según los permisos
- Solo se muestran los módulos a los que el usuario tiene acceso
- Los menús administrativos solo aparecen para Admin

## Dashboard Personalizado
- **Admin/Doctor/Secretaria**: Estadísticas completas y gráficos
- **Paciente**: Información personal y próximas citas
- **Promotora**: Estadísticas de afiliaciones

## Base de Datos
- Nuevo rol `PROMOTORA` agregado al enum `UserRole`
- Migración aplicada correctamente
- Cliente Prisma regenerado

## Próximos Pasos
1. Crear usuarios de prueba para cada rol
2. Probar funcionalidades específicas por rol
3. Implementar restricciones adicionales si es necesario
4. Agregar logs de auditoría para cambios importantes
