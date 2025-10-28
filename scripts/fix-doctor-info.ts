import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

// Función para formatear objetos para mejor visualización
function formatObject(obj: any) {
  return JSON.stringify(obj, null, 2);
}

async function main() {
  console.log('🔍 Verificando información del doctor...');
  const prisma = new PrismaClient();

  try {
    // Datos del usuario doctor (Juan Carlos)
    const userEmail = 'juancarlos.urologo@urovital.com';
    
    // 1. Buscar el usuario incluyendo el campo userId y la información relacionada
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,  // Necesario para el teléfono
        userId: true,  // Necesitamos este campo para la relación
        doctorInfo: true,
        patientInfo: true
      }
    });

    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    console.log(`\n👤 Usuario encontrado: ${user.name} (${user.email})`);
    console.log(`🔑 ID: ${user.id}`);
    console.log(`🎭 Rol actual: ${user.role}`);

    // 2. Verificar si ya tiene doctorInfo
    if (user.doctorInfo) {
      console.log('✅ El usuario ya tiene un registro en doctorInfo:');
      console.log(JSON.stringify(user.doctorInfo, null, 2));
      return;
    }

    console.log('⚠️  El usuario no tiene registro en doctorInfo. Creando...');

    // 3. Verificar si el ID del usuario es válido
    console.log('\n🔍 Verificando ID de usuario...');
    const userExists = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true }
    });
    
    if (!userExists) {
      console.error('❌ El ID del usuario no existe en la base de datos');
      console.log('ID proporcionado:', user.id);
      return;
    }

    console.log('✅ Usuario verificado:', formatObject(userExists));

    // 4. Intentar crear el registro en doctorInfo con manejo de errores detallado
    try {
      // Verificar que el userId existe
      if (!user.userId) {
        throw new Error('El usuario no tiene un userId válido. No se puede crear el registro de doctor.');
      }

      // Crear el registro en doctorInfo
      const doctorInfo = await prisma.$transaction(async (tx) => {
        // Primero actualizar el rol si es necesario
        if (user.role !== 'DOCTOR') {
          console.log('🔄 Actualizando rol a DOCTOR...');
          await tx.user.update({
            where: { id: user.id },
            data: { role: 'DOCTOR' }
          });
          console.log('✅ Rol actualizado a DOCTOR');
        }

        // Luego crear el registro en doctorInfo usando el userId
        return await tx.doctorInfo.create({
          data: {
            userId: user.userId,  // Usar user.userId en lugar de user.id
            especialidad: 'Urología',
            cedula: `DOC-${Date.now().toString().slice(-6)}`,
            telefono: user.phone || '',
            direccion: '',
            area: 'Urología',
            contacto: '',
          },
        });
      });

      console.log('\n✅ Registro de doctor creado exitosamente:');
      console.log(formatObject(doctorInfo));
      
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('\n❌ Error de Prisma al crear doctorInfo:');
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);
        console.error('Meta:', error.meta);
        
        // Si el error es de restricción única, verificar si ya existe
        if (error.code === 'P2002') {
          console.log('\n⚠️  Ya existe un registro con estos datos. Buscando...');
          const existingDoctor = await prisma.doctorInfo.findFirst({
            where: { userId: user.id }
          });
          console.log('Registro existente:', existingDoctor);
        }
      } else {
        console.error('\n❌ Error inesperado:', error);
      }
    }

    // La variable doctorInfo ya se maneja dentro del bloque try
    
  } catch (error) {
    console.error('\n❌ Error al verificar/crear doctorInfo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
