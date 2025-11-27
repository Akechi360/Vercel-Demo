# Documentación del Proyecto UroVital

## Descripción General
UroVital es un sistema de gestión médica urológica diseñado para modernizar la administración de pacientes, citas y expedientes médicos. La plataforma ofrece una solución integral tanto para médicos como para pacientes, facilitando la telemedicina y el seguimiento clínico.

## Tecnologías Usadas

### Core
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Base de Datos**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)

### UI & Estilos
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes**: [Radix UI](https://www.radix-ui.com/), [HeroUI](https://heroui.com/)
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/), [Animate.css](https://animate.style/)
- **Gráficos**: [ApexCharts](https://apexcharts.com/), [Recharts](https://recharts.org/)

### Utilidades & Librerías
- **Autenticación**: Custom Auth (con bcryptjs para hashing)
- **Formularios**: React Hook Form + Zod
- **Fechas**: date-fns
- **PDF**: jspdf, jspdf-autotable
- **Estado Global**: Zustand

## Estructura del Proyecto

El proyecto sigue la arquitectura de Next.js App Router:

### `src/app`
Contiene las rutas de la aplicación, organizadas en grupos de rutas:

#### `(public)` - Rutas Públicas
Accesibles sin autenticación.
- **/landing**: Página principal con información del servicio.
- **/afiliacion**: Página para registro y afiliación de nuevos usuarios.
- **/directorio**: Directorio médico (en desarrollo).
- **/estudios**: Información sobre estudios médicos.

#### `(auth)` - Autenticación
Rutas para el manejo de sesiones.
- **/login**: Inicio de sesión.
- **/register**: Registro de nuevos usuarios.
- **/forgot-password**: Recuperación de contraseña.

#### `(app)` - Rutas Protegidas (Dashboard)
Requieren autenticación. Contiene la lógica principal del sistema.
- **/dashboard**: Panel principal con métricas y resumen.
- **/patients**: Gestión de pacientes (lista, creación, detalles).
- **/appointments**: Gestión de citas médicas.
- **/afiliaciones**: Gestión de afiliaciones y planes.
- **/finanzas**: Módulo financiero (facturación, reportes).
- **/admin**: Panel de administración del sistema.
- **/settings**: Configuración de usuario y sistema.
- **/auditoria**: Registro de actividades y auditoría.
- **/companies**: Gestión de empresas aseguradoras/convenios.

### `src/components`
Componentes reutilizables de la interfaz.
- **/ui**: Componentes base (botones, inputs, cards, etc.).
- **/layout**: Componentes de estructura (sidebar, header).
- **/animations**: Componentes animados (contadores, transiciones).

### `src/lib`
Utilidades y configuraciones.
- **prisma.ts**: Cliente de Prisma instanciado.
- **utils.ts**: Funciones de utilidad generales (cn, formatters).

## Funcionalidades Principales

### Gestión de Pacientes
Permite registrar, buscar y visualizar el expediente de los pacientes. Incluye historial médico, datos personales y seguimiento.

### Citas Médicas
Sistema de agendamiento para consultas presenciales y telemedicina. Permite a los médicos gestionar su disponibilidad.

### Finanzas
Control de facturación, pagos y reportes financieros.

### Seguridad
El sistema implementa autenticación segura y protección de rutas mediante middleware.

## Cómo Usar la Aplicación

### Instalación y Ejecución Local

1.  **Clonar el repositorio**
2.  **Instalar dependencias**:
    ```bash
    npm install
    ```
3.  **Configurar variables de entorno**:
    Crear un archivo `.env` basado en `.env.example` con las credenciales de la base de datos.
4.  **Inicializar base de datos**:
    ```bash
    npm run db:migrate
    npm run db:seed
    ```
5.  **Ejecutar servidor de desarrollo**:
    ```bash
    npm run dev
    ```

### Comandos Útiles
- `npm run build`: Construir para producción.
- `npm run db:studio`: Abrir interfaz visual de Prisma para la base de datos.
- `npm run lint`: Ejecutar linter.