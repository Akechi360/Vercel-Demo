import { PrismaClient, UserRole } from '@prisma/client';

async function main() {
  console.log('🔄 Actualizando usuario a doctor...');
  const prisma = new PrismaClient();

  try {
    // Reemplaza con el ID o email del usuario que quieres actualizar
    const userEmail = 'email-del-usuario@ejemplo.com';
    
    // 1. Buscar el usuario existente
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        patientInfo: true, // Incluir información del paciente si existe
      },
    });

    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    console.log(`🔍 Usuario encontrado: ${user.name} (${user.email})`);
    console.log(`Rol actual: ${user.role}`);

    // 2. Actualizar el usuario a DOCTOR y crear el registro en doctorInfo
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Actualizar el rol del usuario
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          role: 'DOCTOR' as UserRole,
        },
      });

      // Crear el registro en doctorInfo
      await tx.doctorInfo.create({
        data: {
          userId: user.id,
          especialidad: 'Urología', // Especialidad por defecto
          cedula: `DOC-${Date.now().toString().slice(-6)}`, // Cédula temporal
          telefono: user.phone || '',
          direccion: '',
          area: 'Urología',
          contacto: '',
        },
      });

      console.log('✅ Registro de doctor creado exitosamente');
      return updated;
    });

    console.log(`\n✅ Usuario actualizado a DOCTOR exitosamente`);
    console.log(`Nuevo rol: ${updatedUser.role}`);
    
  } catch (error) {
    console.error('❌ Error al actualizar el usuario a doctor:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
