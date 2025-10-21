# 🚀 Guía de Despliegue UroVital en Vercel + NeonTech

## 📋 Pasos para Desplegar

### 1. **Configurar NeonTech Database**

1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto:
   - **Nombre:** `UroVital`
   - **Región:** `us-east-1` (recomendado para Vercel)
   - **Base de datos:** `neondb`

4. **Copia la Connection String:**
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 2. **Configurar Vercel**

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Conecta tu cuenta de GitHub
3. Selecciona: `Akechi360/Vercel-Demo`
4. **Configuración del Proyecto:**
   - Framework Preset: `Next.js`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. **Variables de Entorno en Vercel**

Agrega estas variables en la sección "Environment Variables":

```
DATABASE_URL = postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET = tu-secret-key-muy-seguro-aqui-123456789
NEXTAUTH_URL = https://tu-app.vercel.app
```

**Importante:** Marca todas las variables para:
- ✅ Production
- ✅ Preview  
- ✅ Development

### 4. **Desplegar**

1. Haz clic en **"Deploy"**
2. Vercel construirá automáticamente
3. Una vez desplegado, ejecuta las migraciones:

```bash
# En la terminal de Vercel o localmente con la URL de producción
npx prisma db push
npx prisma db seed
```

### 5. **Verificar Despliegue**

1. Ve a tu dominio de Vercel
2. Verifica que la aplicación cargue
3. Prueba crear un usuario
4. Verifica la conexión a la base de datos

## 🔧 Comandos Útiles

```bash
# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma db push

# Poblar base de datos
npx prisma db seed

# Abrir Prisma Studio
npx prisma studio
```

## 🚨 Solución de Problemas

### Error: "DATABASE_URL references Secret"
- **Solución:** Configura la variable `DATABASE_URL` en Vercel antes de hacer deploy

### Error: "Prisma Client not generated"
- **Solución:** Agrega `"postinstall": "prisma generate"` en package.json

### Error: "Database connection failed"
- **Solución:** Verifica que la Connection String de NeonTech sea correcta

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de Vercel
2. Verifica las variables de entorno
3. Confirma que NeonTech esté activo
4. Revisa la configuración de Prisma
