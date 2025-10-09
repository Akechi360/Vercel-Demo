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
- **Zustand 4.5.7** - Gestión de estado global
- **React Hook Form 7.54.2** - Manejo de formularios
- **Zod 3.24.2** - Validación de esquemas

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
├── data/                           # Datos estáticos
├── data-filters.ts                 # Filtros de datos
├── db.ts                           # Configuración de base de datos
├── payment-options.ts              # Opciones de pago
├── pdf-helpers.ts                  # Utilidades para PDFs
├── placeholder-images.json         # Imágenes placeholder
├── placeholder-images.ts           # Utilidades de imágenes
├── store/                          # Stores Zustand
│   ├── appointment-store.ts         # Store de citas
│   ├── company-store.ts             # Store de empresas
│   ├── finance-store.ts             # Store financiero
│   ├── patient-store.ts             # Store de pacientes
│   ├── provider-store.ts            # Store de proveedores
│   └── supply-store.ts              # Store de suministros
├── types.ts                        # Tipos TypeScript
└── utils.ts                        # Utilidades generales
```

### Hooks Personalizados (src/hooks/)
```
src/hooks/
├── use-cached-data.ts              # Hook de datos cacheados
├── use-mobile.tsx                  # Hook de detección móvil
├── use-permissions.ts              # Hook de permisos
└── use-toast.ts                    # Hook de notificaciones
```

### Stores Zustand (src/stores/)
```
src/stores/
└── affiliation-store.ts             # Store de afiliaciones
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

## 🏪 Stores Zustand

### Patient Store
```typescript
interface PatientState {
  patients: Patient[];
  isInitialized: boolean;
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  removePatient: (patientId: string) => void;
}
```

### Finance Store
```typescript
interface FinanceState {
  paymentMethods: PaymentMethod[];
  paymentTypes: PaymentType[];
  payments: Payment[];
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  addPayment: (payment: Payment) => void;
}
```

### Affiliation Store
```typescript
interface AffiliationStore {
  companies: any[];
  users: any[];
  loading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  clearCache: () => void;
  isDataFresh: () => boolean;
}
```

## 🎣 Hooks Personalizados

### usePermissions
- `hasPermission(permission)` - Verificar permiso específico
- `canAccessModule(module)` - Verificar acceso a módulo
- `isAdmin()`, `isDoctor()`, `isPatient()` - Verificar rol
- `canViewOwnDataOnly()` - Verificar acceso limitado

### useCachedData
- Cache de 5 minutos para datos de empresas y usuarios
- Carga paralela con `Promise.all()`
- Fallback automático en caso de error

### useMobile
- Detección de dispositivos móviles
- Breakpoints responsivos

### useToast
- Notificaciones del sistema
- Variantes: success, error, warning, info

## 🔄 Flujo de Datos

### 1. Autenticación
```
Login → AuthProvider → useAuth → currentUser → usePermissions
```

### 2. Carga de Datos
```
Server Component → getPatients() → Prisma → PostgreSQL → Client Component
```

### 3. Estado Global
```
Zustand Store → usePatientStore → Component State → UI Update
```

### 4. Formularios
```
React Hook Form → Zod Validation → Server Action → Prisma → Database
```

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

## 📝 TODOs y Pendientes

### Identificados en el Código
- Implementar cache de datos de afiliaciones
- Optimizar consultas de base de datos
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
**Versión**: 1.0.0  
**Desarrollado con**: Next.js 15, Prisma, PostgreSQL, TypeScript