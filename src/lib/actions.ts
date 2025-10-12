'use server';

import type { Patient, Appointment, Consultation, LabResult, IpssScore, Report, Company, Supply, Provider, PaymentMethod, PaymentType, Payment, Doctor, Estudio, AffiliateLead } from './types';
import { User } from '@prisma/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { getPrismaClient, isDatabaseAvailable } from './db';

// Función para obtener el cliente de Prisma de manera segura
const getPrisma = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required but not found in environment variables');
  }
  return getPrismaClient();
};

// Función helper para ejecutar operaciones de base de datos con manejo de errores
const withDatabase = async <T>(operation: (prisma: any) => Promise<T>, fallbackValue?: T): Promise<T> => {
  // Durante el build, siempre usar fallback si está disponible
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    console.log('Build time - using fallback value');
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    return [] as T;
  }

  const isAvailable = await isDatabaseAvailable();
  if (!isAvailable) {
    console.log('Database not available - using fallback value');
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    throw new Error('Database not configured');
  }
  const prisma = getPrismaClient();
  return await operation(prisma);
};

// Simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    return await isDatabaseAvailable();
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// PATIENT ACTIONS
export async function getPatients(): Promise<Patient[]> {
  try {
    const isAvailable = await isDatabaseAvailable();
    if (!isAvailable) {
      console.log('Database not available - returning empty array');
      return [];
    }
    const prisma = getPrisma();
    
    // Obtener usuarios con rol 'patient' y su información específica
    const patients = await prisma.user.findMany({
      where: { role: 'patient' },
      include: {
        patientInfo: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return patients.map(user => {
      const patientInfo = user.patientInfo;
      if (!patientInfo) {
        // Si no tiene patientInfo, crear datos por defecto
        return {
          id: user.userId, // Usar userId como ID
          name: user.name,
          cedula: 'No especificada',
          age: 0,
        gender: 'Otro' as const,
        bloodType: 'O+' as const,
          status: user.status === 'ACTIVE' ? 'Activo' as const : 'Inactivo' as const,
          lastVisit: user.lastLogin?.toISOString() || user.createdAt.toISOString(),
          contact: {
            phone: user.phone || '',
            email: user.email || '',
          },
          companyId: undefined,
        };
      }
      
      const age = Math.floor((Date.now() - patientInfo.fechaNacimiento.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return {
        id: user.userId, // Usar userId como ID
        name: user.name,
        cedula: patientInfo.cedula,
        age,
        gender: (patientInfo.gender as 'Masculino' | 'Femenino' | 'Otro') || 'Otro',
        bloodType: (patientInfo.bloodType as 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-') || 'O+',
        status: user.status === 'ACTIVE' ? 'Activo' as const : 'Inactivo' as const,
        lastVisit: user.lastLogin?.toISOString() || user.createdAt.toISOString(),
        contact: {
          phone: patientInfo.telefono || user.phone || '',
          email: user.email || '',
        },
        companyId: undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
}

export async function addPatient(patientData: {
  name: string;
  age: number;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  bloodType: string;
  cedula: string;
  contact: {
    phone: string;
    email: string;
  };
  companyId?: string;
}): Promise<Patient> {
  try {
    console.log('addPatient called with data:', JSON.stringify(patientData, null, 2));
    
    const isAvailable = await isDatabaseAvailable();
    if (!isAvailable) {
      throw new Error('Database not available. Please configure DATABASE_URL in your environment variables.');
    }
    
    // Validate required fields
    if (!patientData.name || patientData.name.trim().length === 0) {
      throw new Error('El nombre es requerido');
    }
    if (!patientData.age || patientData.age <= 0) {
      throw new Error('La edad debe ser mayor a 0');
    }
    if (!patientData.gender) {
      throw new Error('El género es requerido');
    }
    
    const [nombre, apellido] = patientData.name.split(' ', 2);
    const fechaNacimiento = new Date(Date.now() - patientData.age * 365.25 * 24 * 60 * 60 * 1000);
    
    console.log('Creating patient with data:', {
      nombre: nombre || patientData.name,
      apellido: apellido || '',
      cedula: patientData.cedula,
      fechaNacimiento,
      telefono: patientData.contact.phone,
      email: patientData.contact.email,
      direccion: '',
    });
    
    // Create patient using withDatabase
    const result = await withDatabase(async (prisma) => {
      const patient = await prisma.patient.create({
        data: {
          nombre: nombre || patientData.name,
          apellido: apellido || '',
          cedula: patientData.cedula,
          fechaNacimiento,
          telefono: patientData.contact.phone,
          email: patientData.contact.email,
          direccion: '', // Default empty address
          bloodType: patientData.bloodType,
          gender: patientData.gender,
        },
      });
      
      console.log('Patient created successfully:', patient);

      // Create user for the patient
      const user = await prisma.user.create({
        data: {
          name: patientData.name,
          email: patientData.contact.email || `${patient.id}@patient.local`,
          password: 'temp-password', // Temporary password, should be changed
          role: 'patient',
          status: 'ACTIVE',
          phone: patientData.contact.phone,
          patientId: patient.id,
          userId: `U${Date.now().toString().slice(-6)}`,
        },
      });

      console.log('User created successfully:', user);

      // If companyId is provided, create affiliation
      console.log('🔍 Checking companyId:', patientData.companyId);
      if (patientData.companyId) {
        console.log('✅ Creating affiliation for companyId:', patientData.companyId);
        const affiliation = await prisma.affiliation.create({
          data: {
            planId: 'default-plan',
            estado: 'ACTIVA', // This should match the enum value
            fechaInicio: new Date(),
            monto: 0, // Default amount
            beneficiarios: undefined,
            companyId: patientData.companyId,
            userId: user.id,
          },
        });

        console.log('✅ Affiliation created successfully:', affiliation);
      } else {
        console.log('❌ No companyId provided, skipping affiliation creation');
      }

      return {
        id: patient.id,
        name: `${patient.nombre} ${patient.apellido}`,
        cedula: patient.cedula,
        age: patientData.age,
        gender: patientData.gender,
        bloodType: patientData.bloodType,
        status: 'Activo' as const,
        lastVisit: patient.createdAt.toISOString(),
        contact: {
          phone: patient.telefono || '',
          email: patient.email || '',
        },
        companyId: patientData.companyId,
      };
    });

    return result;
  } catch (error) {
    console.error('Error adding patient:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        throw new Error('Error de conexión a la base de datos. Verifique la configuración.');
      } else if (error.message.includes('unique constraint')) {
        throw new Error('Ya existe un paciente con esta cédula.');
      } else if (error.message.includes('foreign key')) {
        throw new Error('Error de referencia en la base de datos.');
      } else {
        throw new Error(`Error al agregar paciente: ${error.message}`);
      }
    }
    
    throw new Error('Error desconocido al agregar paciente');
  }
}

export async function updatePatient(patientId: string, patientData: {
  name: string;
  age: number;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  bloodType: string;
  phone: string;
  email: string;
  companyId?: string;
}): Promise<Patient> {
  try {
    console.log('🔄 Updating patient - INPUT VALIDATION:');
    console.log('  - patientId:', patientId, '(type:', typeof patientId, ')');
    console.log('  - patientData:', JSON.stringify(patientData, null, 2));
    
    // Validate required fields
    if (!patientId || typeof patientId !== 'string' || patientId.trim() === '') {
      throw new Error('ID de paciente inválido o vacío');
    }
    
    if (!patientData.name || typeof patientData.name !== 'string' || patientData.name.trim() === '') {
      throw new Error('Nombre de paciente requerido');
    }
    
    if (patientData.age < 0 || patientData.age > 120) {
      throw new Error('La edad debe estar entre 0 y 120 años');
    }

    // Validate gender
    if (!['Masculino', 'Femenino', 'Otro'].includes(patientData.gender)) {
      throw new Error('Género inválido. Debe ser: Masculino, Femenino o Otro');
    }

    // Validate blood type
    if (!['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(patientData.bloodType)) {
      throw new Error('Tipo de sangre inválido. Debe ser: A+, A-, B+, B-, AB+, AB-, O+ u O-');
    }
    
    const updatedPatient = await withDatabase(async (prisma) => {
      console.log('🔍 Checking if patient exists...');
      
      // First, check if patient exists
      const existingPatient = await prisma.patient.findUnique({
        where: { id: patientId }
      });

      if (!existingPatient) {
        throw new Error(`Paciente con ID ${patientId} no encontrado en la base de datos`);
      }

      console.log('✅ Patient exists:', {
        id: existingPatient.id,
        nombre: existingPatient.nombre,
        apellido: existingPatient.apellido,
        cedula: existingPatient.cedula
      });

      // Parse name to get first and last name
      const [nombre, apellido] = patientData.name.split(' ', 2);
      
      // Calculate birth date from age
      const fechaNacimiento = new Date(Date.now() - patientData.age * 365.25 * 24 * 60 * 60 * 1000);
      
      // Prepare update data with ONLY the fields that exist in the Patient model
      const updateData: any = {
        nombre: (nombre || patientData.name).trim(),
        apellido: (apellido || '').trim(),
        fechaNacimiento,
      };

      // Add optional fields only if they have valid values
      if (patientData.phone && typeof patientData.phone === 'string' && patientData.phone.trim() !== '') {
        updateData.telefono = patientData.phone.trim();
      }
      
      if (patientData.email && typeof patientData.email === 'string' && patientData.email.trim() !== '') {
        updateData.email = patientData.email.trim();
      }
      
      // Add bloodType and gender fields if they exist in the database
      // These fields will be added by the migration
      // TODO: Uncomment these lines once the database migration is applied
      // if (patientData.bloodType && typeof patientData.bloodType === 'string' && patientData.bloodType.trim() !== '') {
      //   updateData.bloodType = patientData.bloodType.trim();
      // }
      
      // if (patientData.gender && typeof patientData.gender === 'string' && patientData.gender.trim() !== '') {
      //   updateData.gender = patientData.gender.trim();
      // }

      console.log('📝 PRISMA UPDATE DATA (validated):', JSON.stringify(updateData, null, 2));
      console.log('📝 Data types:', {
        nombre: typeof updateData.nombre,
        apellido: typeof updateData.apellido,
        fechaNacimiento: updateData.fechaNacimiento instanceof Date,
        telefono: updateData.telefono ? typeof updateData.telefono : 'undefined',
        email: updateData.email ? typeof updateData.email : 'undefined',
        bloodType: updateData.bloodType ? typeof updateData.bloodType : 'undefined',
        gender: updateData.gender ? typeof updateData.gender : 'undefined'
      });
      
      // Update patient record
      console.log('🔄 Executing Prisma update...');
      const patient = await prisma.patient.update({
        where: { id: patientId },
        data: updateData,
      });

      console.log('✅ Patient record updated successfully:', {
        id: patient.id,
        nombre: patient.nombre,
        apellido: patient.apellido,
        telefono: patient.telefono,
        email: patient.email,
        bloodType: patient.bloodType,
        gender: patient.gender
      });

      // Update associated user if exists
      const user = await prisma.user.findFirst({
        where: { patientId: patientId }
      });

      if (user) {
        console.log('🔄 Updating associated user...');
        const userUpdateData: any = {
          name: patientData.name.trim(),
        };

        // Only update email and phone if they have valid values
        if (patientData.email && typeof patientData.email === 'string' && patientData.email.trim() !== '') {
          userUpdateData.email = patientData.email.trim();
        }
        
        if (patientData.phone && typeof patientData.phone === 'string' && patientData.phone.trim() !== '') {
          userUpdateData.phone = patientData.phone.trim();
        }

        console.log('📝 USER UPDATE DATA:', JSON.stringify(userUpdateData, null, 2));

        await prisma.user.update({
          where: { id: user.id },
          data: userUpdateData
        });
        console.log(`✅ Updated associated user ${user.id}`);
      }

      return patient;
    });

    // Get company information if companyId is provided
    let companyName: string | undefined;
    if (patientData.companyId && patientData.companyId !== 'none' && patientData.companyId.trim() !== '') {
      try {
        console.log('🔄 Fetching company info for ID:', patientData.companyId);
        const company = await getCompanyById(patientData.companyId);
        companyName = company?.name;
        console.log('✅ Company found:', companyName);
      } catch (error) {
        console.warn('⚠️ Could not fetch company info:', error);
        // Don't throw error for company lookup failure
      }
    }

    // Calculate age for response
    const age = Math.floor((Date.now() - updatedPatient.fechaNacimiento.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    const result: Patient = {
      id: updatedPatient.id,
      name: `${updatedPatient.nombre} ${updatedPatient.apellido}`,
      cedula: updatedPatient.cedula,
      age,
      gender: patientData.gender, // Use the input data since DB field might not exist yet
      bloodType: patientData.bloodType, // Use the input data since DB field might not exist yet
      status: 'Activo' as const,
      lastVisit: updatedPatient.updatedAt.toISOString(),
      contact: {
        phone: updatedPatient.telefono || '',
        email: updatedPatient.email || '',
      },
      companyId: patientData.companyId,
      companyName: companyName,
    };

    console.log('✅ Patient updated successfully - FINAL RESULT:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    // Log the original error with full details for debugging
    console.error('❌ ERROR UPDATING PATIENT - FULL DETAILS:');
    console.error('  - Error object:', error);
    console.error('  - Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('  - Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('  - Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('  - Patient ID:', patientId);
    console.error('  - Patient Data:', JSON.stringify(patientData, null, 2));
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('  - Prisma error code:', (error as any).code);
      console.error('  - Prisma error meta:', (error as any).meta);
    }

    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('no encontrado')) {
        throw new Error('Paciente no encontrado');
      }
      if (error.message.includes('inválido')) {
        throw new Error(error.message);
      }
      if (error.message.includes('PrismaClientValidationError')) {
        throw new Error('Datos de paciente inválidos. Verifique que todos los campos sean correctos.');
      }
      if (error.message.includes('Unique constraint')) {
        throw new Error('Ya existe un paciente con estos datos únicos.');
      }
      if (error.message.includes('Record to update not found')) {
        throw new Error('Paciente no encontrado para actualizar');
      }
    }

    // Generic fallback with original error message
    const originalMessage = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al actualizar paciente: ${originalMessage}. Consulte los logs para más detalles.`);
  }
}

export async function deletePatient(patientId: string): Promise<void> {
  try {
    await withDatabase(async (prisma) => {
      // First, find the user associated with this patient
      const userWithPatient = await prisma.user.findFirst({
        where: { patientId: patientId }
      });

      // Delete the patient
      await prisma.patient.delete({
        where: { id: patientId },
      });

      // If a user was associated with this patient, update their patientId to null
      if (userWithPatient) {
        await prisma.user.update({
          where: { id: userWithPatient.id },
          data: { patientId: null }
        });
        console.log(`✅ Updated user ${userWithPatient.id} patientId to null after deleting patient ${patientId}`);
        
        // Dispatch event to notify components that a patient was deleted
        // This will trigger a refresh of selectable users in forms
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('patientDeleted', { 
            detail: { 
              patientId, 
              userId: userWithPatient.id,
              userName: userWithPatient.name 
            } 
          });
          window.dispatchEvent(event);
          console.log('📤 Dispatched patientDeleted event for user:', userWithPatient.id);
        }
      }
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw new Error('Error al eliminar paciente');
  }
}

// APPOINTMENT ACTIONS
export async function getAppointments(): Promise<Appointment[]> {
  try {
    if (!isDatabaseAvailable()) {
      console.log('Database not available - returning empty array');
      return [];
    }
    const prisma = getPrisma();
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: true, // Relación con User (paciente)
        doctor: true,  // Relación con User (doctor)
        provider: true,
        creator: true, // Relación con User (creador)
      },
      orderBy: { fecha: 'desc' },
    });

    return appointments.map(appointment => ({
      id: appointment.id,
      patientId: appointment.patientUserId, // userId del paciente
      doctorId: appointment.doctorUserId || '', // userId del doctor
      date: appointment.fecha.toISOString(),
      reason: appointment.notas || 'Consulta médica',
      status: appointment.estado === 'COMPLETADA' ? 'Completada' as const : 
              appointment.estado === 'CANCELADA' ? 'Cancelada' as const : 'Programada' as const,
    }));
  } catch (error) {
    console.error('Error fetching appointments:', error);
  return [];
  }
}

// USER ACTIONS
export async function getUsers(page: number = 0, pageSize: number = 50): Promise<{
  users: any[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    if (!isDatabaseAvailable()) {
      console.log('Database not available - returning empty array');
      return {
        users: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
      };
    }
    
    const prisma = getPrisma();
    
    // Calcular skip
    const skip = page * pageSize;
    
    // Obtener usuarios con paginación - solo campos mínimos para el listado
    const queryStartTime = performance.now();
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          lastLogin: true,
          createdAt: true,
          avatarUrl: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    
    const queryEndTime = performance.now();
    const queryTime = queryEndTime - queryStartTime;
    
    const totalPages = Math.ceil(total / pageSize);
    
    console.log(`📊 Users pagination: page ${page}, size ${pageSize}, total ${total}, pages ${totalPages}, queryTime: ${queryTime.toFixed(2)}ms`);
    
    return {
      users,
      total,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      users: [],
      total: 0,
      totalPages: 0,
      currentPage: page,
    };
  }
}

// Obtener detalles completos de un usuario específico (lazy loading)
export async function getUserDetails(userId: string): Promise<any> {
  try {
    if (!isDatabaseAvailable()) {
      console.log('Database not available - returning null');
      return null;
    }
    
    const prisma = getPrisma();
    
    console.log(`🔍 Loading detailed data for user: ${userId}`);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        lastLogin: true,
        userId: true,
        avatarUrl: true,
        createdAt: true,
        // Relaciones solo cuando se necesitan
        // patient: {
        //   select: {
        //     id: true,
        //     nombre: true,
        //     apellido: true,
        //     cedula: true,
        //     fechaNacimiento: true,
        //     telefono: true,
        //     direccion: true,
        //   }
        // },
        patientPayments: {
          select: {
            id: true,
            monto: true,
            estado: true,
            createdAt: true,
            metodo: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Solo los últimos 5 pagos
        },
        patientAppointments: {
          select: {
            id: true,
            fecha: true,
            estado: true,
            tipo: true,
            createdAt: true,
          },
          orderBy: { fecha: 'desc' },
          take: 5, // Solo las últimas 5 citas
        },
      },
    });
    
    console.log(`✅ User details loaded for: ${userId}`);
    return user;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}

// DOCTOR ACTIONS
// Function to get doctors that are properly linked with users
export async function getDoctorsWithUsers(): Promise<Doctor[]> {
  try {
    if (!isDatabaseAvailable()) {
      console.log('Database not available - returning empty array');
      return [];
    }
    
    const doctors = await withDatabase(async (prisma) => {
      // Get doctors that have corresponding users with role "Doctor"
      const doctorsWithUsers = await prisma.doctor.findMany({
        where: {
          OR: [
            {
              email: {
                in: await prisma.user.findMany({
                  where: { role: 'Doctor' },
                  select: { email: true }
                }).then((users: any[]) => users.map((u: any) => u.email).filter(Boolean))
              }
            },
            {
              telefono: {
                in: await prisma.user.findMany({
                  where: { role: 'Doctor' },
                  select: { phone: true }
                }).then((users: any[]) => users.map((u: any) => u.phone).filter(Boolean))
              }
            }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return doctorsWithUsers;
    });
    
    return doctors.map((doctor: any) => ({
      id: doctor.id,
      nombre: doctor.nombre,
      especialidad: doctor.especialidad,
      area: doctor.area,
      contacto: doctor.contacto,
      avatarUrl: doctor.avatarUrl,
    }));
  } catch (error) {
    console.error('Error getting doctors with users:', error);
    return [];
  }
}

export async function getDoctors(): Promise<Doctor[]> {
  try {
    if (!isDatabaseAvailable()) {
      console.log('Database not available - returning empty array');
      return [];
    }
    const prisma = getPrisma();
    
    // Obtener usuarios con rol 'Doctor' y su información específica
    const doctors = await prisma.user.findMany({
      where: { 
        OR: [
          { role: 'Doctor' },
          { role: 'doctor' }
        ]
      },
      include: {
        doctorInfo: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return doctors.map(user => {
      const doctorInfo = user.doctorInfo;
      if (!doctorInfo) {
        // Si no tiene doctorInfo, crear datos por defecto
        return {
          id: user.userId, // Usar userId como ID
          nombre: user.name,
          especialidad: 'Médico General',
          area: 'Medicina General',
          contacto: user.phone || user.email || '',
          avatarUrl: user.avatarUrl || undefined,
        };
      }
      
      return {
        id: user.userId, // Usar userId como ID
        nombre: user.name,
        especialidad: doctorInfo.especialidad,
        area: doctorInfo.area || 'Medicina General',
        contacto: doctorInfo.contacto || user.phone || user.email || '',
        avatarUrl: user.avatarUrl || undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
}

// COMPANY ACTIONS
export async function getCompanies(): Promise<Company[]> {
  try {
    console.log('🔍 Fetching companies from database...');
    const companies = await withDatabase(async (prisma) => {
      return await prisma.company.findMany({
        select: {
          id: true,
          nombre: true,
          rif: true,
          telefono: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }, []); // Fallback to empty array

    console.log(`📊 Found ${companies.length} companies in database`);
    
    const mappedCompanies = companies.map((company: any) => ({
      id: company.id,
      name: company.nombre,
      ruc: company.rif,
      phone: company.telefono || '',
      email: company.email || '',
      status: 'Activo' as const,
    }));

    console.log('✅ Mapped companies:', mappedCompanies);
    return mappedCompanies;
  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    return [];
  }
}

// Get users with role "patient" that don't have an active Patient record
export async function listSelectablePatientUsers(): Promise<Array<{
  id: string;
  name: string;
  email: string;
  status: string;
}>> {
  try {
    console.log('🔍 Fetching selectable patient users...');
    
    const users = await withDatabase(async (prisma) => {
      // Get all users with patient role
      const allPatientUsers = await prisma.user.findMany({
        where: {
          role: 'patient',
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          patientId: true
        },
        orderBy: { name: 'asc' }
      });

      // Get all active patients
      const activePatients = await prisma.patient.findMany({
        select: {
          id: true
        }
      });

      const activePatientIds = new Set(activePatients.map((p: { id: string }) => p.id));

      // Filter users that don't have an active patient record
      const selectableUsers = allPatientUsers.filter((user: any) => 
        !user.patientId || !activePatientIds.has(user.patientId)
      );

      return selectableUsers.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      }));
    }, []);

    console.log(`📊 Found ${users.length} selectable patient users`);
    return users;
  } catch (error) {
    console.error('❌ Error fetching selectable patient users:', error);
    return [];
  }
}

// Get current user with status for server-side authentication checks
export async function getCurrentUserWithStatus(userId: string): Promise<{
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
} | null> {
  try {
    console.log('🔍 Getting current user with status for userId:', userId);
    
    const user = await withDatabase(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true
        }
      });
    });

    if (!user) {
      console.log('❌ User not found');
      return null;
    }

    console.log('✅ User found:', { id: user.id, name: user.name, role: user.role, status: user.status });
    return user;
  } catch (error) {
    console.error('❌ Error getting current user with status:', error);
    return null;
  }
}

// Create patient from existing user
export async function addPatientFromUser(userId: string, patientData: {
  age: number;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  bloodType: string;
  cedula: string;
  companyId?: string;
}): Promise<Patient> {
  try {
    console.log('addPatientFromUser called with userId:', userId, 'and data:', JSON.stringify(patientData, null, 2));
    
    const isAvailable = await isDatabaseAvailable();
    if (!isAvailable) {
      throw new Error('Database not available. Please configure DATABASE_URL in your environment variables.');
    }
    
    const prisma = getPrisma();
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Get the user first
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true
      }
    });
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    if (user.status !== 'ACTIVE') {
      throw new Error('El usuario no está activo');
    }
    
    // Check if user already has a Patient record
    // const existingPatient = await prisma.patient.findFirst({
    //   where: {
    //     OR: [
    //       { email: user.email },
    //       { nombre: user.name }
    //     ]
    //   }
    // });
    
    // if (existingPatient) {
    //   throw new Error('El usuario ya tiene un registro de paciente');
    // }
    
    // Validate required fields
    if (!patientData.age || patientData.age <= 0) {
      throw new Error('La edad debe ser mayor a 0');
    }
    if (!patientData.gender) {
      throw new Error('El género es requerido');
    }
    
    const [nombre, apellido] = user.name.split(' ', 2);
    const fechaNacimiento = new Date(Date.now() - patientData.age * 365.25 * 24 * 60 * 60 * 1000);
    
    console.log('Creating patient from user with data:', {
      nombre: nombre || user.name,
      apellido: apellido || '',
      cedula: patientData.cedula,
      fechaNacimiento,
      telefono: user.phone || '',
      email: user.email,
      direccion: '',
    });
    
    // Create patient
    // const patient = await prisma.patient.create({
    //   data: {
    //     nombre: nombre || user.name,
    //     apellido: apellido || '',
    //     cedula: patientData.cedula,
    //     fechaNacimiento,
    //     telefono: user.phone || '',
    //     email: user.email,
    //     direccion: '', // Default empty address
    //     bloodType: patientData.bloodType,
    //     gender: patientData.gender,
    //   },
    // });
    
    // console.log('Patient created successfully:', patient);

    // Update user with patientId
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: { patientId: patient.id }
    // });

    // console.log('User updated with patientId:', patient.id);

    // If companyId is provided, create affiliation
    if (patientData.companyId) {
      console.log('🔍 Creating affiliation for company:', patientData.companyId);
      
      const affiliation = await prisma.affiliation.create({
        data: {
          planId: 'default-plan',
          tipoPago: null,
          estado: 'ACTIVA',
          fechaInicio: new Date(),
          monto: new Decimal(0),
          beneficiarios: undefined,
          companyId: patientData.companyId,
          userId: userId,
        },
      });
      
      console.log('Affiliation created successfully:', affiliation);
    }
    
    // Map User to expected Patient type (since we're using userId architecture)
    const mappedPatient: Patient = {
      id: user.id, // Use user.id as patient ID
      name: user.name,
      cedula: patientData.cedula,
      age: patientData.age,
      gender: patientData.gender,
      bloodType: patientData.bloodType,
      status: 'Activo',
      contact: {
        phone: user.phone || '',
        email: user.email || '',
      },
      lastVisit: new Date().toISOString(), // Use current date as fallback
      companyId: patientData.companyId,
    };

    return mappedPatient;
  } catch (error) {
    console.error('Error creating patient from user:', error);
    throw error;
  }
}

// ESTUDIO ACTIONS
export async function getEstudios(): Promise<Estudio[]> {
  try {
    const estudios = await withDatabase(async (prisma) => {
      return await prisma.estudio.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      });
    });

    return estudios.map((estudio: any) => ({
      id: estudio.id,
      categoria: estudio.tipo,
      nombre: estudio.nombre,
    }));
  } catch (error) {
    console.error('Error fetching estudios:', error);
  return [];
  }
}

// CONSULTATION ACTIONS
export async function getConsultations(): Promise<Consultation[]> {
  try {
    const consultations = await withDatabase(async (prisma) => {
      return await prisma.consultation.findMany({
        include: {
          patient: true, // Relación con User (paciente)
          doctor: true,  // Relación con User (doctor)
          creator: true, // Relación con User (creador)
        },
        orderBy: { fecha: 'desc' },
      });
    });

    return consultations.map((consultation: any) => ({
      id: consultation.id,
      patientId: consultation.patientUserId, // userId del paciente
      date: consultation.fecha.toISOString(),
      doctor: consultation.doctor ? consultation.doctor.name : 'No especificado',
      type: 'Inicial' as const,
      notes: consultation.observaciones || '',
      prescriptions: [],
      labResults: [],
      reports: [],
    }));
  } catch (error) {
    console.error('Error fetching consultations:', error);
  return [];
  }
}

export async function addConsultation(consultationData: {
  patientId: string;
  date: string;
  doctor: string;
  type: 'Inicial' | 'Seguimiento' | 'Pre-operatorio' | 'Post-operatorio';
  notes: string;
  prescriptions?: any[];
  reports?: any[];
  labResults?: any[];
}): Promise<Consultation> {
  try {
    const consultation = await withDatabase(async (prisma) => {
      // Verify patient exists
      const patient = await prisma.patient.findUnique({
        where: { id: consultationData.patientId }
      });
      
      if (!patient) {
        throw new Error(`Paciente con ID ${consultationData.patientId} no encontrado`);
      }

      // Find the doctor by name in both Doctor table and User table
      let doctor = await prisma.doctor.findFirst({
        where: {
          OR: [
            { nombre: { contains: consultationData.doctor } },
            { apellido: { contains: consultationData.doctor } },
          ]
        }
      });

      // If not found in Doctor table, check User table
      if (!doctor) {
        const doctorUser = await prisma.user.findFirst({
          where: {
            role: 'doctor',
            name: { contains: consultationData.doctor }
          }
        });
        
        if (doctorUser) {
          // Check if a doctor record already exists for this user
          const existingDoctor = await prisma.doctor.findFirst({
            where: {
              OR: [
                { email: doctorUser.email },
                { cedula: `DOC-${doctorUser.id}` }
              ]
            }
          });

          if (!existingDoctor) {
            // Create a doctor record in the Doctor table for this user
            const [nombre, apellido] = doctorUser.name.split(' ', 2);
            doctor = await prisma.doctor.create({
              data: {
                nombre: nombre || doctorUser.name,
                apellido: apellido || '',
                especialidad: 'Médico General',
                cedula: `DOC-${doctorUser.id}-${Date.now()}`, // More unique ID with timestamp
                telefono: doctorUser.phone,
                email: doctorUser.email,
                direccion: '',
                area: '',
                contacto: doctorUser.phone || '',
              }
            });
          } else {
            doctor = existingDoctor;
          }
        }
      }

      // Get a valid user ID (prefer master-admin, fallback to first admin user, then any user)
      let userId: string | null = null;
      
      // First try to find master-admin
      const masterAdmin = await prisma.user.findUnique({
        where: { id: 'master-admin' }
      });
      
      if (masterAdmin) {
        userId = masterAdmin.id;
      } else {
        // Fallback to first admin user
        const adminUser = await prisma.user.findFirst({
          where: { role: 'admin' }
        });
        
        if (adminUser) {
          userId = adminUser.id;
        } else {
          // Last resort: get any user from the database
          const anyUser = await prisma.user.findFirst();
          if (anyUser) {
            userId = anyUser.id;
          }
        }
      }

      // If no user found, throw an error
      if (!userId) {
        throw new Error('No se encontró ningún usuario válido en el sistema para crear la consulta');
      }

      return await prisma.consultation.create({
        data: {
          fecha: new Date(consultationData.date),
          motivo: consultationData.type,
          sintomas: '',
          diagnostico: '',
          tratamiento: '',
          observaciones: consultationData.notes,
          patientUserId: consultationData.patientId,
          doctorId: doctor?.id || null,
          userId: userId,
        },
        include: {
          patient: true,
          doctor: true,
        }
      });
    });

    return {
      id: consultation.id,
      patientId: consultation.patientUserId,
      date: consultation.fecha.toISOString(),
      doctor: consultation.doctor ? `${consultation.doctor.nombre} ${consultation.doctor.apellido}` : consultationData.doctor,
      type: consultationData.type,
      notes: consultation.observaciones || '',
      prescriptions: consultationData.prescriptions || [],
      labResults: consultationData.labResults || [],
      reports: consultationData.reports || [],
    };
  } catch (error) {
    console.error('Error adding consultation:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        throw new Error('Error de conexión a la base de datos. Verifique la configuración.');
      } else if (error.message.includes('unique constraint')) {
        throw new Error('Ya existe una consulta con estos datos.');
      } else if (error.message.includes('foreign key')) {
        throw new Error('Error de referencia en la base de datos. Verifique que el paciente y doctor existan.');
      } else if (error.message.includes('required')) {
        throw new Error('Faltan campos requeridos para crear la consulta.');
      } else {
        throw new Error(`Error al agregar consulta: ${error.message}`);
      }
    }
    
    throw new Error('Error desconocido al agregar consulta');
  }
}

// LAB RESULT ACTIONS
export async function getLabResults(): Promise<LabResult[]> {
  try {
    const labResults = await withDatabase(async (prisma) => {
      return await prisma.labResult.findMany({
      include: {
        patient: true,
        consultation: true,
      },
      orderBy: { fecha: 'desc' },
      });
    });

    return labResults.map((result: any) => ({
      id: result.id,
      patientId: result.paciente.id,
      testName: result.nombre,
      value: result.resultado,
      referenceRange: result.tipo,
      date: result.fecha.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching lab results:', error);
    return [];
  }
}

// REPORT ACTIONS
export async function getReports(): Promise<Report[]> {
  try {
    const reports = await withDatabase(async (prisma) => {
      return await prisma.report.findMany({
        orderBy: { fecha: 'desc' },
      });
    });

    return reports.map((report: any) => ({
      id: report.id,
      patientId: 'default-patient', // Default since we don't have patient relationship in schema
      title: report.titulo,
      date: report.fecha.toISOString(),
      type: report.tipo,
      notes: report.descripcion || '',
      fileUrl: '',
      attachments: [],
    }));
  } catch (error) {
    console.error('Error fetching reports:', error);
  return [];
  }
}

// SUPPLY ACTIONS
export async function getSupplies(): Promise<Supply[]> {
  try {
    const supplies = await withDatabase(async (prisma) => {
      return await prisma.supply.findMany({
        orderBy: { createdAt: 'desc' },
      });
    });

    return supplies.map((supply: any) => ({
      id: supply.id,
      name: supply.nombre,
      category: supply.descripcion || '',
      stock: supply.cantidad,
      unit: supply.unidad,
      expiryDate: supply.fechaVencimiento?.toISOString() || '',
    }));
  } catch (error) {
    console.error('Error fetching supplies:', error);
  return [];
  }
}

// PROVIDER ACTIONS
export async function getProviders(): Promise<Provider[]> {
  try {
    const providers = await withDatabase(async (prisma) => {
      return await prisma.provider.findMany({
        orderBy: { createdAt: 'desc' },
      });
    });

    return providers.map((provider: any) => ({
      id: provider.id,
      name: provider.nombre,
      specialty: provider.especialidad,
      phone: provider.telefono || '',
      email: provider.email || '',
      address: provider.direccion || '',
      createdAt: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching providers:', error);
  return [];
  }
}

// PAYMENT ACTIONS
export async function getPayments(): Promise<Payment[]> {
  try {
    const payments = await withDatabase(async (prisma) => {
      return await prisma.payment.findMany({
        include: {
          patient: true,
          user: true,
        },
        orderBy: { fecha: 'desc' },
      });
    }, []); // Fallback to empty array

    return payments.map((payment: any) => ({
      id: payment.id,
      patientId: payment.paciente.id,
      doctorId: undefined,
      paymentTypeId: 'default-type',
      paymentMethodId: 'default-method',
      date: payment.fecha.toISOString(),
      monto: payment.monto.toNumber(),
      status: payment.estado === 'PAGADO' ? 'Pagado' as const : 
              payment.estado === 'CANCELADO' ? 'Anulado' as const : 'Pendiente' as const,
    }));
  } catch (error) {
    console.error('Error fetching payments:', error);
  return [];
  }
}

// AUTHENTICATION ACTIONS
export async function login(credentials: { email: string; password: string }) {
  try {
    // Check for master admin first (hardcoded for security)
  if (credentials.email === 'master@urovital.com' && credentials.password === 'M4st3r36048@') {
    return {
      success: true,
      user: {
        id: 'master-admin',
        name: 'Master Administrator',
        email: 'master@urovital.com',
        role: 'admin',
        status: 'ACTIVE',
        patientId: null,
      },
    };
  }
  
    // Check database users
    const user = await withDatabase(async (prisma) => {
      return await prisma.user.findUnique({
        where: { email: credentials.email },
      });
    });

    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.password);
    
    if (!isValidPassword) {
      return { success: false, error: 'Contraseña incorrecta' };
    }

    // Create audit log for successful login
    await createAuditLog(user.id, 'Inicio de sesión', `Usuario ${user.name} inició sesión`);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase() as 'admin' | 'doctor' | 'user',
        status: user.status,
        patientId: user.patientId,
      },
    };
  } catch (error) {
    console.error('Error during login:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// AFFILIATION ACTIONS
export async function addAffiliation(affiliationData: {
  companyId?: string;
  userId: string;
  planId?: string;
  tipoPago?: string;
  monto?: number;
  estado?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔍 Creating affiliation with data:', affiliationData);
    
    const affiliation = await withDatabase(async (prisma) => {
      // Verificar que el usuario existe
      const userExists = await prisma.user.findUnique({
        where: { id: affiliationData.userId }
      });
      
      if (!userExists) {
        throw new Error(`Usuario con ID ${affiliationData.userId} no existe`);
      }
      
      console.log('✅ User exists:', userExists.name);
      
      return await prisma.affiliation.create({
        data: {
          planId: affiliationData.planId || 'default-plan',
          tipoPago: affiliationData.tipoPago || null,
          estado: (affiliationData.estado as any) || 'ACTIVA',
          fechaInicio: new Date(),
          monto: new Decimal(affiliationData.monto || 0),
          beneficiarios: undefined,
          companyId: affiliationData.companyId || null, // Allow null for patient particular
          userId: affiliationData.userId,
        },
        include: {
          company: true,
          user: true,
        },
      });
    });

    console.log('✅ Affiliation created successfully:', affiliation);
    
    // Convert Decimal to Number for serialization
    const result = {
      id: affiliation.id,
      planId: affiliation.planId,
      estado: affiliation.estado,
      fechaInicio: affiliation.fechaInicio.toISOString(),
      fechaFin: affiliation.fechaFin?.toISOString() || null,
      monto: Number(affiliation.monto), // Convert Decimal to number
      beneficiarios: affiliation.beneficiarios,
      companyId: affiliation.companyId,
      userId: affiliation.userId,
      tipoPago: affiliation.tipoPago,
      createdAt: affiliation.createdAt.toISOString(),
      company: affiliation.company,
      user: affiliation.user,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Error creando afiliación:', error);
    
    // Mejorar el mensaje de error con más casos específicos
    let errorMessage = 'No se pudo crear la afiliación. Verifica la conexión a la base de datos.';
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('no existe') || errorMsg.includes('usuario con id')) {
        errorMessage = 'El usuario seleccionado no existe. Por favor, verifica los datos.';
      } else if (errorMsg.includes('foreign key constraint') || errorMsg.includes('clave foránea')) {
        errorMessage = 'Error de referencia: El usuario o empresa seleccionada no existe.';
      } else if (errorMsg.includes('conexión') || errorMsg.includes('base de datos') || errorMsg.includes('connection')) {
        errorMessage = 'Error de conexión a la base de datos. Intenta nuevamente.';
      } else if (errorMsg.includes('empresa') || errorMsg.includes('company')) {
        errorMessage = 'Error de empresa: La empresa seleccionada no existe.';
      } else if (errorMsg.includes('permission') || errorMsg.includes('permiso')) {
        errorMessage = 'No tienes permisos para realizar esta acción.';
      } else if (errorMsg.includes('validation') || errorMsg.includes('validación')) {
        errorMessage = 'Los datos proporcionados no son válidos. Verifica la información.';
      } else if (errorMsg.includes('duplicate') || errorMsg.includes('duplicado')) {
        errorMessage = 'Ya existe una afiliación con estos datos.';
      } else {
        // Para errores no específicos, mostrar un mensaje más amigable
        errorMessage = 'No se pudo crear la afiliación. Por favor, verifica los datos e intenta nuevamente.';
      }
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function getAffiliations(): Promise<any[]> {
  try {
    console.log('🔍 Fetching affiliations from database...');
    const affiliations = await withDatabase(async (prisma) => {
      return await prisma.affiliation.findMany({
        include: {
          company: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }, []); // Fallback to empty array

    console.log(`📊 Found ${affiliations.length} affiliations in database`);
    
    const mappedAffiliations = affiliations.map((affiliation: any) => ({
      id: affiliation.id,
      planId: affiliation.planId,
      estado: affiliation.estado,
      fechaInicio: affiliation.fechaInicio.toISOString(),
      fechaFin: affiliation.fechaFin?.toISOString() || null,
      monto: Number(affiliation.monto), // Convert Decimal to number
      beneficiarios: affiliation.beneficiarios,
      companyId: affiliation.companyId,
      userId: affiliation.userId,
      tipoPago: affiliation.tipoPago,
      createdAt: affiliation.createdAt.toISOString(),
      company: affiliation.company,
      user: affiliation.user,
    }));

    console.log('✅ Mapped affiliations:', mappedAffiliations);
    return mappedAffiliations;
  } catch (error) {
    console.error('❌ Error fetching affiliations:', error);
    return [];
  }
}


// AFFILIATE LEAD ACTIONS
export async function submitAffiliateLead(data: AffiliateLead) {
  try {
    // Here you would typically save to database or send to external service
    console.log('Affiliate lead submitted:', data);
    
    // Simulate processing time
    await delay(1000);
    
    return { success: true, message: 'Solicitud enviada exitosamente' };
  } catch (error) {
    console.error('Error submitting affiliate lead:', error);
    return { success: false, error: 'Error al enviar la solicitud' };
  }
}

// SYSTEM CONFIG ACTIONS
export async function getSystemConfig() {
  try {
    const config = await withDatabase(async (prisma) => {
      return await prisma.systemConfig.findFirst();
    });
    
    if (!config) {
      // Return default config if none exists
  return {
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
  };
    }

    return {
      id: config.id,
      clinicName: config.clinicName,
      clinicAddress: config.clinicAddress || '',
      clinicPhone: config.clinicPhone || '',
      clinicEmail: config.clinicEmail || '',
      workingHours: config.workingHours || '',
      notifications: config.notifications,
      emailNotifications: config.emailNotifications,
      smsNotifications: config.smsNotifications,
      maintenanceMode: config.maintenanceMode,
      autoBackup: config.autoBackup,
      dataRetention: config.dataRetention,
    };
  } catch (error) {
    console.error('Error fetching system config:', error);
    // Return default config on error
    return {
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
    };
  }
}

export async function updateSystemConfig(configData: any) {
  try {
    const config = await withDatabase(async (prisma) => {
      return await prisma.systemConfig.upsert({
      where: { id: configData.id || 'default-config' },
      update: {
        clinicName: configData.clinicName,
        clinicAddress: configData.clinicAddress,
        clinicPhone: configData.clinicPhone,
        clinicEmail: configData.clinicEmail,
        workingHours: configData.workingHours,
        notifications: configData.notifications,
        emailNotifications: configData.emailNotifications,
        smsNotifications: configData.smsNotifications,
        maintenanceMode: configData.maintenanceMode,
        autoBackup: configData.autoBackup,
        dataRetention: configData.dataRetention,
      },
      create: {
        id: configData.id || 'default-config',
        clinicName: configData.clinicName || 'UroVital',
        clinicAddress: configData.clinicAddress,
        clinicPhone: configData.clinicPhone,
        clinicEmail: configData.clinicEmail,
        workingHours: configData.workingHours,
        notifications: configData.notifications ?? true,
        emailNotifications: configData.emailNotifications ?? true,
        smsNotifications: configData.smsNotifications ?? false,
        maintenanceMode: configData.maintenanceMode ?? false,
        autoBackup: configData.autoBackup ?? true,
        dataRetention: configData.dataRetention || '2 años',
      },
      });
    });

    return {
      id: config.id,
      clinicName: config.clinicName,
      clinicAddress: config.clinicAddress || '',
      clinicPhone: config.clinicPhone || '',
      clinicEmail: config.clinicEmail || '',
      workingHours: config.workingHours || '',
      notifications: config.notifications,
      emailNotifications: config.emailNotifications,
      smsNotifications: config.smsNotifications,
      maintenanceMode: config.maintenanceMode,
      autoBackup: config.autoBackup,
      dataRetention: config.dataRetention,
    };
  } catch (error) {
    console.error('Error updating system config:', error);
    throw new Error('Error al actualizar la configuración del sistema');
  }
}

// AUDIT LOG ACTIONS
export async function createAuditLog(userId: string, action: string, details?: string): Promise<void> {
  try {
    await withDatabase(async (prisma) => {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          details,
        },
      });
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

export async function getAuditLogs(): Promise<any[]> {
  try {
    const auditLogs = await withDatabase(async (prisma) => {
      return await prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    return auditLogs.map((log: any) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      user: {
        id: log.user.id,
        name: log.user.name,
        email: log.user.email,
        role: log.user.role,
      },
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

// USER MANAGEMENT ACTIONS
export async function createUser(data: Omit<User, "id" | "createdAt">): Promise<User> {
  try {
    console.log('🔄 Creando usuario:', { name: data.name, email: data.email, role: data.role });
    
    const isAvailable = await isDatabaseAvailable();
    if (!isAvailable) {
      throw new Error('Base de datos no disponible. No se puede crear el usuario.');
    }

    // Validate required fields
    if (!data.name || !data.email || !data.password || !data.role) {
      throw new Error('Faltan campos requeridos: nombre, email, contraseña y rol son obligatorios.');
    }

    // Check if user already exists
    const prisma = getPrisma();
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      console.log('❌ Usuario ya existe con email:', data.email);
      throw new Error('Ya existe un usuario registrado con ese correo electrónico.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    // Generate unique userId
    const userId = `U${Date.now().toString().slice(-6)}`;
    
    console.log('🔄 Creando usuario con userId:', userId);
    
    const newUser = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        userId: userId,
      },
    });

    console.log('✅ Usuario creado exitosamente:', { id: newUser.id, userId: newUser.userId, name: newUser.name });

    // Create audit log for user creation
    try {
      await createAuditLog(newUser.id, 'Usuario creado', `Nuevo usuario ${newUser.name} con rol ${newUser.role}`);
    } catch (auditError) {
      console.warn('Error creating audit log:', auditError);
      // Don't fail user creation if audit log fails
    }

    return newUser;
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        if (error.message.includes('email')) {
          throw new Error('Ya existe un usuario registrado con ese correo electrónico.');
        }
        if (error.message.includes('userId')) {
          throw new Error('Error interno: ID de usuario duplicado. Intenta nuevamente.');
        }
      }
      
      if (error.message.includes('Invalid input')) {
        throw new Error('Datos de usuario inválidos. Verifica que todos los campos estén completos.');
      }
      
      // Return the specific error message if it's user-friendly
      if (error.message.includes('Ya existe') || error.message.includes('Faltan campos')) {
        throw error;
      }
    }
    
    throw new Error('No se pudo crear el usuario. Verifica la conexión a la base de datos.');
  }
}

// Get current user with fresh data (no cache)
export async function getCurrentUserFresh(userId: string): Promise<User | null> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    
    const user = await withDatabase(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          lastLogin: true,
          userId: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
    });

    return user;
  } catch (error) {
    console.error('Error fetching fresh user data:', error);
    return null;
  }
}

// Get current user status for access control - Server Component only
export async function getUserStatusForAccess(userId: string): Promise<{
  id: string;
  role: string;
  status: string;
  patientId: string | null;
} | null> {
  try {
    console.log('🔍 getUserStatusForAccess called with userId:', userId);
    
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    console.log('🔍 unstable_noStore applied');

    const user = await withDatabase(async (prisma) => {
      console.log('🔍 Inside withDatabase, calling prisma.user.findUnique...');
      const result = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          status: true,
          userId: true,
        },
      });
      console.log('🔍 prisma.user.findUnique result:', result);
      return result;
    });
    
    console.log('✅ getUserStatusForAccess returning:', user);
    return user;
  } catch (error) {
    console.error('❌ Error fetching user status for access:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

// Get current user ID from request headers (for server-side auth)
export async function getCurrentUserIdFromRequest(): Promise<string | null> {
  try {
    // This is a simplified version - in a real app you'd get this from cookies/session
    // For now, we'll use a different approach
    return null;
  } catch (error) {
    console.error('Error getting current user ID from request:', error);
    return null;
  }
}

// Helper function to create doctor record when user role changes to "Doctor"
export async function ensureDoctorRecord(userId: string, userData: Partial<User>): Promise<string | null> {
  try {
    console.log('🔄 Ensuring doctor record for user:', userId);
    
    const doctorId = await withDatabase(async (prisma) => {
      // Check if doctor record already exists
      const existingDoctor = await prisma.doctor.findFirst({
        where: { 
          OR: [
            { email: userData.email },
            { telefono: userData.phone }
          ]
        }
      });
      
      if (existingDoctor) {
        console.log('✅ Doctor record already exists:', existingDoctor.id);
        return existingDoctor.id;
      }
      
      // Create new doctor record
      const newDoctor = await prisma.doctor.create({
        data: {
          nombre: userData.name?.split(' ')[0] || 'Dr.',
          apellido: userData.name?.split(' ').slice(1).join(' ') || 'Usuario',
          cedula: `V-${Date.now()}`, // Generate unique cedula
          especialidad: 'Urología', // Default specialty
          telefono: userData.phone || '',
          email: userData.email || '',
          direccion: '',
          area: 'Urología General',
          contacto: userData.name || 'Dr. Usuario'
        }
      });
      
      console.log('✅ Doctor record created:', newDoctor.id);
      return newDoctor.id;
    });
    
    return doctorId;
  } catch (error) {
    console.error('❌ Error ensuring doctor record:', error);
    return null;
  }
}

// Helper function to remove doctor record when user role changes from "Doctor"
export async function removeDoctorRecord(userId: string): Promise<void> {
  try {
    console.log('🔄 Removing doctor record for user:', userId);
    
    await withDatabase(async (prisma) => {
      // Find doctor record by email or phone
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true }
      });
      
      if (user) {
        const doctor = await prisma.doctor.findFirst({
          where: {
            OR: [
              { email: user.email },
              { telefono: user.phone }
            ]
          }
        });
        
        if (doctor) {
          await prisma.doctor.delete({
            where: { id: doctor.id }
          });
          console.log('✅ Doctor record removed:', doctor.id);
        }
      }
    });
  } catch (error) {
    console.error('❌ Error removing doctor record:', error);
  }
}

export async function updateUser(userId: string, data: Partial<Omit<User, "id" | "createdAt">>): Promise<User> {
  try {
    console.log('🔄 updateUser called with userId:', userId);
    console.log('🔄 updateUser called with data:', data);
    console.log('🔄 updateUser data type:', typeof data);
    console.log('🔄 updateUser data keys:', Object.keys(data));
    
    // Get current user data to check role changes
    const currentUser = await withDatabase(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true, email: true, phone: true }
      });
    });
    
    const updatedUser = await withDatabase(async (prisma) => {
      console.log('🔄 Inside withDatabase, calling prisma.user.update...');
      const result = await prisma.user.update({
        where: { id: userId },
        data,
      });
      console.log('✅ prisma.user.update completed:', result);
      return result;
    });
    
    // Handle role changes
    if (data.role && currentUser && data.role !== currentUser.role) {
      console.log('🔄 Role changed from', currentUser.role, 'to', data.role);
      
      if (data.role === 'Doctor') {
        // Create doctor record if changing TO doctor
        const doctorId = await ensureDoctorRecord(userId, {
          name: data.name || currentUser.name,
          email: data.email || currentUser.email,
          phone: data.phone || currentUser.phone
        });
        
        if (doctorId) {
          console.log('✅ Doctor record created/verified for user:', userId);
        }
      } else if (currentUser.role === 'Doctor' && data.role !== 'Doctor') {
        // Remove doctor record if changing FROM doctor
        await removeDoctorRecord(userId);
        console.log('✅ Doctor record removed for user:', userId);
      }
    }
    
    console.log('✅ withDatabase completed, updatedUser:', updatedUser);

    // If status or role was changed, revalidate relevant routes
    if (data.status || data.role) {
      console.log('🔄 User status or role changed, revalidating routes...');
      // Revalidate patient-related pages to update access gates and dropdowns
      try {
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/(app)/patients');
        revalidatePath('/(app)/dashboard');
        revalidatePath('/(app)/appointments');
        revalidatePath('/(app)/settings/users');
        revalidatePath('/(app)/afiliaciones');
        console.log('✅ Routes revalidated after user change');
      } catch (revalidateError) {
        console.warn('⚠️ Could not revalidate paths:', revalidateError);
      }
    }

    // Return updated user data for client-side synchronization
    return {
      ...updatedUser,
      // Ensure the response includes all necessary fields for client sync
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      patientId: updatedUser.patientId,
    };
  } catch (error) {
    console.error('Error updating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al actualizar usuario: ${errorMessage}`);
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    const isAvailable = await isDatabaseAvailable();
    if (!isAvailable) {
      throw new Error('Base de datos no disponible. No se puede eliminar el usuario.');
    }

    const prisma = getPrisma();
    await prisma.user.delete({
      where: { id: userId },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Error al eliminar usuario');
  }
}

// PLACEHOLDER FUNCTIONS (to maintain compatibility)
export async function getIpssScores(): Promise<IpssScore[]> {
  return [];
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return [];
}

export async function getPaymentTypes(): Promise<PaymentType[]> {
  return [];
}

export async function addProvider(providerData: Omit<Provider, 'id'>): Promise<Provider> {
  throw new Error('Not implemented');
}

export async function addPaymentMethod(data: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> {
  throw new Error('Not implemented');
}

export async function addPaymentType(data: Omit<PaymentType, 'id'>): Promise<PaymentType> {
  throw new Error('Not implemented');
}

// MISSING FUNCTIONS - Added to fix build errors
export async function getIpssScoresByPatientId(patientId: string): Promise<IpssScore[]> {
  try {
    // IPSS scores are not in the current schema, return empty array for now
    // This would need to be added to the schema if needed
    return [];
  } catch (error) {
    console.error('Error fetching IPSS scores:', error);
  return [];
  }
}

export async function getLabResultsByPatientId(patientId: string): Promise<LabResult[]> {
  try {
    const labResults = await withDatabase(async (prisma) => {
      return await prisma.labResult.findMany({
      where: { patientUserId: patientId },
      include: {
        patient: true,
        consultation: true,
      },
      orderBy: { fecha: 'desc' },
      });
    });

    return labResults.map((result: any) => ({
      id: result.id,
      patientId: result.paciente.id,
      testName: result.nombre,
      value: result.resultado,
      referenceRange: result.tipo,
      date: result.fecha.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching lab results by patient:', error);
  return [];
  }
}

export async function getConsultationsByPatientId(patientId: string): Promise<Consultation[]> {
  try {
    const consultations = await withDatabase(async (prisma) => {
      return await prisma.consultation.findMany({
        where: { patientUserId: patientId },
        include: {
          patient: true,
          doctor: true,
          creator: true,
        },
        orderBy: { fecha: 'desc' },
      });
    });

    return consultations.map((consultation: any) => ({
      id: consultation.id,
      patientId: consultation.patientUserId, // userId del paciente
      date: consultation.fecha.toISOString(),
      doctor: consultation.doctor ? consultation.doctor.name : 'No especificado',
      type: 'Inicial' as const,
      notes: consultation.observaciones || '',
      prescriptions: [],
      labResults: [],
      reports: [],
    }));
  } catch (error) {
    console.error('Error fetching consultations by patient:', error);
    return [];
  }
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  try {
    // patientId ahora es userId
    const user = await withDatabase(async (prisma) => {
      return await prisma.user.findUnique({
        where: { userId: patientId },
        include: {
          patientInfo: true,
          affiliations: {
            where: { estado: 'ACTIVA' },
            include: {
              company: true
            }
          }
        }
      });
    });

    if (!user || user.role !== 'patient') return null;

    const patientInfo = user.patientInfo;
    if (!patientInfo) {
      // Si no tiene patientInfo, crear datos por defecto
      return {
        id: user.userId,
        name: user.name,
        cedula: 'No especificada',
        age: 0,
        gender: 'Otro' as const,
        bloodType: 'O+' as const,
        status: user.status === 'ACTIVE' ? 'Activo' as const : 'Inactivo' as const,
        lastVisit: user.lastLogin?.toISOString() || user.createdAt.toISOString(),
        contact: {
          phone: user.phone || '',
          email: user.email || '',
        },
        companyId: user.affiliations.length > 0 ? user.affiliations[0].companyId : undefined,
      };
    }

    const age = Math.floor((Date.now() - patientInfo.fechaNacimiento.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    return {
      id: user.userId, // Usar userId como ID
      name: user.name,
      cedula: patientInfo.cedula,
      age,
      gender: (patientInfo.gender as 'Masculino' | 'Femenino' | 'Otro') || 'Otro',
      bloodType: (patientInfo.bloodType as 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-') || 'O+',
      status: user.status === 'ACTIVE' ? 'Activo' as const : 'Inactivo' as const,
      lastVisit: user.lastLogin?.toISOString() || user.createdAt.toISOString(),
      contact: {
        phone: patientInfo.telefono || user.phone || '',
        email: user.email || '',
      },
      companyId: user.affiliations.length > 0 ? user.affiliations[0].companyId : undefined,
    };
  } catch (error) {
    console.error('Error fetching patient by ID:', error);
  return null;
  }
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  try {
    const company = await withDatabase(async (prisma) => {
      return await prisma.company.findUnique({
      where: { id: companyId },
    });
    });

    if (!company) return null;

    return {
      id: company.id,
      name: company.nombre,
      ruc: company.rif,
      phone: company.telefono || '',
      email: company.email || '',
      status: 'Activo' as const,
    };
  } catch (error) {
    console.error('Error fetching company by ID:', error);
  return null;
  }
}

export async function addCompany(companyData: {
  name: string;
  ruc: string;
  phone?: string;
  email?: string;
  address?: string;
}): Promise<Company> {
  try {
    // Primero verificar si ya existe una empresa con este RIF
    const existingCompany = await withDatabase(async (prisma) => {
      return await prisma.company.findFirst({
        where: { rif: companyData.ruc }
      });
    });

    if (existingCompany) {
      throw new Error(`Ya existe una empresa con el RIF ${companyData.ruc}. Por favor, verifica el RIF e intenta nuevamente.`);
    }

    const company = await withDatabase(async (prisma) => {
      return await prisma.company.create({
        data: {
          nombre: companyData.name,
          rif: companyData.ruc,
          direccion: companyData.address || '',
          telefono: companyData.phone || '',
          email: companyData.email || '',
          contacto: '',
        },
      });
    });

    return {
      id: company.id,
      name: company.nombre,
      ruc: company.rif,
      phone: company.telefono || '',
      email: company.email || '',
      status: 'Activo' as const,
    };
  } catch (error: any) {
    console.error('Error adding company:', error);
    
    // Si es un error de restricción única, mostrar mensaje específico
    if (error.message.includes('Unique constraint failed')) {
      throw new Error(`Ya existe una empresa con el RIF ${companyData.ruc}. Por favor, verifica el RIF e intenta nuevamente.`);
    }
    
    // Si es nuestro error personalizado, re-lanzarlo
    if (error.message.includes('Ya existe una empresa')) {
      throw error;
    }
    
    // Para otros errores, mensaje genérico
    throw new Error('Error al agregar empresa. Por favor, verifica los datos e intenta nuevamente.');
  }
}

export async function addSupply(supplyData: {
  name: string;
  category: string;
  stock: number;
  unit: string;
  expiryDate: string;
}): Promise<Supply> {
  try {
    const supply = await withDatabase(async (prisma) => {
      return await prisma.supply.create({
      data: {
        nombre: supplyData.name,
        descripcion: supplyData.category,
        cantidad: supplyData.stock,
        unidad: supplyData.unit,
        precio: 0, // Default price
        proveedor: '',
        fechaVencimiento: supplyData.expiryDate ? new Date(supplyData.expiryDate) : null,
        estado: 'DISPONIBLE',
      },
      });
    });

    return {
      id: supply.id,
      name: supply.nombre,
      category: supply.descripcion || '',
      stock: supply.cantidad,
      unit: supply.unidad,
      expiryDate: supply.fechaVencimiento?.toISOString() || '',
    };
  } catch (error) {
    console.error('Error adding supply:', error);
    throw new Error('Error al agregar suministro');
  }
}

// Helper function to ensure at least one doctor exists
export async function ensureDoctorExists(): Promise<string> {
  try {
    const doctors = await getDoctors();
    
    if (doctors.length === 0) {
      console.log('⚠️ No doctors found, creating a default doctor...');
      
      const defaultDoctor = await withDatabase(async (prisma) => {
        return await prisma.doctor.create({
          data: {
            nombre: 'Dr. Juan',
            apellido: 'Pérez',
            cedula: 'V-12345678',
            especialidad: 'Urología',
            telefono: '+58 412 123 4567',
            email: 'dr.perez@urovital.com',
            direccion: 'Caracas, Venezuela',
            area: 'Urología General',
            contacto: 'Dr. Juan Pérez'
          }
        });
      });
      
      console.log('✅ Default doctor created:', defaultDoctor.id);
      return defaultDoctor.id;
    }
    
    // Return the first doctor's ID
    return doctors[0].id;
  } catch (error) {
    console.error('Error ensuring doctor exists:', error);
    throw new Error('Error al verificar doctores disponibles');
  }
}

// Function to sync orphaned doctors (doctors without corresponding users)
export async function syncOrphanedDoctors(): Promise<{ created: number; errors: string[] }> {
  try {
    console.log('🔄 Syncing orphaned doctors...');
    
    const result = await withDatabase(async (prisma) => {
      // Find doctors that don't have corresponding users
      const orphanedDoctors = await prisma.doctor.findMany({
        where: {
          AND: [
            {
              NOT: {
                email: {
                  in: await prisma.user.findMany({
                    where: { role: 'Doctor' },
                    select: { email: true }
                  }).then((users: any[]) => users.map((u: any) => u.email).filter(Boolean))
                }
              }
            },
            {
              NOT: {
                telefono: {
                  in: await prisma.user.findMany({
                    where: { role: 'Doctor' },
                    select: { phone: true }
                  }).then((users: any[]) => users.map((u: any) => u.phone).filter(Boolean))
                }
              }
            }
          ]
        }
      });
      
      console.log(`Found ${orphanedDoctors.length} orphaned doctors`);
      
      let created = 0;
      const errors: string[] = [];
      
      for (const doctor of orphanedDoctors) {
        try {
          // Create corresponding user for this doctor
          const newUser = await prisma.user.create({
            data: {
              name: `${doctor.nombre} ${doctor.apellido}`,
              email: doctor.email || `${doctor.nombre.toLowerCase()}.${doctor.apellido.toLowerCase()}@urovital.com`,
              password: 'temp-password-123', // Temporary password
              role: 'Doctor',
              status: 'ACTIVE',
              phone: doctor.telefono || '',
              lastLogin: null,
              patientId: null,
              avatarUrl: doctor.avatarUrl,
              userId: `U${Date.now().toString().slice(-6)}`,
            }
          });
          
          console.log(`✅ Created user for doctor ${doctor.nombre} ${doctor.apellido}:`, newUser.id);
          created++;
        } catch (error) {
          const errorMsg = `Error creating user for doctor ${doctor.nombre} ${doctor.apellido}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
        }
      }
      
      return { created, errors };
    });
    
    console.log(`✅ Sync completed: ${result.created} users created, ${result.errors.length} errors`);
    return result;
  } catch (error) {
    console.error('❌ Error syncing orphaned doctors:', error);
    return { created: 0, errors: [`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`] };
  }
}

// Function to create a sample doctor for testing
export async function createSampleDoctor(): Promise<Doctor> {
  try {
    console.log('🔄 Creating sample doctor...');
    
    const doctor = await withDatabase(async (prisma) => {
      return await prisma.doctor.create({
        data: {
          nombre: 'Dr. María',
          apellido: 'González',
          cedula: 'V-87654321',
          especialidad: 'Urología Pediátrica',
          telefono: '+58 414 987 6543',
          email: 'dr.gonzalez@urovital.com',
          direccion: 'Valencia, Venezuela',
          area: 'Urología Pediátrica',
          contacto: 'Dr. María González'
        }
      });
    });
    
    console.log('✅ Sample doctor created:', doctor.id);
    return {
      id: doctor.id,
      nombre: doctor.nombre,
      especialidad: doctor.especialidad,
      area: doctor.area,
      contacto: doctor.contacto,
      avatarUrl: doctor.avatarUrl,
    };
  } catch (error) {
    console.error('Error creating sample doctor:', error);
    throw new Error('Error al crear doctor de ejemplo');
  }
}

export async function updateAppointment(appointmentId: string, appointmentData: {
  date?: string;
  reason?: string;
  status?: 'Programada' | 'Completada' | 'Cancelada';
  doctorId?: string;
}): Promise<Appointment> {
  try {
    console.log('🔄 Updating appointment:', appointmentId, appointmentData);
    
    const updatedAppointment = await withDatabase(async (prisma) => {
      const updateData: any = {};
      
      if (appointmentData.date) {
        updateData.fecha = new Date(appointmentData.date);
      }
      
      if (appointmentData.reason) {
        updateData.notas = appointmentData.reason;
      }
      
      if (appointmentData.status) {
        updateData.estado = appointmentData.status.toUpperCase();
      }
      
      if (appointmentData.doctorId) {
        updateData.doctorUserId = appointmentData.doctorId;
      }
      
      return await prisma.appointment.update({
        where: { id: appointmentId },
        data: updateData,
      });
    });

    return {
      id: updatedAppointment.id,
      patientId: updatedAppointment.patientUserId,
      doctorId: updatedAppointment.doctorUserId || '',
      date: updatedAppointment.fecha.toISOString(),
      reason: updatedAppointment.notas || 'Consulta médica',
      status: updatedAppointment.estado === 'COMPLETADA' ? 'Completada' as const : 
              updatedAppointment.estado === 'CANCELADA' ? 'Cancelada' as const : 'Programada' as const,
    };
  } catch (error) {
    console.error('❌ Error updating appointment:', error);
    throw new Error('Error al actualizar la cita');
  }
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  try {
    console.log('🔄 Deleting appointment:', appointmentId);
    
    await withDatabase(async (prisma) => {
      await prisma.appointment.delete({
        where: { id: appointmentId },
      });
    });
    
    console.log('✅ Appointment deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting appointment:', error);
    throw new Error('Error al eliminar la cita');
  }
}

export async function addAppointment(appointmentData: {
  patientId: string; // Ahora es userId del paciente
  doctorId?: string; // Ahora es userId del doctor
  date: string;
  reason: string;
}): Promise<Appointment> {
  try {
    console.log('🔄 Creating appointment with data:', appointmentData);
    
    const appointment = await withDatabase(async (prisma) => {
      // Validate patient exists by userId
      const patient = await prisma.user.findUnique({
        where: { userId: appointmentData.patientId },
        include: { patientInfo: true }
      });
      
      if (!patient) {
        throw new Error(`Paciente con userId ${appointmentData.patientId} no encontrado`);
      }
      
      if (patient.role !== 'patient') {
        throw new Error(`Usuario ${patient.name} no es un paciente`);
      }
      
      console.log('✅ Patient exists:', patient.name);
      
      // Validate doctor exists if doctorId is provided
      let validDoctorUserId: string | undefined = undefined;
      
      if (appointmentData.doctorId && appointmentData.doctorId.trim() !== '') {
        // Verify doctor exists by userId
        const doctor = await prisma.user.findUnique({
          where: { userId: appointmentData.doctorId },
          include: { doctorInfo: true }
        });
        
        if (!doctor) {
          throw new Error(`Doctor con userId ${appointmentData.doctorId} no encontrado`);
        }
        
        if (doctor.role !== 'Doctor' && doctor.role !== 'doctor') {
          throw new Error(`Usuario ${doctor.name} no es un doctor`);
        }
        
        console.log('✅ Doctor exists:', doctor.name);
        validDoctorUserId = appointmentData.doctorId;
      } else {
        console.log('ℹ️ No doctor selected for this appointment');
      }
      
      // Prepare appointment data using userIds
      const appointmentDataToCreate: any = {
        fecha: new Date(appointmentData.date),
        hora: '09:00', // Default time
        tipo: 'CONSULTA',
        estado: 'PROGRAMADA',
        notas: appointmentData.reason,
        patientUserId: appointmentData.patientId, // userId del paciente
        createdBy: 'U0001', // TODO: Obtener del usuario actual
      };
      
      // Only include doctorUserId if it's provided and valid
      if (validDoctorUserId) {
        appointmentDataToCreate.doctorUserId = validDoctorUserId;
      }
      
      console.log('📝 Creating appointment with data:', appointmentDataToCreate);
      
      return await prisma.appointment.create({
        data: appointmentDataToCreate,
      });
    });

    console.log('✅ Appointment created successfully:', appointment.id);
    
    return {
      id: appointment.id,
      patientId: appointment.patientUserId,
      doctorId: appointment.doctorUserId || '',
      date: appointment.fecha.toISOString(),
      reason: appointment.notas || 'Consulta médica',
      status: 'Programada' as const,
    };
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('no encontrado')) {
        throw new Error(error.message);
      }
      if (error.message.includes('no es un')) {
        throw new Error(error.message);
      }
      if (error.message.includes('Foreign key constraint')) {
        throw new Error('Error de referencia: El doctor o paciente seleccionado no existe');
      }
    }
    
    throw new Error('Error al crear la cita. Verifique que el doctor y paciente existan.');
  }
}

// DASHBOARD STATISTICS FUNCTIONS
export async function getAppointmentsWeeklyStats(): Promise<number[]> {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const appointments = await withDatabase(async (prisma) => {
      return await prisma.appointment.findMany({
      where: {
        fecha: {
          gte: weekAgo,
          lte: now,
        },
      },
      select: {
        fecha: true,
      },
      });
    });

    // Group by day of week (0 = Sunday, 1 = Monday, etc.)
    const dailyCounts = [0, 0, 0, 0, 0, 0, 0]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
    
    appointments.forEach((appointment: any) => {
      const dayOfWeek = appointment.fecha.getDay();
      dailyCounts[dayOfWeek]++;
    });

    // Return last 7 days starting from Friday (as per the original chart)
    return [
      dailyCounts[5], // Friday
      dailyCounts[6], // Saturday
      dailyCounts[0], // Sunday
      dailyCounts[1], // Monday
      dailyCounts[2], // Tuesday
      dailyCounts[3], // Wednesday
      dailyCounts[4], // Thursday
    ];
  } catch (error) {
    console.error('Error fetching weekly appointment stats:', error);
    return [0, 0, 0, 0, 0, 0, 0];
  }
}

export async function getLabResultsStats(): Promise<{ completed: number; pending: number }> {
  try {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const labResults = await withDatabase(async (prisma) => {
      return await prisma.labResult.findMany({
      where: {
        fecha: {
          gte: monthAgo,
          lte: now,
        },
      },
      });
    });

    // For now, we'll consider all lab results as "completed"
    // In a real scenario, you might have a status field
    const completed = labResults.length;
    const pending = 0; // This would need to be calculated based on pending lab orders

    return { completed, pending };
  } catch (error) {
    console.error('Error fetching lab results stats:', error);
    return { completed: 0, pending: 0 };
  }
}

export async function getPsaTrends(): Promise<{ dates: string[]; values: number[] }> {
  try {
    const psaResults = await withDatabase(async (prisma) => {
      return await prisma.labResult.findMany({
      where: {
        tipo: 'PSA',
        nombre: {
          contains: 'PSA',
          mode: 'insensitive',
        },
      },
      orderBy: {
        fecha: 'asc',
      },
      take: 6, // Last 6 PSA tests
      });
    });

    const dates = psaResults.map((result: any) => result.fecha.toISOString().split('T')[0]);
    const values = psaResults.map((result: any) => {
      // Extract numeric value from result string
      const match = result.resultado.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : 0;
    });

    return { dates, values };
  } catch (error) {
    console.error('Error fetching PSA trends:', error);
    return { dates: [], values: [] };
  }
}

// ADDITIONAL MISSING FUNCTIONS
export async function getReportsByPatientId(patientId: string): Promise<Report[]> {
  try {
    // For now, return all reports since we don't have patient-specific reports in schema
    const reports = await withDatabase(async (prisma) => {
      return await prisma.report.findMany({
      orderBy: { fecha: 'desc' },
      });
    });

    return reports.map((report: any) => ({
      id: report.id,
      patientId: patientId,
      title: report.titulo,
      date: report.fecha.toISOString(),
      type: report.tipo,
      notes: report.descripcion || '',
      fileUrl: '',
      attachments: [],
    }));
  } catch (error) {
    console.error('Error fetching reports by patient ID:', error);
    return [];
  }
}

export async function getPatientMedicalHistoryAsString(patientId: string): Promise<string> {
  try {
    const patient = await withDatabase(async (prisma) => {
      return await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        consultations: {
          include: {
            doctor: true,
            labResults: true,
            prescriptions: true,
          },
          orderBy: { fecha: 'desc' },
        },
        labResults: {
          orderBy: { fecha: 'desc' },
        },
        appointments: {
          include: {
            doctor: true,
          },
          orderBy: { fecha: 'desc' },
        },
      },
      });
    });

    if (!patient) {
      return 'Paciente no encontrado';
    }

    let history = `HISTORIA MÉDICA - ${patient.nombre} ${patient.apellido}\n`;
    history += `Cédula: ${patient.cedula}\n`;
    history += `Fecha de Nacimiento: ${patient.fechaNacimiento.toLocaleDateString()}\n`;
    history += `Teléfono: ${patient.telefono || 'No disponible'}\n`;
    history += `Email: ${patient.email || 'No disponible'}\n`;
    history += `Dirección: ${patient.direccion || 'No disponible'}\n\n`;

    // Consultas
    if (patient.consultations.length > 0) {
      history += 'CONSULTAS MÉDICAS:\n';
      history += '='.repeat(50) + '\n';
      patient.consultations.forEach((consultation: any, index: number) => {
        history += `${index + 1}. Fecha: ${consultation.fecha.toLocaleDateString()}\n`;
        history += `   Doctor: ${consultation.doctor ? `${consultation.doctor.nombre} ${consultation.doctor.apellido}` : 'No especificado'}\n`;
        history += `   Motivo: ${consultation.motivo}\n`;
        if (consultation.sintomas) history += `   Síntomas: ${consultation.sintomas}\n`;
        if (consultation.diagnostico) history += `   Diagnóstico: ${consultation.diagnostico}\n`;
        if (consultation.tratamiento) history += `   Tratamiento: ${consultation.tratamiento}\n`;
        if (consultation.observaciones) history += `   Observaciones: ${consultation.observaciones}\n`;
        history += '\n';
      });
    }

    // Resultados de Laboratorio
    if (patient.labResults.length > 0) {
      history += 'RESULTADOS DE LABORATORIO:\n';
      history += '='.repeat(50) + '\n';
      patient.labResults.forEach((result: any, index: number) => {
        history += `${index + 1}. Fecha: ${result.fecha.toLocaleDateString()}\n`;
        history += `   Estudio: ${result.nombre}\n`;
        history += `   Tipo: ${result.tipo}\n`;
        history += `   Resultado: ${result.resultado}\n`;
        history += '\n';
      });
    }

    // Citas
    if (patient.appointments.length > 0) {
      history += 'CITAS MÉDICAS:\n';
      history += '='.repeat(50) + '\n';
      patient.appointments.forEach((appointment: any, index: number) => {
        history += `${index + 1}. Fecha: ${appointment.fecha.toLocaleDateString()}\n`;
        history += `   Hora: ${appointment.hora}\n`;
        history += `   Tipo: ${appointment.tipo}\n`;
        history += `   Estado: ${appointment.estado}\n`;
        if (appointment.doctor) {
          history += `   Doctor: ${appointment.doctor.nombre} ${appointment.doctor.apellido}\n`;
        }
        if (appointment.notas) history += `   Notas: ${appointment.notas}\n`;
        history += '\n';
      });
    }

    return history;
  } catch (error) {
    console.error('Error generating patient medical history:', error);
    return 'Error al generar la historia médica del paciente';
  }
}

export async function getPatientsByCompanyId(companyId: string): Promise<Patient[]> {
  try {
    // Get users affiliated to this company through affiliations
    const affiliations = await withDatabase(async (prisma) => {
      return await prisma.affiliation.findMany({
        where: { 
          companyId: companyId,
          estado: 'ACTIVA'
        },
        include: {
          user: {
            include: {
              // We'll get patient data directly if it exists
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    console.log(`Found ${affiliations.length} affiliations for company ${companyId}`);

    // Get all patient IDs from affiliated users
    const patientIds = affiliations
      .map((affiliation: any) => affiliation.user.patientId)
      .filter(Boolean);

    console.log(`Found ${patientIds.length} patient IDs from affiliations`);

    // Get all patients in one query
    const patients = await withDatabase(async (prisma) => {
      return await prisma.patient.findMany({
        where: {
          id: {
            in: patientIds
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    console.log(`Found ${patients.length} patients in database`);

    // Get company name for display
    const company = await withDatabase(async (prisma) => {
      return await prisma.company.findUnique({
        where: { id: companyId }
      });
    });

    // Map to Patient interface
    const mappedPatients: Patient[] = patients.map((patient: any) => {
      const age = Math.floor((Date.now() - patient.fechaNacimiento.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      return {
        id: patient.id,
        name: `${patient.nombre} ${patient.apellido}`,
        cedula: patient.cedula,
        age,
        gender: 'Masculino' as const, // Default value
        bloodType: 'O+' as const,
        status: 'Activo' as const,
        lastVisit: patient.updatedAt.toISOString(),
        contact: {
          phone: patient.telefono || '',
          email: patient.email || '',
        },
        companyId: companyId,
        companyName: company?.nombre || undefined,
      };
    });

    console.log(`Returning ${mappedPatients.length} mapped patients`);
    return mappedPatients;
  } catch (error) {
    console.error('Error fetching patients by company ID:', error);
    return [];
  }
}

// RECEIPT FUNCTIONS
export async function createReceipt(receiptData: {
  patientId: string;
  amount: number;
  concept: string;
  method: string;
  createdBy: string;
}): Promise<any> {
  try {
    console.log('createReceipt called with data:', JSON.stringify(receiptData, null, 2));
    
    if (!isDatabaseAvailable()) {
      throw new Error('Database not available');
    }

    const prisma = getPrisma();
    console.log('Prisma client obtained successfully');
    
    // Check if receipt model is available
    if (!prisma.receipt) {
      throw new Error('Modelo Receipt no está disponible. Por favor, reinicia la aplicación.');
    }
    
    // Generate receipt number
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // Get count of receipts for today to generate sequential number
    const todayStart = new Date(year, today.getMonth(), today.getDate());
    const todayEnd = new Date(year, today.getMonth(), today.getDate() + 1);
    
    let todayReceipts = 0;
    try {
      todayReceipts = await prisma.receipt.count({
        where: {
          createdAt: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      });
    } catch (countError) {
      console.log('Error counting receipts, using 0 as default:', countError);
      todayReceipts = 0;
    }
    
    const receiptNumber = `REC-${year}${month}${day}-${String(todayReceipts + 1).padStart(3, '0')}`;
    console.log('Generated receipt number:', receiptNumber);

    console.log('Creating receipt with data:', {
      number: receiptNumber,
      patientId: receiptData.patientId,
      amount: receiptData.amount,
      concept: receiptData.concept,
      method: receiptData.method,
      createdBy: receiptData.createdBy,
    });

    const receipt = await prisma.receipt.create({
      data: {
        number: receiptNumber,
        patientUserId: receiptData.patientId, // Use patientUserId instead of patientId
        amount: new Decimal(receiptData.amount),
        concept: receiptData.concept,
        method: receiptData.method,
        createdBy: receiptData.createdBy,
      },
    });

    console.log('Receipt created successfully:', receipt);

    // Create audit log
    await createAuditLog(receiptData.createdBy, 'Comprobante creado', `Comprobante ${receiptNumber} generado para paciente ${receiptData.patientId}`);

    return {
      id: receipt.id,
      number: receipt.number,
      patientId: receipt.patientUserId, // Use patientUserId instead of patientId
      amount: Number(receipt.amount), // Convert Decimal to number
      concept: receipt.concept,
      method: receipt.method,
      createdAt: receipt.createdAt,
      createdBy: receipt.createdBy,
    };
  } catch (error) {
    console.error('Error creating receipt:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        throw new Error('Error de conexión a la base de datos. Verifique la configuración.');
      } else if (error.message.includes('unique constraint')) {
        throw new Error('Ya existe un comprobante con este número.');
      } else if (error.message.includes('foreign key')) {
        throw new Error('Error de referencia en la base de datos. Verifique que el paciente exista.');
      } else if (error.message.includes('required')) {
        throw new Error('Faltan campos requeridos para crear el comprobante.');
      } else {
        throw new Error(`Error al crear comprobante: ${error.message}`);
      }
    }
    
    throw new Error('Error desconocido al crear comprobante');
  }
}

export async function getReceipts(): Promise<any[]> {
  try {
    if (!isDatabaseAvailable()) {
      console.log('Database not available - returning empty array');
      return [];
    }

    const prisma = getPrisma();
    
    const receipts = await prisma.receipt.findMany({
      include: {
        patient: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return receipts.map((receipt: any) => ({
      id: receipt.id,
      number: receipt.number,
      patientName: receipt.patient ? receipt.patient.name : 'Paciente no encontrado',
      patientCedula: 'No especificada', // cedula no está disponible en el modelo User
      amount: Number(receipt.amount), // Convert Decimal to number
      concept: receipt.concept,
      method: receipt.method,
      createdAt: receipt.createdAt.toISOString(),
      createdBy: receipt.createdBy,
    }));
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return [];
  }
}

export async function getReceiptById(receiptId: string): Promise<any | null> {
  try {
    if (!isDatabaseAvailable()) {
      return null;
    }

    const prisma = getPrisma();
    
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        patient: true,
      },
    });

    if (!receipt) {
      return null;
    }

    return {
      id: receipt.id,
      number: receipt.number,
      patientName: receipt.patient ? receipt.patient.name : 'Paciente no encontrado',
      patientCedula: 'No especificada', // cedula no está disponible en el modelo User
      amount: Number(receipt.amount), // Convert Decimal to number
      concept: receipt.concept,
      method: receipt.method,
      createdAt: receipt.createdAt.toISOString(),
      createdBy: receipt.createdBy,
    };
  } catch (error) {
    console.error('Error fetching receipt by ID:', error);
    return null;
  }
}