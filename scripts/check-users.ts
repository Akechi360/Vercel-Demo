/**
 * Script para verificar usuarios existentes en la base de datos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 Verificando usuarios en la base de datos...');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuarios:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   UserID: ${user.userId}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Buscar usuarios admin específicamente
    const adminUsers = users.filter(user => 
      user.role === 'ADMIN'
    );

    if (adminUsers.length > 0) {
      console.log('🔑 Usuarios admin encontrados:');
      adminUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    } else {
      console.log('⚠️ No se encontraron usuarios admin');
    }

  } catch (error) {
    console.error('❌ Error verificando usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
checkUsers();
