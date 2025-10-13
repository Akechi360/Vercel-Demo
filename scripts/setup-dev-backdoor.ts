#!/usr/bin/env tsx

/**
 * 🔐 DEVELOPMENT BACKDOOR SETUP SCRIPT
 * 
 * Script seguro para configurar el backdoor de desarrollo
 * 
 * ⚠️  SECURITY WARNING:
 * - Solo ejecutar en NODE_ENV=development
 * - Credenciales hardcodeadas para desarrollo
 * - Eliminar antes de producción
 * 
 * 🚀 USAGE:
 * npm run setup:dev-backdoor
 * 
 * 🛡️  SECURITY:
 * - Validación de entorno
 * - Logging de auditoría
 * - Verificación de permisos
 */

import { PrismaClient } from '@prisma/client';
import { 
  DEV_BACKDOOR_CONFIG, 
  generateBackdoorPasswordHash,
  logBackdoorAccess,
  isBackdoorSafe 
} from '../src/lib/dev-credentials';

const prisma = new PrismaClient();

async function setupDevBackdoor() {
  console.log('🔐 Configurando backdoor de desarrollo...');
  
  // Verificar que estemos en desarrollo
  if (!isBackdoorSafe()) {
    console.error('🚨 ERROR: Solo se puede ejecutar en NODE_ENV=development');
    console.error('   Para seguridad, este script está bloqueado en producción');
    process.exit(1);
  }
  
  try {
    console.log('📋 Configuración del backdoor:');
    console.log(`   Email: ${DEV_BACKDOOR_CONFIG.credentials.email}`);
    console.log(`   Role: ${DEV_BACKDOOR_CONFIG.credentials.role}`);
    console.log(`   UserId: ${DEV_BACKDOOR_CONFIG.credentials.userId}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    
    // Generar hash de password
    console.log('🔑 Generando hash de password...');
    const passwordHash = await generateBackdoorPasswordHash();
    
    // Crear o actualizar usuario backdoor
    console.log('👤 Creando/actualizando usuario backdoor...');
    const backdoorUser = await prisma.user.upsert({
      where: { email: DEV_BACKDOOR_CONFIG.credentials.email },
      update: {
        password: passwordHash,
        role: DEV_BACKDOOR_CONFIG.credentials.role,
        status: DEV_BACKDOOR_CONFIG.credentials.status,
        name: DEV_BACKDOOR_CONFIG.credentials.name,
        userId: DEV_BACKDOOR_CONFIG.credentials.userId,
        lastLogin: null,
      },
      create: {
        userId: DEV_BACKDOOR_CONFIG.credentials.userId,
        email: DEV_BACKDOOR_CONFIG.credentials.email,
        name: DEV_BACKDOOR_CONFIG.credentials.name,
        password: passwordHash,
        role: DEV_BACKDOOR_CONFIG.credentials.role,
        status: DEV_BACKDOOR_CONFIG.credentials.status,
        phone: null,
        lastLogin: null,
        avatarUrl: null,
      },
    });
    
    console.log('✅ Usuario backdoor configurado exitosamente:');
    console.log(`   ID: ${backdoorUser.id}`);
    console.log(`   UserId: ${backdoorUser.userId}`);
    console.log(`   Email: ${backdoorUser.email}`);
    console.log(`   Role: ${backdoorUser.role}`);
    console.log(`   Status: ${backdoorUser.status}`);
    
    // Log de auditoría
    logBackdoorAccess('SETUP_COMPLETED', {
      userId: backdoorUser.id,
      email: backdoorUser.email,
      role: backdoorUser.role,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
    // Mostrar información de seguridad
    console.log('\n🛡️  INFORMACIÓN DE SEGURIDAD:');
    console.log('   ⚠️  Este backdoor es SOLO para desarrollo');
    console.log('   ⚠️  Eliminar antes de producción');
    console.log('   ⚠️  Todas las acciones son loggeadas');
    console.log('   ⚠️  Acceso restringido por IP (opcional)');
    
    console.log('\n🔑 CREDENCIALES DE DESARROLLO:');
    console.log(`   Email: ${DEV_BACKDOOR_CONFIG.credentials.email}`);
    console.log(`   Password: [HIDDEN - Ver archivo de configuración]`);
    console.log(`   Permisos: ${DEV_BACKDOOR_CONFIG.permissions.operations.join(', ')}`);
    
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('   1. Verificar que el usuario se creó correctamente');
    console.log('   2. Probar login con las credenciales');
    console.log('   3. Verificar logs de auditoría');
    console.log('   4. Eliminar antes de producción');
    
  } catch (error) {
    console.error('❌ Error configurando backdoor:', error);
    logBackdoorAccess('SETUP_ERROR', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔐 DEVELOPMENT BACKDOOR SETUP

USAGE:
  npm run setup:dev-backdoor
  tsx scripts/setup-dev-backdoor.ts

OPTIONS:
  --help, -h     Mostrar esta ayuda
  --force        Forzar ejecución (peligroso)
  --dry-run      Simular sin ejecutar

SECURITY:
  - Solo funciona en NODE_ENV=development
  - Credenciales hardcodeadas para desarrollo
  - Todas las acciones son loggeadas
  - Eliminar antes de producción

EXAMPLES:
  npm run setup:dev-backdoor
  tsx scripts/setup-dev-backdoor.ts --dry-run
  `);
  process.exit(0);
}

if (args.includes('--dry-run')) {
  console.log('🔍 MODO DRY-RUN: Simulando configuración...');
  console.log('   (No se realizarán cambios en la base de datos)');
  console.log('   Email:', DEV_BACKDOOR_CONFIG.credentials.email);
  console.log('   Role:', DEV_BACKDOOR_CONFIG.credentials.role);
  console.log('   Environment:', process.env.NODE_ENV);
  process.exit(0);
}

// Ejecutar configuración
setupDevBackdoor().catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
