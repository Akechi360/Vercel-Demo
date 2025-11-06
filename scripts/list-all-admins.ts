#!/usr/bin/env tsx

/**
 * 📋 LIST ALL ADMINS SCRIPT
 * 
 * Script para listar todos los usuarios admin en la base de datos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAllAdmins() {
  console.log('📋 Listando todos los usuarios admin...');
  
  try {
    // Buscar todos los usuarios con roles admin
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'ADMIN' },
          { email: { contains: 'master' } },
          { userId: { startsWith: 'admin' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (adminUsers.length === 0) {
      console.log('❌ No se encontraron usuarios admin');
      return;
    }

    console.log(`✅ Se encontraron ${adminUsers.length} usuario(s) admin:`);
    console.log('');

    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. Usuario Admin:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   UserId: ${user.userId}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // Mostrar recomendaciones
    console.log('💡 Recomendaciones:');
    if (adminUsers.length > 1) {
      console.log('   - Hay múltiples usuarios admin. Considera eliminar los duplicados.');
      console.log('   - Mantén solo el usuario admin principal.');
    }

  } catch (error) {
    console.error('❌ Error listando usuarios admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la lista
listAllAdmins();
