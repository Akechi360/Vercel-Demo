# Configuración de Base de Datos - UroVital

## Pasos para configurar la base de datos PostgreSQL

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Asegúrate de que el archivo `.env` contenga:
```
DATABASE_URL="postgresql://uro:uro123@localhost:5432/urovital"
```

### 3. Configurar PostgreSQL
- Crear la base de datos `urovital`
- Crear el usuario `uro` con contraseña `uro123`
- Otorgar permisos al usuario

### 4. Generar cliente Prisma
```bash
npm run db:generate
```

### 5. Aplicar el esquema a la base de datos
```bash
npm run db:push
```

### 6. Ejecutar seed (crear datos iniciales)
```bash
npm run db:seed
```

### 7. Iniciar la aplicación
```bash
npm run dev
```

## Credenciales del Usuario Master

- **Email**: `[REDACTED]`
- **Contraseña**: `[REDACTED]`
- **Rol**: Administrador

## Comandos útiles

- `npm run db:reset` - Resetear base de datos y ejecutar seed
- `npm run db:migrate` - Crear migraciones
- `npm run db:push` - Aplicar cambios sin migraciones

## Notas

- La aplicación funcionará sin base de datos, pero con funcionalidad limitada
- El login del usuario master funcionará incluso sin base de datos configurada
- Para funcionalidad completa, es necesario configurar PostgreSQL
