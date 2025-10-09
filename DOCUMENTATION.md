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
- **Firebase 11.9.1** - Servicios adicionales
- **Genkit AI 1.14.1** - Integración con IA

## 📁 Estructura del Proyecto

### App Router (Next.js 15)
```
src/app/
├── (app)/                    # Rutas autenticadas
│   ├── dashboard/           # Dashboard principal
│   ├── patients/           # Gestión de pacientes
│   │   └── [id]/          # Detalle de paciente específico
│   ├── appointments/       # Citas médicas
│   ├── companies/          # Gestión de empresas
│   │   └── [companyId]/   # Detalle de empresa específica
│   ├── finanzas/          # Módulo financiero
│   ├── afiliaciones/      # Gestión de afiliaciones
│   ├── auditoria/         # Logs de auditoría
│   └── settings/          # Configuración del sistema
├── (auth)/                 # Rutas de autenticación
│   ├── login/
│   ├── register/
│   └── forgot-password/
└── (public)/              # Rutas públicas
    ├── landing/           # Página de inicio
    ├── afiliacion/        # Formulario público de afiliación
    ├── directorio/        # Directorio médico
    └── estudios/          # Información de estudios
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