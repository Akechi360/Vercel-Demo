#!/usr/bin/env tsx

/**
 * 🔧 UPDATE ADMIN ROLE SCRIPT
 * 
 * Script para cambiar el rol del usuario admin master a "ADMIN"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdminRole() {
  console.log('🔧 Actualizando rol del usuario admin master...');
  
  try {
    // Buscar el usuario admin master
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'dev-master-mgttmo0w@urovital.com' },
          { role: 'superadmin' },
          { userId: { startsWith: 'admin-master' } }
        ]
      }
    });

    if (!adminUser) {
      console.error('❌ No se encontró el usuario admin master');
      return;
    }

    console.log('👤 Usuario encontrado:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role actual: ${adminUser.role}`);
    console.log(`   UserId: ${adminUser.userId}`);

    // Actualizar el rol a ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: 'ADMIN' }
    });

    console.log('✅ Rol actualizado exitosamente:');
    console.log(`   Role anterior: ${adminUser.role}`);
    console.log(`   Role nuevo: ${updatedUser.role}`);

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.userId,
        action: 'ROLE_UPDATE',
        details: `Rol cambiado de ${adminUser.role} a ${updatedUser.role} para usuario ${updatedUser.email}`
      }
    });

    console.log('📝 Log de auditoría creado');

  } catch (error) {
    console.error('❌ Error actualizando rol:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la actualización
updateAdminRole();
