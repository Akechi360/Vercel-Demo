# Guía de Despliegue - UroVital

## 🚀 Pasos para Desplegar en Vercel + Neon

### 1. Preparar el Repositorio GitHub

```bash
# Inicializar git si no está inicializado
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "Initial commit: UroVital medical management system"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/TU-USUARIO/urovital.git
git branch -M main
git push -u origin main
```

### 2. Configurar Neon Database

1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto llamado "urovital"
4. Copia la **Connection String** que se ve así:
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu cuenta de GitHub
3. Importa el repositorio "urovital"
4. Configura las variables de entorno:

   **Variables de Entorno en Vercel:**
   ```
   DATABASE_URL = postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   NEXTAUTH_SECRET = tu-secret-key-muy-seguro-aqui
   NEXTAUTH_URL = https://tu-app.vercel.app
   ```

5. Haz clic en "Deploy"

### 4. Configurar la Base de Datos

Después del despliegue, necesitas ejecutar las migraciones:

```bash
# Opción 1: Usar Vercel CLI
npx vercel env pull .env.local
npx prisma db push
npx prisma db seed

# Opción 2: Usar el dashboard de Neon
# Ve a tu proyecto en Neon y ejecuta las migraciones desde ahí
```

### 5. Verificar el Despliegue

1. Ve a tu URL de Vercel (ej: `https://urovital.vercel.app`)
2. Intenta hacer login con:
   - **Email**: `master@urovital.com`
   - **Contraseña**: `M4st3r36048@`

## 🔧 Comandos Útiles

```bash
# Ver logs de Vercel
npx vercel logs

# Conectar a la base de datos localmente
npx vercel env pull .env.local

# Ejecutar migraciones
npx prisma db push

# Ejecutar seed
npx prisma db seed

# Abrir dashboard de Prisma
npx prisma studio
```

## 🐛 Solución de Problemas

### Error de Conexión a la Base de Datos
- Verifica que la `DATABASE_URL` esté correcta en Vercel
- Asegúrate de que Neon esté ejecutándose
- Verifica que las migraciones se hayan ejecutado

### Error de Autenticación
- Verifica que `NEXTAUTH_SECRET` esté configurado
- Asegúrate de que `NEXTAUTH_URL` coincida con tu dominio de Vercel

### Error de Build
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build en Vercel

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica las variables de entorno
3. Asegúrate de que la base de datos esté configurada correctamente
