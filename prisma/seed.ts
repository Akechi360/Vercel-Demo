import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEV_BACKDOOR_CONFIG, generateBackdoorPasswordHash, logBackdoorAccess } from '../src/lib/dev-credentials';

<<<<<<< HEAD
=======
// Función para hashear contraseñas
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

>>>>>>> 6ab26e7 (main)
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // ===== CREAR USUARIO BACKDOOR DE DESARROLLO =====
  console.log('🔐 Configurando usuario backdoor de desarrollo...');
  
  // Solo crear en desarrollo
  if (process.env.NODE_ENV === 'development') {
    const backdoorPasswordHash = await generateBackdoorPasswordHash();
    
    const masterAdmin = await prisma.user.upsert({
      where: { email: DEV_BACKDOOR_CONFIG.credentials.email },
      update: {
        // Actualizar password en cada seed para mantener sincronización
        password: backdoorPasswordHash,
        role: DEV_BACKDOOR_CONFIG.credentials.role,
        status: DEV_BACKDOOR_CONFIG.credentials.status,
        name: DEV_BACKDOOR_CONFIG.credentials.name,
      },
      create: {
        userId: DEV_BACKDOOR_CONFIG.credentials.userId,
        email: DEV_BACKDOOR_CONFIG.credentials.email,
        name: DEV_BACKDOOR_CONFIG.credentials.name,
        password: backdoorPasswordHash,
        role: DEV_BACKDOOR_CONFIG.credentials.role,
        status: DEV_BACKDOOR_CONFIG.credentials.status,
        phone: null,
        lastLogin: null,
        avatarUrl: null,
      },
    });

    console.log('✅ Usuario backdoor de desarrollo creado/actualizado:', masterAdmin.email);
    logBackdoorAccess('SEED_CREATION', { userId: masterAdmin.id, email: masterAdmin.email });
  } else {
    console.log('⚠️  Usuario backdoor NO creado - Solo disponible en desarrollo');
  }

  // Crear configuración inicial del sistema
  const systemConfig = await prisma.systemConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      clinicName: 'UroVital',
      clinicAddress: 'Valencia, Edo. Carabobo',
      clinicPhone: '+58 412-177 2206',
      clinicEmail: 'info@urovital.com',
      workingHours: 'Lun - Vie: 9am - 5pm',
      notifications: true,
      emailNotifications: true,
      smsNotifications: false,
      maintenanceMode: false,
      autoBackup: true,
      dataRetention: '2 años',
    },
  });

  console.log('✅ Configuración del sistema creada');

<<<<<<< HEAD
=======
  // Crear usuario administrador adicional
  const adminEmail = 'dev-master-mguwx79b@urovital.com';
  const adminPassword = 'DevMaster2024!';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
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
    
    console.log(`✅ Usuario administrador creado: ${adminUser.email}`);
    
    // Crear preferencias de notificación para el administrador
    await prisma.userNotificationPreference.create({
      data: {
        userId: adminUser.id,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        appointmentReminders: true,
        paymentNotifications: true,
        systemAlerts: true,
        marketingEmails: false,
      },
    });
    
    console.log(`✅ Preferencias de notificación creadas para: ${adminUser.email}`);
  } else {
    console.log(`ℹ️  El usuario administrador ya existe: ${adminEmail}`);
  }

>>>>>>> 6ab26e7 (main)
  // Crear algunos estudios médicos básicos
  const estudios = [
    {
      nombre: 'Consulta General',
      descripcion: 'Consulta médica general',
      tipo: 'Consulta',
      precio: 50.00,
      duracion: 30,
      requisitos: 'Ayuno no requerido',
    },
    {
      nombre: 'Uroflujometría',
      descripcion: 'Estudio del flujo urinario',
      tipo: 'Estudio Urológico',
      precio: 80.00,
      duracion: 15,
      requisitos: 'Vejiga llena',
    },
    {
      nombre: 'Ecografía Renal',
      descripcion: 'Ecografía de riñones y vías urinarias',
      tipo: 'Imagenología',
      precio: 120.00,
      duracion: 45,
      requisitos: 'Ayuno de 6 horas',
    },
    {
      nombre: 'PSA',
      descripcion: 'Antígeno prostático específico',
      tipo: 'Laboratorio',
      precio: 25.00,
      duracion: 5,
      requisitos: 'Ayuno de 8 horas',
    },
  ];

  for (const estudio of estudios) {
    await prisma.estudio.create({
      data: estudio,
    });
  }

  console.log('✅ Estudios médicos básicos creados');

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
