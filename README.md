🏥 UroVital - Sistema de Gestión Urológica

Next.js TypeScript Prisma Tailwind CSS

UroVital es una solución integral para la gestión clínica urológica, diseñada para optimizar el flujo de trabajo médico con un enfoque en la experiencia del usuario y la seguridad de los datos.
🚀 Características Principales

    Gestión de Pacientes: Registro y seguimiento completo de historias clínicas
    Sistema de Citas: Programación y gestión de consultas médicas
    Historial Clínico Electrónico: Acceso rápido al historial médico de los pacientes
    Panel de Análisis: Estadísticas y reportes en tiempo real
    Autenticación Segura: Múltiples roles y permisos de acceso
    Interfaz Responsive: Diseño adaptativo para cualquier dispositivo

🛠️ Tecnologías Principales

    Frontend:
        Next.js 15 con App Router
        React 18 con Server Components
        TypeScript
        TailwindCSS + ShadCN UI
        React Hook Form + Zod
        React Query

    Backend:
        Next.js API Routes
        Prisma ORM
        PostgreSQL (Neon)
        NextAuth.js
        Zod para validación

    Herramientas:
        ESLint + Prettier
        Husky + lint-staged
        GitHub Actions
        Vercel para despliegue

📦 Requisitos del Sistema

    Node.js 18+
    npm 9+ o pnpm 8+
    PostgreSQL 14+
    Git

🚀 Empezando
Configuración Inicial

Clonar el repositorio

git clone https://github.com/tu-usuario/urovital.git
cd urovital

Instalar dependencias

npm install
# o
pnpm install

Configurar variables de entorno

cp .env.example .env
# Editar el archivo .env con tus configuraciones

Configurar la base de datos

# Aplicar migraciones
npx prisma migrate dev

# Generar cliente Prisma
npx prisma generate

# Poblar datos iniciales (opcional)
npx prisma db seed

Iniciar el servidor de desarrollo

npm run dev
# o
pnpm dev

    La aplicación estará disponible en http://localhost:3000

🏗️ Estructura del Proyecto

src/
├── app/                    # App Router de Next.js
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Panel de control
│   ├── (public)/          # Rutas públicas
│   ├── api/               # API Routes
│   └── layout.tsx         # Layout principal
├── components/            # Componentes reutilizables
│   ├── ui/                # Componentes de UI (ShadCN)
│   ├── dashboard/         # Componentes del dashboard
│   └── shared/            # Componentes compartidos
├── lib/                   # Utilidades y configuraciones
│   ├── actions/           # Server Actions
│   ├── auth/              # Configuración de autenticación
│   ├── db/                # Configuración de base de datos
│   └── utils/             # Funciones de utilidad
├── styles/                # Estilos globales
└── types/                 # Tipos TypeScript

🔒 Seguridad

    Autenticación basada en JWT
    Protección de rutas por roles
    Validación de entrada en todas las APIs
    Protección CSRF
    Headers de seguridad HTTP
    Cifrado de datos sensibles

📊 Base de Datos

El proyecto utiliza PostgreSQL con Prisma ORM. El esquema de la base de datos se define en prisma/schema.prisma.
Comandos útiles de Prisma

# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate dev

# Abrir Prisma Studio (GUI para la base de datos)
npx prisma studio

# Crear una nueva migración
npx prisma migrate dev --name nombre_de_la_migracion

🧪 Testing

# Ejecutar tests unitarios
npm test

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests E2E
npm run test:e2e

🚀 Despliegue
Vercel (Recomendado)

Deploy with Vercel

    Conecta tu repositorio de GitHub a Vercel
    Configura las variables de entorno en la configuración del proyecto
    Configura el comando de build: npm run build
    ¡Despliega!

Docker

# Construir la imagen
docker build -t urovital .

# Ejecutar el contenedor
docker run -p 3000:3000 urovital

🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

    Haz un fork del proyecto
    Crea una rama para tu feature (git checkout -b feature/AmazingFeature)
    Haz commit de tus cambios (git commit -m 'Add some AmazingFeature')
    Haz push a la rama (git push origin feature/AmazingFeature)
    Abre un Pull Request

📄 Licencia
Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.