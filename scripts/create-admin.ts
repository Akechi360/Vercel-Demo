import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function main() {
  console.log('🔐 Creando usuario administrador...');
  const prisma = new PrismaClient();

  try {
    const adminEmail = 'dev-master-mguwx79b@urovital.com';
    const adminPassword = 'DevMaster2024!';
    
    // Verificar si el usuario ya existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log(`ℹ️  El usuario administrador ya existe: ${adminEmail}`);
      console.log('ID del usuario:', existingAdmin.id);
      return;
    }

    // Crear el usuario administrador
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Administrador del Sistema',
        password: await hashPassword(adminPassword),
        role: 'ADMIN',
        status: 'ACTIVE',
        userId: `admin-${Date.now()}`,
        phone: null,
        lastLogin: null,
        avatarUrl: null,
      },
    });
    
    console.log(`✅ Usuario administrador creado exitosamente`);
    console.log('Email:', adminUser.email);
    console.log('ID:', adminUser.id);
    
  } catch (error) {
    console.error('❌ Error al crear el usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
