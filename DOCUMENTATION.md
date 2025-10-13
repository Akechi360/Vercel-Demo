# UroVital - Sistema de Gestión Médica Urológica

## 📋 Descripción General

UroVital es un sistema integral de gestión médica especializado en urología, desarrollado con Next.js 15, Prisma ORM y PostgreSQL. El sistema maneja pacientes, citas médicas, afiliaciones empresariales, finanzas y reportes médicos con un sistema robusto de roles y permisos.

## 🛠 Stack Tecnológico

### Frontend
- **Next.js 15.3.3** - Framework React con App Router
- **React 18.3.1** - Biblioteca de UI
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 3.4.1** - Framework de estilos
- **Framer Motion 11.3.19** - Animaciones
- **Lucide React 0.475.0** - Iconografía
- **Radix UI** - Componentes accesibles (Dialog, Select, Tabs, etc.)

### Backend & Base de Datos
- **Prisma 6.16.3** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos principal
- **Railway** - Hosting de base de datos
- **bcryptjs 2.4.3** - Encriptación de contraseñas

### Estado y Caching
- **Zustand 4.5.7** - Gestión de estado global unificado
- **React Hook Form 7.54.2** - Manejo de formularios
- **Zod 3.24.2** - Validación de esquemas
- **Sistema de Cache Unificado** - Estado global centralizado
- **Eventos Globales** - Propagación en tiempo real

### Integraciones
- **Vercel** - Hosting y deployment
- **jsPDF 2.5.1** - Generación de PDFs
- **SweetAlert2 11.12.3** - Alertas y confirmaciones
- **Genkit AI 1.14.1** - Integración con IA

## 📁 Estructura Completa del Proyecto

### App Router (Next.js 15) - Estructura Completa
```
src/app/
├── (app)/                           # Rutas autenticadas
│   ├── dashboard/                   # Dashboard principal
│   │   ├── layout.tsx              # Layout del dashboard
│   │   └── page.tsx                # Página principal
│   ├── patients/                   # Gestión de pacientes
│   │   ├── [patientId]/           # Detalle de paciente específico
│   │   │   ├── layout.tsx         # Layout del paciente
│   │   │   ├── page.tsx           # Página principal del paciente
│   │   │   ├── reports/           # Reportes del paciente
│   │   │   │   └── page.tsx       # Página de reportes
│   │   │   ├── summary/           # Resumen del paciente
│   │   │   │   └── page.tsx       # Página de resumen
│   │   │   └── urology/           # Información urológica
│   │   │       └── page.tsx        # Página urológica
│   │   └── page.tsx                # Lista de pacientes
│   ├── appointments/               # Citas médicas
│   │   └── page.tsx                # Gestión de citas
│   ├── companies/                  # Gestión de empresas
│   │   ├── [companyId]/           # Detalle de empresa específica
│   │   │   └── page.tsx           # Página de empresa
│   │   └── page.tsx                # Lista de empresas
│   ├── finanzas/                   # Módulo financiero
│   │   ├── finance-page-client.tsx # Cliente de finanzas
│   │   ├── nuevo/                 # Nuevo comprobante
│   │   │   ├── nuevo-comprobante-client.tsx
│   │   │   └── page.tsx           # Página de nuevo comprobante
│   │   └── page.tsx                # Página principal de finanzas
│   ├── afiliaciones/               # Gestión de afiliaciones
│   │   ├── afiliaciones-page-client.tsx # Cliente de afiliaciones
│   │   ├── lista/                 # Lista de afiliaciones
│   │   │   └── page.tsx           # Página de lista
│   │   └── page.tsx                # Página principal de afiliaciones
│   ├── auditoria/                  # Logs de auditoría
│   │   └── page.tsx                # Página de auditoría
│   ├── administrativo/             # Módulo administrativo
│   │   ├── alerts/                 # Alertas del sistema
│   │   │   └── page.tsx           # Página de alertas
│   │   ├── providers/              # Gestión de proveedores
│   │   │   └── page.tsx           # Página de proveedores
│   │   └── supplies/               # Gestión de suministros
│   │       └── page.tsx            # Página de suministros
│   ├── settings/                   # Configuración del sistema
│   │   ├── layout.tsx             # Layout de configuración
│   │   ├── page.tsx               # Página principal de configuración
│   │   ├── preferences/           # Preferencias del sistema
│   │   │   └── page.tsx           # Página de preferencias
│   │   ├── profile/               # Perfil de usuario
│   │   │   └── page.tsx           # Página de perfil
│   │   ├── security/              # Seguridad
│   │   │   └── page.tsx           # Página de seguridad
│   │   └── users/                 # Gestión de usuarios
│   │       └── page.tsx           # Página de usuarios
│   └── layout.tsx                  # Layout principal autenticado
├── (auth)/                         # Rutas de autenticación
│   ├── layout.tsx                  # Layout de autenticación
│   ├── login/                      # Inicio de sesión
│   │   └── page.tsx                 # Página de login
│   ├── register/                   # Registro de usuarios
│   │   └── page.tsx               # Página de registro
│   └── forgot-password/            # Recuperación de contraseña
│       └── page.tsx                # Página de recuperación
├── (public)/                       # Rutas públicas
│   ├── layout.tsx                  # Layout público
│   ├── landing/                    # Página de inicio
│   │   └── page.tsx                # Landing page
│   ├── afiliacion/                 # Formulario público de afiliación
│   │   └── page.tsx                # Página de afiliación pública
│   ├── directorio/                 # Directorio médico
│   │   └── page.tsx                # Página de directorio
│   └── estudios/                   # Información de estudios
│       └── page.tsx                # Página de estudios
├── favicon.ico                     # Favicon del sitio
├── globals.css                     # Estilos globales
├── layout.tsx                      # Layout raíz
└── page.tsx                        # Página de inicio
```

### Componentes por Módulo (src/components/)
```
src/components/
├── admin/                          # Componentes administrativos
│   ├── providers/                  # Gestión de proveedores
│   │   ├── add-provider-form.tsx   # Formulario de proveedor
│   │   ├── provider-list-wrapper.tsx # Wrapper de lista
│   │   └── provider-list.tsx       # Lista de proveedores
│   └── supplies/                   # Gestión de suministros
│       ├── add-supply-form.tsx     # Formulario de suministro
│       ├── supply-list-wrapper.tsx # Wrapper de lista
│       └── supply-list.tsx         # Lista de suministros
├── affiliations/                   # Componentes de afiliaciones
│   ├── add-affiliation-dialog.tsx  # Modal de nueva afiliación
│   ├── add-affiliation-form.tsx    # Formulario de afiliación
│   ├── affiliation-actions.tsx     # Acciones de afiliación
│   └── stat-cards.tsx              # Tarjetas de estadísticas
├── appointments/                   # Componentes de citas
│   ├── add-appointment-fab.tsx     # FAB para nueva cita
│   ├── add-appointment-form.tsx    # Formulario de cita
│   ├── doctor-appointments.tsx     # Citas por doctor
│   └── patient-appointments.tsx   # Citas por paciente
├── auth/                           # Componentes de autenticación
│   └── auth-form.tsx               # Formulario de autenticación
├── companies/                      # Componentes de empresas
│   ├── add-company-form.tsx        # Formulario de empresa
│   ├── company-list-wrapper.tsx   # Wrapper de lista
│   └── company-list.tsx            # Lista de empresas
├── dashboard/                      # Componentes del dashboard
│   ├── charts.tsx                  # Gráficos del dashboard
│   ├── stat-card.tsx               # Tarjeta de estadística
│   └── upcoming-appointments.tsx   # Próximas citas
├── finance/                        # Componentes financieros
│   ├── create-receipt-form.tsx     # Formulario de comprobante
│   ├── create-receipt-modal.tsx    # Modal de comprobante
│   ├── direct-payments-table.tsx   # Tabla de pagos directos
│   ├── finance-table.tsx           # Tabla financiera
│   └── stat-cards.tsx               # Tarjetas de estadísticas
├── history/                        # Componentes de historial
│   ├── consultation-card.tsx       # Tarjeta de consulta
│   ├── export-history-button.tsx   # Botón de exportar
│   └── medical-history-timeline.tsx # Timeline del historial
├── layout/                         # Componentes de layout
│   ├── app-header.tsx              # Header de la aplicación
│   ├── app-layout.tsx              # Layout principal
│   ├── auth-provider.tsx           # Proveedor de autenticación
│   ├── footer.tsx                  # Footer
│   └── nav.tsx                     # Navegación
├── patients/                       # Componentes de pacientes
│   ├── add-history-fab.tsx         # FAB para nuevo historial
│   ├── add-patient-form.tsx        # Formulario de paciente
│   ├── consultation-form.tsx       # Formulario de consulta
│   ├── ipss-calculator.tsx         # Calculadora IPSS
│   ├── lab-results-card.tsx        # Tarjeta de resultados
│   ├── patient-detail-header.tsx   # Header de detalle
│   ├── patient-detail-nav.tsx      # Navegación de paciente
│   ├── patient-list-wrapper.tsx    # Wrapper de lista
│   ├── patient-list.tsx            # Lista de pacientes
│   ├── patient-summary-cards.tsx   # Tarjetas de resumen
│   ├── patient-summary-client.tsx  # Cliente de resumen
│   └── quick-actions.tsx           # Acciones rápidas
├── public/                         # Componentes públicos
│   └── affiliate-enrollment.tsx    # Formulario de afiliación pública
├── reports/                        # Componentes de reportes
│   ├── add-report-fab.tsx          # FAB para nuevo reporte
│   ├── new-report-form.tsx         # Formulario de reporte
│   ├── report-card.tsx             # Tarjeta de reporte
│   ├── report-detail-modal.tsx    # Modal de detalle
│   └── report-list.tsx             # Lista de reportes
├── shared/                         # Componentes compartidos
│   ├── page-header.tsx             # Header de página
│   └── role-based-content.tsx      # Contenido basado en roles
├── theme-provider.tsx              # Proveedor de tema
└── ui/                             # Componentes UI (shadcn/ui)
    ├── accordion.tsx               # Acordeón
    ├── alert-dialog.tsx            # Diálogo de alerta
    ├── alert.tsx                   # Alerta
    ├── avatar.tsx                  # Avatar
    ├── badge.tsx                   # Badge
    ├── button.tsx                  # Botón
    ├── calendar.tsx                # Calendario
    ├── card.tsx                     # Tarjeta
    ├── carousel.tsx                # Carrusel
    ├── chart.tsx                   # Gráfico
    ├── checkbox.tsx                 # Checkbox
    ├── collapsible.tsx              # Colapsable
    ├── dialog.tsx                  # Diálogo
    ├── dropdown-menu.tsx           # Menú desplegable
    ├── file-input.tsx              # Input de archivo
    ├── form.tsx                    # Formulario
    ├── input.tsx                   # Input
    ├── label.tsx                   # Etiqueta
    ├── menubar.tsx                 # Barra de menú
    ├── popover.tsx                 # Popover
    ├── progress.tsx                 # Progreso
    ├── radio-group.tsx              # Grupo de radio
    ├── scroll-area.tsx             # Área de scroll
    ├── select.tsx                  # Selector
    ├── separator.tsx                # Separador
    ├── sheet.tsx                   # Hoja
    ├── sidebar.tsx                 # Barra lateral
    ├── skeleton.tsx                # Esqueleto
    ├── slider.tsx                  # Deslizador
    ├── specialty-carousel.tsx      # Carrusel de especialidades
    ├── switch.tsx                  # Interruptor
    ├── table.tsx                   # Tabla
    ├── tabs.tsx                    # Pestañas
    ├── textarea.tsx                # Área de texto
    ├── toast.tsx                   # Toast
    ├── toaster.tsx                 # Toaster
    └── tooltip.tsx                 # Tooltip
```

### Librerías y Utilidades (src/lib/)
```
src/lib/
├── actions.ts                      # Server Actions de Prisma
├── data-filters.ts                 # Filtros de datos
├── db.ts                           # Configuración de base de datos
├── dev-credentials.ts              # 🔐 Credenciales de desarrollo (SEGURIDAD)
├── dev-middleware.ts               # 🔐 Middleware de desarrollo (SEGURIDAD)
├── payment-options.ts              # Opciones de pago
├── pdf-helpers.ts                  # Utilidades para PDFs
├── placeholder-images.json         # Imágenes placeholder
├── placeholder-images.ts           # Utilidades de imágenes
├── store/                          # Store Zustand Unificado
│   └── global-store.ts             # 🚀 Store global unificado
├── types.ts                        # Tipos TypeScript
├── user-sync.ts                    # Sincronización de usuarios
└── utils.ts                        # Utilidades generales
```

### Hooks Personalizados (src/hooks/)
```
src/hooks/
├── use-focus-management.ts         # Hook de gestión de foco
├── use-mobile.tsx                  # Hook de detección móvil
├── use-permissions.ts              # Hook de permisos
├── use-sweetalert-theme.ts         # Hook de tema SweetAlert
├── use-theme.ts                    # Hook de tema
├── use-toast.ts                    # Hook de notificaciones
├── use-unified-user-status.ts      # 🚀 Hook unificado de estado de usuario
├── use-user-details.ts             # Hook de detalles de usuario
├── use-user-status-test.ts         # Hook de prueba de estado de usuario
└── use-user-status.ts              # Hook de estado de usuario
```

### Scripts de Desarrollo (scripts/)
```
scripts/
├── deploy-setup.md                  # Documentación de despliegue
├── setup-deployment.md              # Guía de configuración
└── setup-dev-backdoor.ts            # 🔐 Script de backdoor de desarrollo
```

### Base de Datos (prisma/)
```
prisma/
├── migrations/                      # Migraciones de base de datos
│   ├── 20251004145345_init/        # Migración inicial
│   │   └── migration.sql
│   ├── 20251004151127_add_promotora_role/ # Agregar rol promotora
│   │   └── migration.sql
│   ├── 20251006154405_add_audit_log/ # Agregar logs de auditoría
│   │   └── migration.sql
│   ├── 20251006180211_add_receipts_table/ # Agregar tabla de comprobantes
│   │   └── migration.sql
│   └── migration_lock.toml          # Lock de migraciones
├── schema.prisma                    # Esquema de base de datos
└── seed.ts                          # Script de datos iniciales
```

### Recursos Públicos (public/)
```
public/
└── images/                          # Imágenes del sistema
    ├── avatars/                     # Avatares de usuarios
    │   └── default-doctor.png       # Avatar por defecto
    ├── banks/                       # Logos de bancos
    │   ├── banesco.png
    │   ├── bdv.png
    │   ├── binance.png
    │   ├── bnc.png
    │   ├── mercantil.png
    │   ├── paypal.png
    │   ├── wally.png
    │   └── zinli.png
    ├── doctors/                     # Imágenes de doctores
    ├── landing/                     # Imágenes de landing
    │   ├── appointments.jpg
    │   ├── doctors-uro1.png
    │   └── medical-care.jpg
    ├── logo/                        # Logos de UroVital
    │   ├── urovital-logo.png
    │   └── urovital-logo2.png
    └── ui/                          # Imágenes de UI
        └── background-1.jpg
```

### Componentes por Módulo

#### 🏥 Módulo de Pacientes
- `PatientList` - Lista de pacientes con filtros
- `PatientDetailHeader` - Header con información del paciente
- `AddPatientForm` - Formulario de registro de pacientes
- `ConsultationForm` - Formulario de consultas médicas
- `MedicalHistoryTimeline` - Historial médico cronológico
- `IpssCalculator` - Calculadora de puntuación IPSS
- `QuickActions` - Acciones rápidas del paciente

#### 📅 Módulo de Citas
- `AddAppointmentForm` - Formulario de nueva cita
- `DoctorAppointments` - Citas por doctor
- `PatientAppointments` - Citas por paciente
- `UpcomingAppointments` - Próximas citas

#### 🏢 Módulo de Empresas
- `CompanyList` - Lista de empresas afiliadas
- `AddCompanyForm` - Formulario de nueva empresa
- `CompanyDetailHeader` - Información de la empresa

#### 💰 Módulo Financiero
- `FinanceTable` - Tabla de transacciones financieras
- `CreateReceiptModal` - Modal para crear comprobantes
- `StatCards` - Tarjetas de estadísticas financieras
- `DirectPaymentsTable` - Pagos directos

#### 🤝 Módulo de Afiliaciones
- `AddAffiliationDialog` - Modal de nueva afiliación
- `AddAffiliationForm` - Formulario de afiliación
- `AffiliationActions` - Acciones sobre afiliaciones
- `StatCards` - Estadísticas de afiliaciones

#### 📊 Módulo de Reportes
- `ReportList` - Lista de reportes médicos
- `ReportDetailModal` - Detalle de reporte
- `AddReportForm` - Formulario de nuevo reporte
- `ExportHistoryButton` - Exportar historial

## 🗄 Base de Datos (Prisma Schema)

### Modelos Principales

#### User
```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String
  password      String
  role          String
  status        String         @default("ACTIVE")
  avatarUrl     String?        @default("/images/avatars/default-doctor.png")
  phone         String?
  lastLogin     DateTime?
  patientId     String?
  // Relaciones
  affiliations  Affiliation[]
  appointments  Appointment[]
  consultations Consultation[]
  payments      Payment[]
  auditLogs     AuditLog[]
}
```

#### Patient
```prisma
model Patient {
  id              String         @id @default(cuid())
  nombre          String
  apellido        String
  cedula          String         @unique
  fechaNacimiento DateTime
  telefono        String?
  email           String?
  direccion       String?
  // Relaciones
  appointments    Appointment[]
  consultations   Consultation[]
  labResults      LabResult[]
  payments        Payment[]
  prescriptions   Prescription[]
  receipts        Receipt[]
}
```

#### Company
```prisma
model Company {
  id           String        @id @default(cuid())
  nombre       String
  rif          String        @unique
  direccion    String?
  telefono     String?
  email        String?
  contacto     String?
  // Relaciones
  affiliations Affiliation[]
}
```

#### Affiliation
```prisma
model Affiliation {
  id            String            @id @default(cuid())
  planId        String
  tipoPago      String?
  estado        AffiliationStatus @default(ACTIVA)
  fechaInicio   DateTime
  fechaFin      DateTime?
  monto         Decimal           @db.Decimal(10, 2)
  beneficiarios Json?
  companyId     String?
  userId        String
  // Relaciones
  company       Company?          @relation(fields: [companyId], references: [id])
  user          User              @relation(fields: [userId], references: [id])
}
```

### Enums
- `UserRole`: ADMIN, DOCTOR, USER, PROMOTORA
- `AppointmentStatus`: PROGRAMADA, CONFIRMADA, EN_PROGRESO, COMPLETADA, CANCELADA, NO_ASISTIO
- `AffiliationStatus`: ACTIVA, INACTIVA, SUSPENDIDA, VENCIDA, ABONO, INICIAL
- `PaymentStatus`: PENDIENTE, PAGADO, CANCELADO, REEMBOLSADO

## 🔐 Sistema de Roles y Permisos

### Roles Implementados
- **admin**: Acceso completo al sistema
- **doctor**: Acceso a pacientes, citas y historial médico
- **secretaria**: Gestión de citas, pacientes y finanzas básicas
- **patient**: Acceso a sus propios datos y citas
- **promotora**: Gestión de afiliaciones

### Permisos por Rol
```typescript
const ROLE_PERMISSIONS = {
  admin: ['admin:all', 'dashboard:read', 'patients:read', 'patients:write', ...],
  doctor: ['dashboard:read', 'patients:read', 'medical_history:read', ...],
  secretaria: ['appointments:write', 'patients:write', 'finance:receipts', ...],
  patient: ['appointments:read', 'medical_history:read', 'own_data:read', ...],
  promotora: ['dashboard:read', 'affiliations:read', 'own_data:read', ...]
}
```

### Hook de Permisos
```typescript
const { hasPermission, canAccessModule, isAdmin, isDoctor } = usePermissions();
```

## 🚀 Sistema de Estado Global Unificado

### Global Store (Zustand Unificado)
```typescript
interface GlobalState {
  // === DATOS PRINCIPALES ===
  patients: Patient[];
  companies: Company[];
  users: User[];
  appointments: Appointment[];
  payments: Payment[];
  affiliations: Affiliation[];
  
  // === ESTADO DE CARGA ===
  loading: {
    patients: boolean;
    companies: boolean;
    users: boolean;
    appointments: boolean;
    payments: boolean;
    affiliations: boolean;
  };
  
  // === ERRORES ===
  errors: {
    patients: string | null;
    companies: string | null;
    users: string | null;
    appointments: string | null;
    payments: string | null;
    affiliations: string | null;
  };
  
  // === GESTIÓN DE CACHE ===
  lastFetch: Record<string, number>;
  cacheConfig: {
    duration: number;
    autoRefresh: boolean;
  };
}
```

### Hooks Especializados
```typescript
// Hook para pacientes
const { patients, loading, error, refresh, addPatient, updatePatient, removePatient } = usePatients();

// Hook para empresas
const { companies, loading, error, refresh, addCompany, updateCompany, removeCompany } = useCompanies();

// Hook para usuarios
const { users, loading, error, refresh, addUser, updateUser, removeUser } = useUsers();

// Hook para citas
const { appointments, loading, error, refresh, addAppointment, updateAppointment, removeAppointment } = useAppointments();

// Hook para pagos
const { payments, loading, error, refresh, addPayment, updatePayment, removePayment } = usePayments();

// Hook para afiliaciones
const { affiliations, loading, error, refresh, addAffiliation, updateAffiliation, removeAffiliation } = useAffiliations();
```

### Sistema de Eventos Globales
```typescript
// Eventos de actualización automática
globalEventBus.emitPatientUpdate(patient);
globalEventBus.emitUserUpdate(user);
globalEventBus.emitCompanyUpdate(company);
globalEventBus.emitAppointmentUpdate(appointment);
globalEventBus.emitPaymentUpdate(payment);
globalEventBus.emitAffiliationUpdate(affiliation);

// Eventos de invalidación de cache
globalEventBus.emitCacheInvalidation(['patients', 'users']);
globalEventBus.emitGlobalRefresh();
```

## 🎣 Hooks Personalizados

### usePermissions
- `hasPermission(permission)` - Verificar permiso específico
- `canAccessModule(module)` - Verificar acceso a módulo
- `isAdmin()`, `isDoctor()`, `isPatient()` - Verificar rol
- `canViewOwnDataOnly()` - Verificar acceso limitado

### useUnifiedUserStatus
- Hook unificado para estado de usuario
- Integrado con el store global
- Sin re-renders innecesarios
- Propagación en tiempo real

### useMobile
- Detección de dispositivos móviles
- Breakpoints responsivos

### useToast
- Notificaciones del sistema
- Variantes: success, error, warning, info

## 🔐 Sistema de Backdoor de Desarrollo

### ⚠️ ADVERTENCIAS DE SEGURIDAD
**🚨 CRÍTICO**: Este sistema incluye un backdoor de desarrollo para facilitar testing y debugging.

**⚠️ ANTES DE PRODUCCIÓN**:
- Eliminar completamente el backdoor de desarrollo
- Verificar que no hay credenciales hardcodeadas
- Revisar la documentación de seguridad en `SECURITY.md`
- Confirmar que el sistema está limpio

### 🔐 Credenciales de Desarrollo
```
Email: master@urovital.com
Password: DevMaster2024!
Role: superadmin
UserId: admin-master-001
```

### 🛡️ Medidas de Seguridad
- ✅ Solo activo en `NODE_ENV=development`
- ✅ Bloqueado automáticamente en producción
- ✅ Logging obligatorio de todas las acciones
- ✅ Restricciones de IP (opcional)
- ✅ Timeout de sesión corto (30 minutos)

### 📁 Archivos de Seguridad
```
src/lib/dev-credentials.ts     # Configuración de credenciales
src/lib/dev-middleware.ts     # Middleware de seguridad
scripts/setup-dev-backdoor.ts  # Script de configuración
SECURITY.md                    # Documentación de seguridad
```

### 🚀 Uso Seguro
```bash
# Configurar backdoor (solo desarrollo)
npm run setup:dev-backdoor

# Verificar configuración
npm run setup:dev-backdoor:dry

# Verificar seguridad
grep -r "master@urovital.com" src/
grep -r "DevMaster2024" src/
```

## 🔄 Flujo de Datos

### 1. Autenticación
```
Login → AuthProvider → useAuth → currentUser → usePermissions
```

### 2. Carga de Datos (Sistema Unificado)
```
Server Component → getPatients() → Prisma → PostgreSQL → Global Store → Client Component
```

### 3. Propagación en Tiempo Real
```
User Action → Server Action → Database Update → Global Event → All Components Update
```

### 4. Estado Global Unificado
```
Global Store → usePatients() → Component State → UI Update
Event Bus → Global Store → All Components → Real-time Update
```

### 5. Formularios
```
React Hook Form → Zod Validation → Server Action → Prisma → Database → Global Event → UI Update
```

## 🚀 Mejoras y Optimizaciones Implementadas

### ✅ Sistema de Cache Unificado
- **Eliminados**: 7 stores duplicados y conflictivos
- **Creado**: Store global unificado con Zustand
- **Beneficios**: Re-renders reducidos, propagación en tiempo real
- **Performance**: Cache inteligente con invalidación selectiva

### ✅ Sistema de Eventos Globales
- **Implementado**: `globalEventBus` para propagación automática
- **Eventos**: `patientUpdated`, `userUpdated`, `companyUpdated`, etc.
- **Listeners**: Automáticos para sincronización en tiempo real
- **Resultado**: Cambios instantáneos sin refrescos de página

### ✅ Hooks Especializados
- **Creados**: `usePatients()`, `useCompanies()`, `useUsers()`, etc.
- **API consistente**: Misma interfaz para todos los hooks
- **TypeScript**: Completamente tipado
- **Performance**: Optimizado con Zustand

### ✅ Backdoor de Desarrollo Seguro
- **Implementado**: Sistema de backdoor profesional
- **Seguridad**: Solo activo en desarrollo
- **Logging**: Auditoría completa de accesos
- **Documentación**: Guías de seguridad detalladas

### ✅ Eliminación de Sistemas Conflictivos
- **Removido**: `router.refresh()` en 4 archivos
- **Removido**: `mutate()` de SWR en 2 archivos
- **Removido**: `clearCache()` duplicado
- **Reemplazado**: Por sistema de eventos unificado

## 📄 Generación de PDFs

### Librerías Utilizadas
- **jsPDF 2.5.1** - Generación de documentos PDF
- **jspdf-autotable 3.8.2** - Tablas en PDF

### Funciones de Exportación
- `generateReceiptPDF()` - Comprobantes de pago
- `exportPatientHistory()` - Historial médico
- `exportPatientList()` - Lista de pacientes
- `addUroVitalLogo()` - Logo institucional en PDFs

## 🚀 Deployment

### Vercel Configuration
```json
{
  "buildCommand": "prisma generate && npm run build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Railway Database
- PostgreSQL en Railway
- Variables de entorno: `DATABASE_URL`
- Migraciones automáticas con Prisma

### Scripts de Deployment
```bash
npm run deploy:setup  # Generar Prisma + Push DB + Seed
npm run db:generate   # Generar cliente Prisma
npm run db:push       # Sincronizar esquema
npm run db:seed       # Datos iniciales
```

### 🔐 Scripts de Seguridad (Desarrollo)
```bash
# Configurar backdoor (SOLO desarrollo)
npm run setup:dev-backdoor

# Verificar configuración
npm run setup:dev-backdoor:dry

# Verificar seguridad
grep -r "master@urovital.com" src/
grep -r "DevMaster2024" src/
echo $NODE_ENV
```

## 🔧 Configuración Técnica

### Next.js Config
```typescript
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { hostname: 'placehold.co' },
      { hostname: 'images.unsplash.com' },
      { hostname: 'picsum.photos' }
    ]
  }
}
```

### Prisma Configuration
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 📊 Módulos Implementados

### ✅ Completamente Funcionales
- **Dashboard** - Estadísticas y resumen general
- **Pacientes** - CRUD completo con historial médico
- **Citas** - Gestión de citas médicas
- **Empresas** - Gestión de empresas afiliadas
- **Finanzas** - Comprobantes y pagos
- **Afiliaciones** - Gestión de afiliaciones empresariales
- **Auditoría** - Logs de acciones del sistema
- **Configuración** - Gestión de usuarios y permisos

### 🔄 En Desarrollo
- **Reportes** - Generación de reportes médicos
- **Estudios** - Catálogo de estudios médicos
- **Proveedores** - Gestión de proveedores médicos
- **Suministros** - Control de inventario médico

## 🎨 UI/UX Features

### Componentes UI (shadcn/ui)
- **Form Components**: Input, Select, Textarea, Checkbox
- **Layout Components**: Card, Dialog, Sheet, Tabs
- **Data Display**: Table, Badge, Avatar, Progress
- **Navigation**: Breadcrumb, Pagination, Sidebar
- **Feedback**: Toast, Alert, Skeleton, Spinner

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Sidebar colapsible en móviles
- Tablas responsivas con scroll horizontal

### Animaciones
- **Framer Motion** para transiciones suaves
- **Tailwind Animate** para micro-interacciones
- **Animate.css** para efectos adicionales

## 🔍 Características Técnicas

### Optimizaciones de Rendimiento
- **Server Components** para carga inicial
- **Client Components** solo cuando necesario
- **Caching** con Zustand para datos frecuentes
- **Prefetch** silencioso de datos críticos
- **Lazy Loading** de componentes pesados

### Manejo de Errores
- **Error Boundaries** para captura de errores
- **Fallbacks** para datos no disponibles
- **Toast notifications** para feedback
- **SweetAlert2** para confirmaciones importantes

### Seguridad
- **bcryptjs** para hash de contraseñas
- **Validación Zod** en formularios
- **Sanitización** de inputs
- **Roles y permisos** granulares
- **Audit logs** para trazabilidad
- **🔐 Backdoor de desarrollo** seguro y documentado
- **🔐 Middleware de seguridad** para desarrollo
- **🔐 Logging de auditoría** completo
- **🔐 Restricciones de entorno** automáticas

## 📝 TODOs y Pendientes

### Identificados en el Código
- ✅ ~~Implementar cache de datos de afiliaciones~~ (COMPLETADO - Sistema unificado)
- ✅ ~~Optimizar consultas de base de datos~~ (COMPLETADO - Store global)
- Agregar tests unitarios
- Implementar notificaciones push
- Mejorar validaciones de formularios
- Agregar documentación de API

### Mejoras Futuras
- Sistema de notificaciones en tiempo real
- Integración con sistemas de pago
- Dashboard de analytics avanzado
- Mobile app nativa
- Integración con sistemas externos

---

**Última actualización**: Enero 2025  
**Versión**: 1.1.0  
**Desarrollado con**: Next.js 15, Prisma, PostgreSQL, TypeScript

## 🔄 Changelog

### v1.1.0 (Enero 2025)
- ✅ **Sistema de Cache Unificado**: Eliminados 7 stores duplicados, implementado store global
- ✅ **Sistema de Eventos Globales**: Propagación en tiempo real sin refrescos
- ✅ **Hooks Especializados**: API consistente para todos los módulos
- ✅ **Backdoor de Desarrollo**: Sistema seguro y profesional
- ✅ **Documentación de Seguridad**: Guías completas y advertencias
- ✅ **Optimización de Performance**: Re-renders reducidos, cache inteligente
- ✅ **Eliminación de Conflictos**: Removidos router.refresh() y mutate() duplicados