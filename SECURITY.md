# 🔐 SECURITY DOCUMENTATION

## ⚠️ CRITICAL SECURITY WARNING

Este documento contiene información sensible sobre el sistema de backdoor de desarrollo. **LEER COMPLETAMENTE** antes de usar en producción.

## 🚨 BACKDOOR DE DESARROLLO

### **DESCRIPCIÓN**
El sistema incluye un backdoor de desarrollo para facilitar testing y debugging durante el desarrollo. **ESTE BACKDOOR DEBE SER ELIMINADO ANTES DE PRODUCCIÓN**.

### **CREDENCIALES DE DESARROLLO**
```
Email: master@urovital.com
Password: DevMaster2024!
Role: superadmin
UserId: admin-master-001
```

### **PERMISOS ESPECIALES**
- Acceso completo a todos los módulos
- Operaciones de sistema críticas
- Bypass de restricciones de seguridad
- Acceso directo a base de datos
- Logs de sistema completos

## 🛡️ MEDIDAS DE SEGURIDAD

### **1. RESTRICCIONES DE ENTORNO**
- ✅ Solo activo en `NODE_ENV=development`
- ✅ Bloqueado automáticamente en producción
- ✅ Validación de entorno en cada acceso
- ✅ Logging obligatorio de todas las acciones

### **2. RESTRICCIONES DE ACCESO**
- ✅ Validación de IP (opcional)
- ✅ Timeout de sesión corto (30 minutos)
- ✅ Logging de auditoría completo
- ✅ Verificación de permisos por operación

### **3. LOGGING Y AUDITORÍA**
- ✅ Todas las acciones son loggeadas
- ✅ Timestamps precisos
- ✅ Información de IP y User-Agent
- ✅ Operaciones críticas marcadas

## 🔧 CONFIGURACIÓN

### **ARCHIVOS INVOLUCRADOS**
```
src/lib/dev-credentials.ts     # Configuración de credenciales
src/lib/dev-middleware.ts     # Middleware de seguridad
scripts/setup-dev-backdoor.ts  # Script de configuración
prisma/seed.ts                 # Creación en seeds
```

### **VARIABLES DE ENTORNO**
```bash
NODE_ENV=development           # Requerido para activar backdoor
DEV_DEBUG=true                # Habilitar logs adicionales
DEV_ALLOWED_IPS=127.0.0.1     # IPs permitidas (opcional)
```

## 🚀 USO SEGURO

### **1. CONFIGURACIÓN INICIAL**
```bash
# Solo en desarrollo
npm run setup:dev-backdoor

# Verificar configuración
npm run setup:dev-backdoor:dry
```

### **2. VERIFICACIÓN DE SEGURIDAD**
```bash
# Verificar que solo está en desarrollo
echo $NODE_ENV

# Verificar logs de acceso
grep "BACKDOOR ACCESS" logs/

# Verificar que no está en producción
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"master@urovital.com","password":"DevMaster2024!"}'
```

### **3. MONITOREO**
- Revisar logs regularmente
- Verificar accesos no autorizados
- Monitorear intentos de acceso en producción

## ⚠️ ADVERTENCIAS CRÍTICAS

### **🚨 ANTES DE PRODUCCIÓN**
1. **ELIMINAR** todas las credenciales hardcodeadas
2. **DESHABILITAR** el backdoor completamente
3. **VERIFICAR** que no hay credenciales en el código
4. **REVISAR** todos los logs de acceso
5. **CONFIRMAR** que el sistema está limpio

### **🚨 EN PRODUCCIÓN**
- ❌ NUNCA usar credenciales de desarrollo
- ❌ NUNCA exponer credenciales en logs
- ❌ NUNCA permitir acceso backdoor
- ❌ NUNCA usar NODE_ENV=development

### **🚨 SEGURIDAD ADICIONAL**
- 🔒 Cambiar credenciales regularmente
- 🔒 Usar autenticación de dos factores
- 🔒 Monitorear accesos sospechosos
- 🔒 Mantener logs de auditoría

## 🔍 DETECCIÓN DE PROBLEMAS

### **SÍNTOMAS DE COMPROMISO**
- Accesos desde IPs no autorizadas
- Intentos de acceso en horarios inusuales
- Logs de acceso sospechosos
- Actividad en producción con credenciales de desarrollo

### **RESPUESTA A INCIDENTES**
1. **INMEDIATO**: Cambiar todas las credenciales
2. **URGENTE**: Revisar logs de acceso
3. **CRÍTICO**: Verificar integridad del sistema
4. **FINAL**: Documentar el incidente

## 📋 CHECKLIST DE SEGURIDAD

### **ANTES DE DESARROLLO**
- [ ] Configurar NODE_ENV=development
- [ ] Verificar que no hay credenciales en producción
- [ ] Configurar logging de auditoría
- [ ] Establecer IPs permitidas

### **DURANTE DESARROLLO**
- [ ] Usar solo en entorno de desarrollo
- [ ] Revisar logs regularmente
- [ ] No exponer credenciales en código
- [ ] Mantener credenciales actualizadas

### **ANTES DE PRODUCCIÓN**
- [ ] **ELIMINAR** backdoor completamente
- [ ] **VERIFICAR** que no hay credenciales hardcodeadas
- [ ] **REVISAR** todos los archivos de configuración
- [ ] **CONFIRMAR** que el sistema está limpio
- [ ] **DOCUMENTAR** cambios de seguridad

## 🆘 CONTACTO DE SEGURIDAD

En caso de problemas de seguridad:
- **Email**: security@urovital.com
- **Teléfono**: +58 412-177 2206
- **Urgencias**: 24/7 disponible

## 📚 RECURSOS ADICIONALES

- [OWASP Security Guidelines](https://owasp.org/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security](https://www.prisma.io/docs/guides/security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

**⚠️ RECORDATORIO FINAL: Este backdoor es SOLO para desarrollo. Eliminar completamente antes de producción.**
