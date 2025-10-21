# 📁 Estructura del Proyecto UroVital

## 🏗️ **Estructura General**

```
Vercel-Demo/
├── 📄 Archivos de Configuración
├── 📁 docs/                    # Documentación del proyecto
├── 📁 prisma/                  # Base de datos y migraciones
├── 📁 public/                  # Archivos estáticos
├── 📁 scripts/                 # Scripts de utilidad
├── 📁 src/                     # Código fuente principal
└── 📁 workspace/               # Archivos de workspace
```

---

## 📄 **Archivos de Configuración (Raíz)**

| Archivo | Propósito |
|---------|-----------|
| `apphosting.yaml` | Configuración para Google App Hosting |
| `components.json` | Configuración de ShadCN UI components |
| `DATABASE_SETUP.md` | Documentación de configuración de base de datos |
| `DOCUMENTATION.md` | Documentación principal del proyecto |
| `EMERGENCY-SECURITY.md` | Procedimientos de seguridad de emergencia |
| `eslint.config.mjs` | Configuración de ESLint para linting |
| `init.sql` | Script SQL de inicialización |
| `jest.config.js` | Configuración de Jest para testing |
| `next-env.d.ts` | Tipos de TypeScript para Next.js |
| `next.config.ts` | Configuración de Next.js |
| `package.json` | Dependencias y scripts del proyecto |
| `package-lock.json` | Lock file de dependencias |
| `PERMISSIONS_SUMMARY.md` | Resumen de permisos del sistema |
| `postcss.config.mjs` | Configuración de PostCSS |
| `README.md` | Documentación principal |
| `SECURITY.md` | Documentación de seguridad |
| `tailwind.config.ts` | Configuración de Tailwind CSS |
| `tsconfig.json` | Configuración de TypeScript |
| `vercel.json` | Configuración de despliegue en Vercel |

---

## 📁 **docs/ - Documentación**

| Archivo | Propósito |
|---------|-----------|
| `blueprint.md` | Plan arquitectónico del proyecto |

---

## 📁 **prisma/ - Base de Datos**

| Archivo/Carpeta | Propósito |
|-----------------|-----------|
| `schema.prisma` | **Esquema principal de la base de datos** - Define modelos, enums y relaciones |
| `seed.ts` | **Script de seeding** - Pobla la base de datos con datos iniciales |
| `migrations/` | **Carpeta de migraciones** - Contiene todas las migraciones de la base de datos |
| `migrations/20250104000000_add_patient_bloodtype_gender/` | Migración para agregar campos de paciente |
| `migrations/20250104000001_redesign_universal_userid/` | Migración para rediseñar userid universal |
| `migrations/20251004145345_init/` | **Migración inicial** - Crea la estructura base |
| `migrations/20251004151127_add_promotora_role/` | Migración para agregar rol promotora |
| `migrations/20251006154405_add_audit_log/` | Migración para agregar logs de auditoría |
| `migrations/20251006180211_add_receipts_table/` | Migración para agregar tabla de recibos |
| `migrations/migration_lock.toml` | Lock file de migraciones |

---

## 📁 **public/ - Archivos Estáticos**

### **public/images/ - Imágenes del Sistema**

| Carpeta | Propósito |
|---------|-----------|
| `aliados/` | Logos de empresas aliadas (clinicare.png, oceanica.png) |
| `avatars/` | Avatares por defecto (default-doctor.png) |
| `banks/` | Logos de bancos (banesco.png, bdv.png, binance.png, etc.) |
| `landing/` | Imágenes para página de landing |
| `logo/` | Logos del sistema (urovital-logo.png, urovital-logo2.png) |
| `ui/` | Imágenes de interfaz (background-1.jpg) |

---

## 📁 **scripts/ - Scripts de Utilidad**

| Archivo | Propósito |
|---------|-----------|
| `deploy-setup.md` | Documentación de configuración de despliegue |
| `emergency-credential-reset.ts` | **Script de emergencia** - Resetea credenciales de admin |
| `run-manual-tests.ts` | Script para ejecutar tests manuales |
| `setup-deployment.md` | Documentación de setup de despliegue |
| `setup-dev-backdoor.ts` | Script para crear backdoor de desarrollo |
| `setup-env.js` | Script para configurar variables de entorno |
| `test-server-actions.js` | Script para probar server actions |
| `verify-server-actions.ts` | Script para verificar server actions |

---

## 📁 **src/ - Código Fuente Principal**

### **src/ai/ - Inteligencia Artificial**

| Archivo | Propósito |
|---------|-----------|
| `dev.ts` | Configuración de AI para desarrollo |
| `genkit.ts` | Configuración de Google Genkit |

### **src/app/ - Aplicación Next.js (App Router)**

#### **src/app/(app)/ - Rutas Autenticadas**

| Carpeta | Propósito |
|---------|-----------|
| `administrativo/` | **Módulo administrativo** - Gestión administrativa |
| `afiliaciones/` | **Módulo de afiliaciones** - Gestión de afiliaciones |
| `appointments/` | **Módulo de citas** - Gestión de citas médicas |
| `auditoria/` | **Módulo de auditoría** - Logs y auditoría del sistema |
| `companies/` | **Módulo de empresas** - Gestión de empresas |
| `dashboard/` | **Dashboard principal** - Panel de control |
| `finanzas/` | **Módulo financiero** - Gestión financiera |
| `layout.tsx` | **Layout de rutas autenticadas** - Layout principal |
| `patients/` | **Módulo de pacientes** - Gestión de pacientes |
| `settings/` | **Módulo de configuración** - Configuraciones del sistema |

#### **src/app/(auth)/ - Rutas de Autenticación**

| Carpeta | Propósito |
|---------|-----------|
| `forgot-password/` | **Recuperación de contraseña** |
| `layout.tsx` | **Layout de autenticación** |
| `login/` | **Página de login** |
| `register/` | **Página de registro** |

#### **src/app/(public)/ - Rutas Públicas**

| Carpeta | Propósito |
|---------|-----------|
| `afiliacion/` | **Página pública de afiliación** |
| `directorio/` | **Directorio público** |
| `estudios/` | **Página de estudios** |
| `landing/` | **Página de landing** |
| `layout.tsx` | **Layout de rutas públicas** |

#### **src/app/api/ - API Routes**

| Carpeta | Propósito |
|---------|-----------|
| `auth/` | **Endpoints de autenticación** |
| `user/` | **Endpoints de usuario** |
| `notifications/` | **Endpoints de notificaciones** |

| Archivo | Propósito |
|---------|-----------|
| `favicon.ico` | **Favicon del sitio** |
| `globals.css` | **Estilos globales** |
| `layout.tsx` | **Layout raíz de la aplicación** |
| `page.tsx` | **Página principal** |

### **src/components/ - Componentes React**

#### **src/components/admin/ - Componentes de Administración**

| Carpeta | Propósito |
|---------|-----------|
| `providers/` | **Componentes de proveedores** |
| `supplies/` | **Componentes de suministros** |

#### **src/components/affiliations/ - Componentes de Afiliaciones**

| Archivo | Propósito |
|---------|-----------|
| `add-affiliation-dialog.tsx` | **Diálogo para agregar afiliación** |
| `add-affiliation-form.tsx` | **Formulario de nueva afiliación** |
| `affiliation-actions.tsx` | **Acciones de afiliación** |
| `stat-cards.tsx` | **Tarjetas de estadísticas** |

#### **src/components/appointments/ - Componentes de Citas**

| Archivo | Propósito |
|---------|-----------|
| `add-appointment-fab.tsx` | **FAB para agregar cita** |
| `add-appointment-form.tsx` | **Formulario de nueva cita** |
| `appointment-actions.tsx` | **Acciones de citas** |
| `doctor-appointments.tsx` | **Citas del doctor** |
| `patient-appointments.tsx` | **Citas del paciente** |

#### **src/components/auth/ - Componentes de Autenticación**

| Archivo | Propósito |
|---------|-----------|
| `auth-form.tsx` | **Formulario de autenticación** |
| `password-strength.tsx` | **Indicador de fortaleza de contraseña** |

#### **src/components/companies/ - Componentes de Empresas**

| Archivo | Propósito |
|---------|-----------|
| `add-company-form.tsx` | **Formulario de nueva empresa** |
| `company-list-wrapper.tsx` | **Wrapper de lista de empresas** |
| `company-list.tsx` | **Lista de empresas** |

#### **src/components/dashboard/ - Componentes del Dashboard**

| Archivo | Propósito |
|---------|-----------|
| `charts.tsx` | **Gráficos del dashboard** |
| `stat-card.tsx` | **Tarjeta de estadística** |
| `upcoming-appointments.tsx` | **Próximas citas** |

#### **src/components/finance/ - Componentes Financieros**

| Archivo | Propósito |
|---------|-----------|
| `create-receipt-form.tsx` | **Formulario de crear recibo** |
| `create-receipt-modal.tsx` | **Modal de crear recibo** |
| `direct-payments-table.tsx` | **Tabla de pagos directos** |
| `finance-table.tsx` | **Tabla financiera principal** |
| `finance-table.tsx.backup` | **Backup de tabla financiera** |
| `stat-cards.tsx` | **Tarjetas de estadísticas financieras** |

#### **src/components/history/ - Componentes de Historial**

| Archivo | Propósito |
|---------|-----------|
| `history-list.tsx` | **Lista de historial** |
| `history-item.tsx` | **Item de historial** |
| `history-filters.tsx` | **Filtros de historial** |

#### **src/components/layout/ - Componentes de Layout**

| Archivo | Propósito |
|---------|-----------|
| `app-header.tsx` | **Header de la aplicación** |
| `app-layout.tsx` | **Layout principal** |
| `app-sidebar.tsx` | **Sidebar de la aplicación** |
| `auth-provider.tsx` | **Provider de autenticación** |
| `mobile-nav.tsx` | **Navegación móvil** |
| `theme-provider.tsx` | **Provider de tema** |

#### **src/components/notifications/ - Componentes de Notificaciones**

| Archivo | Propósito |
|---------|-----------|
| `notification-bell.tsx` | **Campana de notificaciones** - Componente principal |
| `README.md` | **Documentación de notificaciones** |

#### **src/components/patients/ - Componentes de Pacientes**

| Archivo | Propósito |
|---------|-----------|
| `add-patient-form.tsx` | **Formulario de nuevo paciente** |
| `patient-actions.tsx` | **Acciones de paciente** |
| `patient-card.tsx` | **Tarjeta de paciente** |
| `patient-details.tsx` | **Detalles del paciente** |
| `patient-form.tsx` | **Formulario de paciente** |
| `patient-list.tsx` | **Lista de pacientes** |
| `patient-search.tsx` | **Búsqueda de pacientes** |
| `patient-stats.tsx` | **Estadísticas de pacientes** |
| `patient-table.tsx` | **Tabla de pacientes** |
| `patient-access-gate.tsx` | **Control de acceso a pacientes** |
| `patient-history.tsx` | **Historial del paciente** |
| `patient-medical-record.tsx` | **Expediente médico** |
| `patient-profile.tsx` | **Perfil del paciente** |
| `patient-schedule.tsx` | **Horario del paciente** |
| `patient-timeline.tsx` | **Línea de tiempo del paciente** |
| `patient-vitals.tsx` | **Signos vitales** |
| `patient-visits.tsx` | **Visitas del paciente** |
| `patient-notes.tsx` | **Notas del paciente** |
| `patient-documents.tsx` | **Documentos del paciente** |
| `patient-insurance.tsx` | **Seguro del paciente** |

#### **src/components/public/ - Componentes Públicos**

| Archivo | Propósito |
|---------|-----------|
| `affiliate-enrollment.tsx` | **Inscripción de afiliación** |

#### **src/components/reports/ - Componentes de Reportes**

| Archivo | Propósito |
|---------|-----------|
| `report-generator.tsx` | **Generador de reportes** |
| `report-filters.tsx` | **Filtros de reportes** |
| `report-charts.tsx` | **Gráficos de reportes** |
| `report-export.tsx` | **Exportación de reportes** |
| `report-scheduler.tsx` | **Programador de reportes** |

#### **src/components/shared/ - Componentes Compartidos**

| Archivo | Propósito |
|---------|-----------|
| `loading-spinner.tsx` | **Spinner de carga** |
| `error-boundary.tsx` | **Manejo de errores** |

#### **src/components/ui/ - Componentes UI (ShadCN)**

| Archivo | Propósito |
|---------|-----------|
| `accordion.tsx` | **Componente accordion** |
| `alert.tsx` | **Componente alert** |
| `alert-dialog.tsx` | **Diálogo de alerta** |
| `avatar.tsx` | **Avatar** |
| `badge.tsx` | **Badge** |
| `button.tsx` | **Botón** |
| `calendar.tsx` | **Calendario** |
| `card.tsx` | **Tarjeta** |
| `carousel.tsx` | **Carrusel** |
| `chart.tsx` | **Gráfico** |
| `checkbox.tsx` | **Checkbox** |
| `collapsible.tsx` | **Colapsible** |
| `command.tsx` | **Comando** |
| `context-menu.tsx` | **Menú contextual** |
| `data-table.tsx` | **Tabla de datos** |
| `date-picker.tsx` | **Selector de fecha** |
| `dialog.tsx` | **Diálogo** |
| `dropdown-menu.tsx` | **Menú desplegable** |
| `form.tsx` | **Formulario** |
| `hover-card.tsx` | **Tarjeta hover** |
| `input.tsx` | **Input** |
| `label.tsx` | **Label** |
| `menubar.tsx` | **Barra de menú** |
| `navigation-menu.tsx` | **Menú de navegación** |
| `pagination.tsx` | **Paginación** |
| `popover.tsx` | **Popover** |
| `progress.tsx` | **Barra de progreso** |
| `radio-group.tsx` | **Grupo de radio** |
| `resizable.tsx` | **Redimensionable** |
| `scroll-area.tsx` | **Área de scroll** |
| `select.tsx` | **Selector** |
| `separator.tsx` | **Separador** |
| `sheet.tsx` | **Hoja** |
| `skeleton.tsx` | **Esqueleto** |
| `slider.tsx` | **Slider** |
| `sonner.tsx` | **Toast notifications** |
| `switch.tsx` | **Switch** |
| `table.tsx` | **Tabla** |
| `tabs.tsx` | **Pestañas** |
| `textarea.tsx` | **Área de texto** |
| `toast.tsx` | **Toast** |
| `toaster.tsx` | **Toaster** |
| `toggle.tsx` | **Toggle** |
| `tooltip.tsx` | **Tooltip** |
| `README.md` | **Documentación de componentes UI** |

### **src/hooks/ - Hooks Personalizados**

| Archivo | Propósito |
|---------|-----------|
| `use-focus-management.ts` | **Hook para manejo de foco** |
| `use-mobile.tsx` | **Hook para detección móvil** |
| `use-permissions.ts` | **Hook para permisos** |
| `use-sweetalert-theme.ts` | **Hook para tema de SweetAlert** |
| `use-theme.ts` | **Hook para tema** |
| `use-toast.ts` | **Hook para toast** |
| `use-unified-user-status.ts` | **Hook para estado unificado de usuario** |
| `use-user-details.ts` | **Hook para detalles de usuario** |
| `use-user-status-test.ts` | **Hook de prueba para estado de usuario** |
| `use-user-status.ts` | **Hook para estado de usuario** |
| `use-notifications.ts` | **Hook para notificaciones** |

### **src/lib/ - Librerías y Utilidades**

| Archivo | Propósito |
|---------|-----------|
| `actions.ts` | **Server actions** |
| `auth-utils.ts` | **Utilidades de autenticación** |
| `data-filters.ts` | **Filtros de datos** |
| `db.ts` | **Configuración de base de datos** |
| `dev-credentials.ts` | **Credenciales de desarrollo** |
| `dev-middleware.ts` | **Middleware de desarrollo** |
| `payment-options.ts` | **Opciones de pago** |
| `pdf-helpers.ts` | **Utilidades para PDF** |
| `placeholder-images.json` | **Imágenes placeholder** |
| `placeholder-images.ts` | **Utilidades de imágenes placeholder** |
| `refactor-examples.ts` | **Ejemplos de refactoring** |
| `server-actions-config.ts` | **Configuración de server actions** |
| `skew-protection.ts` | **Protección contra skew** |
| `store/` | **Store global** |
| `types.ts` | **Tipos TypeScript** |
| `UNDEFINED_USERID_SOLUTION.md` | **Solución para userId indefinido** |
| `user-sync.ts` | **Sincronización de usuarios** |
| `utils.ts` | **Utilidades generales** |
| `notification-types.ts` | **Tipos de notificaciones** |

#### **src/lib/store/ - Store Global**

| Archivo | Propósito |
|---------|-----------|
| `global-store.ts` | **Store global de la aplicación** |

---

## 📁 **workspace/ - Archivos de Workspace**

### **workspace/src/components/ui/ - Componentes UI Adicionales**

| Archivo | Propósito |
|---------|-----------|
| `button.tsx` | **Botón adicional** |
| `input.tsx` | **Input adicional** |
| `label.tsx` | **Label adicional** |

---

## 🎯 **Archivos Clave del Sistema**

### **🔐 Autenticación**
- `src/components/layout/auth-provider.tsx` - **Provider principal de autenticación**
- `src/lib/auth-utils.ts` - **Utilidades de autenticación para API**
- `src/hooks/use-permissions.ts` - **Hook para manejo de permisos**

### **🗄️ Base de Datos**
- `prisma/schema.prisma` - **Esquema principal de la base de datos**
- `src/lib/db.ts` - **Configuración de Prisma**

### **🔔 Sistema de Notificaciones**
- `src/components/notifications/notification-bell.tsx` - **Componente principal**
- `src/hooks/use-notifications.ts` - **Hook de notificaciones**
- `src/lib/notification-types.ts` - **Tipos de notificaciones**
- `src/app/api/notifications/` - **API endpoints**

### **🎨 UI y Estilos**
- `src/components/ui/` - **Componentes ShadCN UI**
- `tailwind.config.ts` - **Configuración de Tailwind**
- `src/app/globals.css` - **Estilos globales**

### **⚙️ Configuración**
- `next.config.ts` - **Configuración de Next.js**
- `package.json` - **Dependencias y scripts**
- `tsconfig.json` - **Configuración de TypeScript**

---

## 📊 **Estadísticas del Proyecto**

- **Total de archivos**: ~200+ archivos
- **Componentes React**: ~80+ componentes
- **API Routes**: ~10+ endpoints
- **Hooks personalizados**: ~10+ hooks
- **Módulos principales**: 8 módulos (Dashboard, Pacientes, Citas, etc.)

---

## 🚀 **Flujo de Desarrollo**

1. **Frontend**: Componentes en `src/components/`
2. **Backend**: API routes en `src/app/api/`
3. **Base de datos**: Schema en `prisma/schema.prisma`
4. **Autenticación**: Provider en `src/components/layout/auth-provider.tsx`
5. **Estilos**: Tailwind CSS con componentes ShadCN UI

---

*Este documento se actualiza automáticamente con cada cambio en la estructura del proyecto.*
