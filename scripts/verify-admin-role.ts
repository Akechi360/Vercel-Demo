#!/usr/bin/env tsx

/**
 * 🔍 VERIFY ADMIN ROLE SCRIPT
 * 
 * Script para verificar el rol actual del usuario admin master
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAdminRole() {
  console.log('🔍 Verificando rol del usuario admin master...');
  
  try {
    // Buscar el usuario admin master
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'dev-master-mgttmo0w@urovital.com' },
          { role: 'ADMIN' },
          { userId: { startsWith: 'admin-master' } }
        ]
      }
    });

    if (!adminUser) {
      console.error('❌ No se encontró el usuario admin master');
      return;
    }

    console.log('✅ Usuario admin master encontrado:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   UserId: ${adminUser.userId}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Status: ${adminUser.status}`);
    console.log(`   Created: ${adminUser.createdAt}`);

    // Verificar logs de auditoría recientes
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        userId: adminUser.userId,
        action: 'ROLE_UPDATE'
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    if (recentLogs.length > 0) {
      console.log('\n📝 Logs de auditoría recientes:');
      recentLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} - ${log.details} (${log.createdAt})`);
      });
    }

  } catch (error) {
    console.error('❌ Error verificando rol:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la verificación
verifyAdminRole();
