#!/usr/bin/env tsx

/**
 * 🔧 UPDATE LATEST ADMIN ROLE SCRIPT
 * 
 * Script para cambiar el rol del usuario admin más reciente a "ADMIN"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLatestAdminRole() {
  console.log('🔧 Actualizando rol del usuario admin más reciente...');
  
  try {
    // Buscar el usuario admin más reciente (el que tiene superadmin)
    const latestAdmin = await prisma.user.findFirst({
      where: {
        email: 'dev-master-mgttmo0w@urovital.com',
        role: 'ADMIN'
      }
    });

    if (!latestAdmin) {
      console.error('❌ No se encontró el usuario admin más reciente');
      return;
    }

    console.log('👤 Usuario encontrado:');
    console.log(`   ID: ${latestAdmin.id}`);
    console.log(`   Email: ${latestAdmin.email}`);
    console.log(`   Role actual: ${latestAdmin.role}`);
    console.log(`   UserId: ${latestAdmin.userId}`);

    // Actualizar el rol a ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: latestAdmin.id },
      data: { role: 'ADMIN' }
    });

    console.log('✅ Rol actualizado exitosamente:');
    console.log(`   Role anterior: ${latestAdmin.role}`);
    console.log(`   Role nuevo: ${updatedUser.role}`);

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.userId,
        action: 'ROLE_UPDATE',
        details: `Rol cambiado de ${latestAdmin.role} a ${updatedUser.role} para usuario ${updatedUser.email}`
      }
    });

    console.log('📝 Log de auditoría creado');

    // Verificar el resultado final
    console.log('\n🔍 Verificación final:');
    const finalUser = await prisma.user.findUnique({
      where: { id: updatedUser.id }
    });
    
    console.log(`   Email: ${finalUser?.email}`);
    console.log(`   Role: ${finalUser?.role}`);
    console.log(`   UserId: ${finalUser?.userId}`);

  } catch (error) {
    console.error('❌ Error actualizando rol:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la actualización
updateLatestAdminRole();
