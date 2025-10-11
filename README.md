# UroVital - Sistema de Gestión Urológica

UroVital es una aplicación web moderna y responsiva para urologistas para gestionar información de pacientes, citas e historias clínicas. Construida con Next.js, TailwindCSS, Prisma y ShadCN UI.

## 🚀 Despliegue Rápido

### Opción 1: Despliegue en Vercel (Recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tu-usuario/urovital)

1. **Fork este repositorio**
2. **Conecta con Vercel**:
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio
   - Configura las variables de entorno (ver sección Variables de Entorno)

3. **Configura Neon Database**:
   - Ve a [neon.tech](https://neon.tech)
   - Crea una nueva base de datos
   - Copia la connection string

### Opción 2: Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/urovital.git
cd urovital

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus configuraciones

# Configurar base de datos
npm run db:generate
npm run db:push
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

## 🔧 Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

```env
# Base de datos (Neon PostgreSQL para producción)
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Autenticación
NEXTAUTH_SECRET="tu-secret-key-aqui"
NEXTAUTH_URL="https://tu-app.vercel.app"

# Google AI (Opcional)
GOOGLE_GENAI_API_KEY="tu-api-key-aqui"
```

## 👤 Usuario Master

- **Email**: `master@urovital.com`
- **Contraseña**: `M4st3r36048@`
- **Rol**: Administrador

## 🛠️ Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Servidor de producción

# Base de datos
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Aplicar esquema a la DB
npm run db:migrate   # Crear migraciones
npm run db:seed      # Datos iniciales
npm run db:reset     # Resetear DB y ejecutar seed

# Utilidades
npm run lint         # Linter
npm run typecheck    # Verificación de tipos
```

## 🏗️ Arquitectura

- **Frontend**: Next.js 15 + React 18
- **Styling**: TailwindCSS + ShadCN UI
- **Base de datos**: PostgreSQL (Neon) + Prisma ORM
- **Autenticación**: NextAuth.js
- **Despliegue**: Vercel
- **AI**: Google Genkit (opcional)

## 📁 Estructura del Proyecto

```
src/
├── app/                 # App Router de Next.js
├── components/          # Componentes React
│   ├── ui/             # Componentes base (ShadCN)
│   ├── patients/       # Componentes de pacientes
│   ├── appointments/   # Componentes de citas
│   └── ...
├── lib/                # Utilidades y lógica
│   ├── actions.ts      # Server Actions
│   ├── types.ts        # Tipos TypeScript
│   └── store/          # Estado global (Zustand)
└── hooks/              # Custom hooks
```

## 🔐 Roles y Permisos

- **Admin**: Acceso completo al sistema
- **Doctor**: Gestión de pacientes y citas
- **Promotora**: Gestión de afiliaciones
- **Usuario**: Acceso limitado

## 📊 Funcionalidades

- ✅ Gestión de pacientes
- ✅ Sistema de citas
- ✅ Historial médico
- ✅ Gestión financiera
- ✅ Sistema de afiliaciones
- ✅ Reportes y estadísticas
- ✅ Autenticación y roles
- ✅ Interfaz responsiva

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.
