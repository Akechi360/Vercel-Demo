'use server';

import type { Patient, Appointment, Consultation, LabResult, IpssScore, Report, Company, Supply, Provider, PaymentMethod, PaymentType, Payment, Doctor, Estudio, AffiliateLead } from './types';
import { User } from '@prisma/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { getPrismaClient, isDatabaseAvailable } from './db';
// Validación de roles estandarizada - Importar utilidades centralizadas
import { UserRole } from './types';
// Importado desde src/lib/utils.ts - única fuente de validateDate
import { validateUserRole, DatabaseErrorHandler, withTransaction, validateDate } from './utils';
import { UserContext } from './types';
import { notifyNewAppointment } from './notification-service';

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
      where: { 
        role: UserRole.PATIENT, // Validación de roles estandarizada
        patientInfo: {
          isNot: null
        }
      },
      include: {
        patientInfo: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return patients.map(user => {
      // ✅ LOGS DE DEPURACIÓN - Verificar datos del usuario
      console.log('🔍 getPatients - Procesando usuario:', {
        id: user.id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        status: user.status,
        hasPatientInfo: !!user.patientInfo
      });

      // ✅ FUNCIÓN DE VALIDACIÓN Y CORRECCIÓN DE ID
      const getValidPatientId = (user: any): string => {
        // Prioridad 1: userId si es válido
        if (user.userId && typeof user.userId === 'string' && user.userId.trim() !== '') {
          return user.userId;
        }
        
        // Prioridad 2: id como fallback
        if (user.id && typeof user.id === 'string' && user.id.trim() !== '') {
          console.log('🔍 getPatients - Usando user.id como fallback:', user.id);
          return user.id;
        }
        
        // Prioridad 3: generar ID único
        const fallbackId = `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('🔍 getPatients - Generando ID único como fallback:', fallbackId);
        return fallbackId;
      };

      const validPatientId = getValidPatientId(user);
      
      // ✅ LOGS DE VALIDACIÓN
      if (!user.userId || typeof user.userId !== 'string' || user.userId.trim() === '') {
        console.error('❌ getPatients - user.userId inválido, usando ID corregido:', {
          originalUserId: user.userId,
          originalId: user.id,
          correctedId: validPatientId,
          name: user.name
        });
      }

      const patientInfo = user.patientInfo;
      if (!patientInfo) {
        // Si no tiene patientInfo, crear datos por defecto
        return {
          id: validPatientId, // Usar ID validado y corregido
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
        id: validPatientId, // Usar ID validado y corregido
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
}, userContext?: UserContext): Promise<Patient> {
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
    
    // Create user and patientInfo using withTransaction - atomicidad asegurada
    const result = await withTransaction(async (prisma) => {
      // Generate dynamic user ID and email
      const currentTime = userContext?.currentTime || new Date();
      const dynamicUserId = `U${currentTime.getTime().toString().slice(-6)}`;
      const dynamicEmail = patientData.contact.email || `patient-${currentTime.getTime()}@local.com`;
      
      // Create user for the patient
      const user = await prisma.user.create({
        data: {
          name: patientData.name,
          email: dynamicEmail,
          password: `temp-password-${currentTime.getTime()}`, // Dynamic temporary password
          role: UserRole.PATIENT, // Validación de roles estandarizada
          status: 'ACTIVE',
          phone: patientData.contact.phone,
          userId: dynamicUserId,
        },
      });
      
      console.log('User created successfully:', user);

      // Create patientInfo for the user
      const patientInfo = await prisma.patientInfo.create({
        data: {
          userId: user.id,
          cedula: patientData.cedula,
          fechaNacimiento,
          telefono: patientData.contact.phone,
          direccion: '', // Default empty address
          bloodType: patientData.bloodType,
          gender: patientData.gender,
        },
      });
      
      console.log('PatientInfo created successfully:', patientInfo);

      console.log('User created successfully:', user);

      // If companyId is provided, create affiliation
      console.log('🔍 Checking companyId:', patientData.companyId);
      if (patientData.companyId) {
        console.log('✅ Creating affiliation for companyId:', patientData.companyId);
        const affiliation = await prisma.affiliation.create({
          data: {
            planId: `plan-${currentTime.getFullYear()}`, // Dynamic plan ID based on year
            estado: 'ACTIVA', // This should match the enum value
            fechaInicio: currentTime, // Use dynamic time
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
        id: user.id,
        name: user.name,
        cedula: patientInfo.cedula,
        age: patientData.age,
        gender: patientData.gender,
        bloodType: patientData.bloodType,
        status: 'Activo' as const,
        lastVisit: user.createdAt.toISOString(),
        contact: {
          phone: user.phone || '',
          email: user.email || '',
        },
        companyId: patientData.companyId,
      };
    });

    return result;
  } catch (error) {
    // Manejo centralizado de errores - DatabaseErrorHandler
    DatabaseErrorHandler.handle(error, 'crear paciente');
  }
}

export async function updatePatient(userId: string, patientData: {
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
    console.log('  - userId:', userId, '(type:', typeof userId, ')');
    console.log('  - patientData:', JSON.stringify(patientData, null, 2));
    
    // Validate required fields
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('ID de usuario inválido o vacío');
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
    
    // Update patient using withDatabase - mejor manejo de errores
    const updatedPatient = await withDatabase(async (prisma) => {
      console.log('🔍 Checking if patient exists...');
      
      // Find user by userId
      const existingUser = await prisma.user.findUnique({
        where: { userId: userId },
        include: { patientInfo: true }
      });

      if (!existingUser) {
        throw new Error(`Usuario con ID ${userId} no encontrado en la base de datos`);
      }

      if (!existingUser.patientInfo) {
        console.log('⚠️ PatientInfo not found, creating new patient info...');
        
        // Create patient info if it doesn't exist
        const newPatientInfo = await prisma.patientInfo.create({
          data: {
            userId: existingUser.userId, // Use the userId field of the user
            cedula: `V-${Date.now().toString().slice(-8)}`, // Generate temporary cedula based on timestamp
            fechaNacimiento: new Date(2000, 0, 1), // Default birth date
            telefono: patientData.phone || null,
            direccion: null,
            bloodType: patientData.bloodType,
            gender: patientData.gender,
          }
        });
        
        console.log('✅ Created new patient info:', newPatientInfo.id);
        
        // Update the existingUser object to include the new patientInfo
        existingUser.patientInfo = newPatientInfo;
      }

      console.log('✅ Patient exists:', {
        userId: existingUser.userId,
        name: existingUser.name,
        email: existingUser.email,
        patientInfoId: existingUser.patientInfo.id
      });

      // Parse name to get first and last name
      const [nombre, apellido] = patientData.name.split(' ', 2);
      
      // Calculate birth date from age
      const fechaNacimiento = new Date(Date.now() - patientData.age * 365.25 * 24 * 60 * 60 * 1000);
      
      // Update user record
      console.log('🔄 Updating user record...');
      const updatedUser = await prisma.user.update({
        where: { userId: userId },
        data: {
          name: patientData.name.trim(),
          email: patientData.email.trim(),
          phone: patientData.phone.trim(),
        }
      });

      // Update patient info record
      console.log('🔄 Updating patient info record...');
      const updatedPatientInfo = await prisma.patientInfo.update({
        where: { userId: existingUser.userId },
        data: {
          fechaNacimiento,
          telefono: patientData.phone.trim(),
          direccion: '', // Default empty address
          bloodType: patientData.bloodType,
          gender: patientData.gender,
        }
      });

      console.log('✅ Patient records updated successfully:', {
        userId: updatedUser.userId,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        patientInfo: {
          cedula: updatedPatientInfo.cedula,
          fechaNacimiento: updatedPatientInfo.fechaNacimiento,
          telefono: updatedPatientInfo.telefono,
          bloodType: updatedPatientInfo.bloodType,
          gender: updatedPatientInfo.gender
        }
      });

      // Handle company affiliation changes
      if (patientData.companyId) {
        // First, deactivate any existing affiliations for this user
        await prisma.affiliation.updateMany({
          where: { 
            userId: updatedUser.id,
            estado: 'ACTIVA'
          },
          data: { estado: 'INACTIVA' }
        });
        
        // Create new affiliation
        await prisma.affiliation.create({
          data: {
            planId: 'default-plan',
            estado: 'ACTIVA',
            fechaInicio: new Date(),
            monto: 0,
            beneficiarios: undefined,
            companyId: patientData.companyId,
            userId: updatedUser.id,
          },
        });
      } else {
        // If no companyId, deactivate all affiliations (patient becomes particular)
        await prisma.affiliation.updateMany({
          where: { 
            userId: updatedUser.id,
            estado: 'ACTIVA'
          },
          data: { estado: 'INACTIVA' }
        });
      }

      // Get updated affiliations for the return data
      const updatedAffiliations = await prisma.affiliation.findMany({
        where: { userId: updatedUser.id },
        include: { company: true }
      });

      // Return patient in the expected format
      return {
        id: updatedUser.userId,
        name: updatedUser.name,
        cedula: updatedPatientInfo.cedula,
        age: patientData.age,
        gender: patientData.gender,
        bloodType: patientData.bloodType,
        status: 'Activo' as const,
        lastVisit: updatedUser.createdAt.toISOString(),
        contact: {
          phone: updatedUser.phone || '',
          email: updatedUser.email || '',
        },
        companyId: patientData.companyId,
        companyName: updatedAffiliations.length > 0 ? updatedAffiliations[0].company?.nombre : undefined,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.createdAt
      };
    });

    console.log('✅ Patient updated successfully - FINAL RESULT:', JSON.stringify(updatedPatient, null, 2));
    return updatedPatient;
  } catch (error: any) {
    console.error('[UPDATE_PATIENT] ❌ Error capturado:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
      fullError: error
    });
    // Manejo centralizado de errores - DatabaseErrorHandler
    DatabaseErrorHandler.handle(error, 'actualizar paciente');
    // Esta línea nunca se alcanzará porque handle() lanza un error
    throw error;
  }
}

export async function deletePatient(userId: string): Promise<void> {
  try {
    // Delete patient using withTransaction - atomicidad asegurada
    await withTransaction(async (prisma) => {
      // Find the user with this userId
      const user = await prisma.user.findUnique({
        where: { userId: userId },
        include: { patientInfo: true }
      });

      if (!user) {
        throw new Error('Paciente no encontrado');
      }

      // Delete the patientInfo if it exists
      if (user.patientInfo) {
        await prisma.patientInfo.delete({
          where: { userId: user.id }
        });
        console.log(`✅ Deleted patientInfo for user ${user.id}`);
      }

      // Delete the user
      await prisma.user.delete({
        where: { id: user.id }
      });

      console.log(`✅ Deleted user/patient ${userId}`);
      
      // Dispatch global event to notify all components
      if (typeof window !== 'undefined') {
        const { globalEventBus } = await import('@/lib/store/global-store');
        globalEventBus.emitPatientDeleted(userId);
        console.log('📤 Dispatched global patientDeleted event for user:', userId);
      }
    });
  } catch (error) {
    // Manejo centralizado de errores - DatabaseErrorHandler
    DatabaseErrorHandler.handle(error, 'eliminar paciente');
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
      userId: appointment.patientUserId, // userId del paciente
      doctorUserId: appointment.doctorUserId || '', // userId del doctor
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
      const doctorsWithUsers = await prisma.doctorInfo.findMany({
        where: {
          OR: [
            {
              email: {
                in: await prisma.user.findMany({
                  where: { role: UserRole.DOCTOR }, // Validación de roles estandarizada
                  select: { email: true }
                }).then((users: any[]) => users.map((u: any) => u.email).filter(Boolean))
              }
            },
            {
              telefono: {
                in: await prisma.user.findMany({
                  where: { role: UserRole.DOCTOR }, // Validación de roles estandarizada
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
        role: UserRole.DOCTOR // Validación de roles estandarizada
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
      // Get users with role 'patient' but without patientInfo (not added to patients module yet)
      const patientUsersWithoutInfo = await prisma.user.findMany({
        where: {
          role: UserRole.PATIENT, // Validación de roles estandarizada
          patientInfo: null
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true
        },
        orderBy: { name: 'asc' }
      });

      // Filter by active status
      const selectableUsers = patientUsersWithoutInfo.filter((user: any) => 
        user.status === 'ACTIVE'
      );

      return selectableUsers.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      }));
    }, []);

    console.log(`📊 Found ${users.length} selectable patient users without patientInfo`);
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
    //   data: { userId: patient.id }
    // });

    // console.log('User updated with userId:', patient.id);

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
      userId: consultation.patientUserId, // userId del paciente
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
  userId: string;
  date: string;
  doctor: string;
  type: 'Inicial' | 'Seguimiento' | 'Pre-operatorio' | 'Post-operatorio';
  notes: string;
  prescriptions?: any[];
  reports?: any[];
  labResults?: any[];
}, userContext?: UserContext): Promise<Consultation> {
  try {
    // ✅ VALIDACIONES ANTES DE TRANSACCIÓN - Mejora de performance
    if (!consultationData.userId || consultationData.userId.trim() === '') {
      throw new Error('userId es requerido para crear la consulta');
    }

    if (!userContext?.userId) {
      throw new Error('userContext.userId es requerido para crear la consulta');
    }

    console.log('🔄 Creating consultation with data:', {
      userId: consultationData.userId,
      date: consultationData.date,
      doctor: consultationData.doctor,
      type: consultationData.type,
      createdBy: userContext.userId
    });

    // Validación de fecha - validateDate
    const validatedDate = validateDate(consultationData.date, 'Fecha de la consulta');
    console.log('✅ Consultation date validation passed:', validatedDate.toISOString());
    
    // ✅ TRANSACCIÓN OPTIMIZADA - Solo cliente tx, consultas simplificadas
    const consultation = await withTransaction(async (tx) => {
      console.log('🔄 Iniciando transacción optimizada para crear consulta');
      console.log('🔍 Cliente de transacción disponible:', !!tx);
      
      // ✅ CONSULTA OPTIMIZADA 1: Validar paciente (solo campos necesarios)
      console.log('🔍 Buscando paciente con userId:', consultationData.userId);
      const patient = await tx.user.findUnique({
        where: { userId: consultationData.userId },
        select: { 
          userId: true, 
          role: true, 
          status: true,
          name: true 
        }
      });
      
      if (!patient) {
        throw new Error(`Paciente con ID ${consultationData.userId} no encontrado`);
      }
      
      // Validación de roles estandarizada
      validateUserRole(patient, UserRole.PATIENT);

      // ✅ CONSULTA OPTIMIZADA 2: Buscar doctor (una sola consulta con OR optimizado)
      console.log('🔍 Buscando doctor con nombre:', consultationData.doctor);
      const doctor = await tx.doctorInfo.findFirst({
        where: {
          OR: [
            { especialidad: { contains: consultationData.doctor } },
            { cedula: { contains: consultationData.doctor } },
            { user: { name: { contains: consultationData.doctor } } }
          ]
        },
        select: { 
          userId: true, 
          especialidad: true,
          cedula: true 
        }
      });
      
      console.log('🔍 Doctor encontrado:', !!doctor);

      // ✅ CONSULTA OPTIMIZADA 3: Crear consulta (una sola operación)
      console.log('🔍 Creando consulta...');
      return await tx.consultation.create({
        data: {
          fecha: validatedDate,
          motivo: consultationData.type,
          sintomas: '',
          diagnostico: '',
          tratamiento: '',
          observaciones: consultationData.notes,
          patientUserId: consultationData.userId,
          doctorUserId: doctor?.userId || null,
          createdBy: userContext.userId, // ✅ Usar userContext directamente
        },
        select: {
          id: true,
          fecha: true,
          motivo: true,
          observaciones: true,
          patientUserId: true,
          doctorUserId: true,
          createdBy: true,
          patient: {
            select: { name: true, userId: true }
          },
          doctor: {
            select: { name: true, userId: true }
          }
        }
      });
    });

    return {
      id: consultation.id,
      userId: consultation.patientUserId,
      date: consultation.fecha.toISOString(),
      doctor: consultation.doctor ? `${consultation.doctor.nombre} ${consultation.doctor.apellido}` : consultationData.doctor,
      type: consultationData.type,
      notes: consultation.observaciones || '',
      prescriptions: consultationData.prescriptions || [],
      labResults: consultationData.labResults || [],
      reports: consultationData.reports || [],
    };
  } catch (error) {
    // Manejo centralizado de errores - DatabaseErrorHandler
    DatabaseErrorHandler.handle(error, 'crear consulta');
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
      userId: result.paciente.id,
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
      userId: 'default-patient', // Default since we don't have patient relationship in schema
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
          creator: true,
        },
        orderBy: { fecha: 'desc' },
      });
    }, []); // Fallback to empty array

    return payments.map((payment: any) => ({
      id: payment.id,
      userId: payment.patient.userId,
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
    // ===== ADMINISTRADOR FIJO PARA DESARROLLO =====
    // ⚠️ SOLO PARA DESARROLLO - ELIMINAR EN PRODUCCIÓN
    if (process.env.NODE_ENV === 'development') {
      if (credentials.email === 'admin@urovital.com' && credentials.password === 'admin123') {
        console.log('🔐 Acceso de administrador fijo de desarrollo');
        return {
          success: true,
          user: {
            id: 'dev-admin-fixed',
            name: 'Administrador UroVital',
            email: 'admin@urovital.com',
            role: UserRole.ADMIN,
            status: 'ACTIVE',
            userId: 'ADMIN-001',
          },
        };
      }
    }

    // Check for master admin first (hardcoded for security)
  if (credentials.email === (process.env.DEV_BACKDOOR_EMAIL || '[REDACTED]') && credentials.password === (process.env.DEV_BACKDOOR_PASSWORD || '[REDACTED]')) {
    return {
      success: true,
      user: {
        id: 'master-admin',
        name: 'Master Administrator',
        email: process.env.DEV_BACKDOOR_EMAIL || '[REDACTED]',
        role: UserRole.ADMIN, // Validación de roles estandarizada
        status: 'ACTIVE',
        userId: null,
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
        userId: user.userId,
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
}, userContext?: UserContext): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔍 Creating affiliation with data:', affiliationData);
    
    // Create affiliation using withTransaction - atomicidad asegurada
    const affiliation = await withTransaction(async (prisma) => {
      // Verificar que el usuario existe
      const userExists = await prisma.user.findUnique({
        where: { id: affiliationData.userId }
      });
      
      if (!userExists) {
        throw new Error(`Usuario con ID ${affiliationData.userId} no existe`);
      }
      
      console.log('✅ User exists:', userExists.name);
      
      // Use dynamic context for affiliation creation
      const currentTime = userContext?.currentTime || new Date();
      const dynamicPlanId = affiliationData.planId || `plan-${currentTime.getFullYear()}`;
      
      return await prisma.affiliation.create({
        data: {
          planId: dynamicPlanId, // Dynamic plan ID based on year
          tipoPago: affiliationData.tipoPago || null,
          estado: (affiliationData.estado as any) || 'ACTIVA',
          fechaInicio: currentTime, // Use dynamic time
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
    // Manejo centralizado de errores - DatabaseErrorHandler
    try {
      DatabaseErrorHandler.handle(error, 'crear afiliación');
    } catch (handledError) {
      return { success: false, error: handledError instanceof Error ? handledError.message : 'Error desconocido' };
    }
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

export async function cleanDuplicateAffiliations(): Promise<{ success: boolean; removed: number; error?: string }> {
  try {
    console.log('🧹 Cleaning duplicate affiliations...');
    
    const result = await withDatabase(async (prisma) => {
      // Find all affiliations grouped by userId and companyId
      const affiliations = await prisma.affiliation.findMany({
        where: { estado: 'ACTIVA' },
        orderBy: { createdAt: 'asc' }
      });
      
      // Group by userId + companyId combination
      const grouped = new Map<string, any[]>();
      affiliations.forEach((aff: any) => {
        const key = `${aff.userId}-${aff.companyId}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(aff);
      });
      
      let removedCount = 0;
      
      // For each group with more than 1 affiliation, keep the oldest and remove the rest
      for (const [key, group] of grouped) {
        if (group.length > 1) {
          console.log(`🔍 Found ${group.length} duplicate affiliations for key: ${key}`);
          
          // Sort by createdAt (oldest first) and keep the first one
          const sorted = group.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          const toKeep = sorted[0];
          const toRemove = sorted.slice(1);
          
          console.log(`✅ Keeping affiliation ${toKeep.id} (oldest), removing ${toRemove.length} duplicates`);
          
          // Remove the duplicates
          for (const duplicate of toRemove) {
            await prisma.affiliation.delete({
              where: { id: duplicate.id }
            });
            removedCount++;
            console.log(`🗑️ Removed duplicate affiliation: ${duplicate.id}`);
          }
        }
      }
      
      return removedCount;
    });
    
    console.log(`✅ Cleanup completed. Removed ${result} duplicate affiliations.`);
    return { success: true, removed: result };
    
  } catch (error) {
    console.error('❌ Error cleaning duplicate affiliations:', error);
    return { success: false, removed: 0, error: error instanceof Error ? error.message : 'Unknown error' };
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
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        status: data.status || 'INACTIVE',
        phone: data.phone || null,
        lastLogin: data.lastLogin || null,
        avatarUrl: data.avatarUrl || null,
        userId: userId,
      },
    });

    console.log('✅ Usuario creado exitosamente:', { id: newUser.id, userId: newUser.userId, name: newUser.name });

    // ✨ Si es paciente, crear PatientInfo automáticamente
    if (data.role === 'patient' || data.role === 'PATIENT' || data.role === 'USER') {
      try {
        const timestamp = Date.now().toString().slice(-8);
        const cedula = `V-${timestamp}-${userId.slice(-4)}`;
        
        const patientInfo = await prisma.patientInfo.create({
          data: {
            userId: newUser.userId, // ✅ Usar userId, NO id
            cedula: cedula,
            fechaNacimiento: new Date(2000, 0, 1), // Fecha por defecto - el usuario puede actualizarla después
            telefono: data.phone || '',
            direccion: '',
            bloodType: 'O+', // Tipo de sangre por defecto
            gender: 'Otro' // Género por defecto
          }
        });
        
        console.log('✅ PatientInfo creado automáticamente:', { cedula: patientInfo.cedula });
      } catch (patientInfoError) {
        console.error('⚠️ Error creando PatientInfo (no crítico):', patientInfoError);
        // No fallar el registro si PatientInfo falla - se puede crear después
      }
    }

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
  userId: string | null;
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
      const existingDoctor = await prisma.doctorInfo.findUnique({
        where: { userId: userId }
      });
      
      if (existingDoctor) {
        console.log('✅ Doctor record already exists:', existingDoctor.id);
        return existingDoctor.id;
      }
      
      // Create new doctor record
      const newDoctor = await prisma.doctorInfo.create({
        data: {
          userId: userId,
          especialidad: 'Urología', // Default specialty
          cedula: `V-${Date.now()}`, // Generate unique cedula
          telefono: userData.phone || '',
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
      // Find and delete doctor record
      const doctor = await prisma.doctorInfo.findUnique({
        where: { userId: userId }
      });
      
      if (doctor) {
        await prisma.doctorInfo.delete({
          where: { id: doctor.id }
        });
        console.log('✅ Doctor record removed:', doctor.id);
      } else {
        console.log('⚠️ No doctor record found to remove');
      }
    });
  } catch (error) {
    console.error('❌ Error removing doctor record:', error);
  }
}

// Helper function to create promotora record when user role changes to "promotora"
export async function ensurePromotoraRecord(userId: string, userData: Partial<User>): Promise<string | null> {
  try {
    console.log('🔄 Ensuring promotora record for user:', userId);
    
    const promotoraId = await withDatabase(async (prisma) => {
      // Check if promotora record already exists
      const existingPromotora = await prisma.promotoraInfo.findUnique({
        where: { userId: userId }
      });
      
      if (existingPromotora) {
        console.log('✅ Promotora record already exists:', existingPromotora.id);
        return existingPromotora.id;
      }
      
      // Create new promotora record
      const newPromotora = await prisma.promotoraInfo.create({
        data: {
          userId: userId,
          cedula: `V-${Date.now()}`, // Generate unique cedula
          telefono: userData.phone || '',
          direccion: '',
          areaAsignada: 'Zona General',
          supervisor: 'Administrador',
          fechaIngreso: new Date(),
          salario: 800.00,
          comision: 5.0,
          estado: 'ACTIVA'
        }
      });
      
      console.log('✅ Promotora record created:', newPromotora.id);
      return newPromotora.id;
    });
    
    return promotoraId;
  } catch (error) {
    console.error('❌ Error ensuring promotora record:', error);
    return null;
  }
}

// Helper function to remove promotora record when user role changes from "promotora"
export async function removePromotoraRecord(userId: string): Promise<void> {
  try {
    console.log('🔄 Removing promotora record for user:', userId);
    
    await withDatabase(async (prisma) => {
      // Find and delete promotora record
      const promotora = await prisma.promotoraInfo.findUnique({
        where: { userId: userId }
      });
      
      if (promotora) {
        await prisma.promotoraInfo.delete({
          where: { id: promotora.id }
        });
        console.log('✅ Promotora record removed:', promotora.id);
      } else {
        console.log('⚠️ No promotora record found to remove');
      }
    });
  } catch (error) {
    console.error('❌ Error removing promotora record:', error);
  }
}

// Helper function to create secretaria record when user role changes to "secretaria"
export async function ensureSecretariaRecord(userId: string, userData: Partial<User>): Promise<string | null> {
  try {
    console.log('🔄 Ensuring secretaria record for user:', userId);
    
    const secretariaId = await withDatabase(async (prisma) => {
      // Check if secretaria record already exists
      const existingSecretaria = await prisma.secretariaInfo.findUnique({
        where: { userId: userId }
      });
      
      if (existingSecretaria) {
        console.log('✅ Secretaria record already exists:', existingSecretaria.id);
        return existingSecretaria.id;
      }
      
      // Create new secretaria record
      const newSecretaria = await prisma.secretariaInfo.create({
        data: {
          userId: userId,
          cedula: `V-${Date.now()}`, // Generate unique cedula
          telefono: userData.phone || '',
          direccion: '',
          turno: 'Mañana (8:00 AM - 4:00 PM)',
          supervisor: 'Administrador',
          fechaIngreso: new Date(),
          salario: 1200.00,
          especialidades: 'Atención al Cliente, Gestión de Citas',
          estado: 'ACTIVA'
        }
      });
      
      console.log('✅ Secretaria record created:', newSecretaria.id);
      return newSecretaria.id;
    });
    
    return secretariaId;
  } catch (error) {
    console.error('❌ Error ensuring secretaria record:', error);
    return null;
  }
}

// Helper function to remove secretaria record when user role changes from "secretaria"
export async function removeSecretariaRecord(userId: string): Promise<void> {
  try {
    console.log('🔄 Removing secretaria record for user:', userId);
    
    await withDatabase(async (prisma) => {
      // Find and delete secretaria record
      const secretaria = await prisma.secretariaInfo.findUnique({
        where: { userId: userId }
      });
      
      if (secretaria) {
        await prisma.secretariaInfo.delete({
          where: { id: secretaria.id }
        });
        console.log('✅ Secretaria record removed:', secretaria.id);
      } else {
        console.log('⚠️ No secretaria record found to remove');
      }
    });
  } catch (error) {
    console.error('❌ Error removing secretaria record:', error);
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
    
    // Update user using withTransaction - atomicidad asegurada
    const updatedUser = await withTransaction(async (prisma) => {
      console.log('🔄 Inside withTransaction, calling prisma.user.update...');
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
      
      // Handle changes TO specific roles - Validación de roles estandarizada
      if (data.role === UserRole.DOCTOR) {
        // Create doctor record if changing TO doctor
        const doctorId = await ensureDoctorRecord(userId, {
          name: data.name || currentUser.name,
          email: data.email || currentUser.email,
          phone: data.phone || currentUser.phone
        });
        
        if (doctorId) {
          console.log('✅ Doctor record created/verified for user:', userId);
        }
      } else if (data.role === UserRole.PROMOTORA) {
        // Create promotora record if changing TO promotora
        const promotoraId = await ensurePromotoraRecord(userId, {
          name: data.name || currentUser.name,
          email: data.email || currentUser.email,
          phone: data.phone || currentUser.phone
        });
        
        if (promotoraId) {
          console.log('✅ Promotora record created/verified for user:', userId);
        }
      } else if (data.role === UserRole.SECRETARIA) {
        // Create secretaria record if changing TO secretaria
        const secretariaId = await ensureSecretariaRecord(userId, {
          name: data.name || currentUser.name,
          email: data.email || currentUser.email,
          phone: data.phone || currentUser.phone
        });
        
        if (secretariaId) {
          console.log('✅ Secretaria record created/verified for user:', userId);
        }
      } else if (data.role === 'patient' || data.role === 'PATIENT' || data.role === UserRole.USER) {
        // ✨ Create patient record if changing TO patient
        try {
          await withDatabase(async (prisma) => {
            // Check if PatientInfo already exists
            const existingPatientInfo = await prisma.patientInfo.findUnique({
              where: { userId: updatedUser.userId }
            });
            
            if (!existingPatientInfo) {
              const timestamp = Date.now().toString().slice(-8);
              const cedula = `V-${timestamp}-${updatedUser.userId.slice(-4)}`;
              
              await prisma.patientInfo.create({
                data: {
                  userId: updatedUser.userId,
                  cedula: cedula,
                  fechaNacimiento: new Date(2000, 0, 1),
                  telefono: data.phone || currentUser.phone || '',
                  direccion: '',
                  bloodType: 'O+',
                  gender: 'Otro'
                }
              });
              
              console.log('✅ PatientInfo created for user:', userId);
            } else {
              console.log('✅ PatientInfo already exists for user:', userId);
            }
          });
        } catch (error) {
          console.error('⚠️ Error creating PatientInfo:', error);
        }
      }
      
      // Handle changes FROM specific roles - Validación de roles estandarizada
      if (currentUser.role === UserRole.DOCTOR && data.role !== UserRole.DOCTOR) {
        // Remove doctor record if changing FROM doctor
        await removeDoctorRecord(userId);
        console.log('✅ Doctor record removed for user:', userId);
      } else if (currentUser.role === UserRole.PROMOTORA && data.role !== UserRole.PROMOTORA) {
        // Remove promotora record if changing FROM promotora
        await removePromotoraRecord(userId);
        console.log('✅ Promotora record removed for user:', userId);
      } else if (currentUser.role === UserRole.SECRETARIA && data.role !== UserRole.SECRETARIA) {
        // Remove secretaria record if changing FROM secretaria
        await removeSecretariaRecord(userId);
        console.log('✅ Secretaria record removed for user:', userId);
      } else if ((currentUser.role === 'patient' || currentUser.role === 'PATIENT' || currentUser.role === UserRole.USER) && 
                 (data.role !== 'patient' && data.role !== 'PATIENT' && data.role !== UserRole.USER)) {
        // ✨ Remove patient record if changing FROM patient
        try {
          await withDatabase(async (prisma) => {
            await prisma.patientInfo.deleteMany({
              where: { userId: updatedUser.userId }
            });
          });
          console.log('✅ PatientInfo removed for user:', userId);
        } catch (error) {
          console.error('⚠️ Error removing PatientInfo:', error);
        }
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
      userId: updatedUser.userId,
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
export async function getIpssScoresByUserId(userId: string): Promise<IpssScore[]> {
  try {
    // IPSS scores are not in the current schema, return empty array for now
    // This would need to be added to the schema if needed
    return [];
  } catch (error) {
    console.error('Error fetching IPSS scores:', error);
  return [];
  }
}

export async function getLabResultsByUserId(userId: string): Promise<LabResult[]> {
  try {
    const labResults = await withDatabase(async (prisma) => {
      return await prisma.labResult.findMany({
      where: { patientUserId: userId },
      include: {
        patient: true,
        consultation: true,
      },
      orderBy: { fecha: 'desc' },
      });
    });

    return labResults.map((result: any) => ({
      id: result.id,
      userId: result.paciente.id,
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

export async function getConsultationsByUserId(userId: string): Promise<Consultation[]> {
  try {
    console.log('🔍 getConsultationsByUserId - Buscando consultas para userId:', userId);
    
    const consultations = await withDatabase(async (prisma) => {
      console.log('🔍 getConsultationsByUserId - Cliente de base de datos disponible:', !!prisma);
      
      const result = await prisma.consultation.findMany({
        where: { patientUserId: userId },
        include: {
          patient: true,
          doctor: true,
          creator: true,
        },
        orderBy: { fecha: 'desc' },
      });
      
      console.log('🔍 getConsultationsByUserId - Consultas encontradas:', result.length);
      return result;
    });

    return consultations.map((consultation: any) => ({
      id: consultation.id,
      userId: consultation.patientUserId, // userId del paciente
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

export async function getPatientById(userId: string): Promise<Patient | null> {
  try {
    // ✅ VALIDACIÓN CRÍTICA - Verificar que userId no sea undefined/null
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error('❌ getPatientById - userId inválido:', { userId, type: typeof userId });
      throw new Error('userId requerido y debe ser string para exportar informe PDF');
    }
    
    console.log('🔍 getPatientById - Buscando paciente con userId:', userId);
    console.log('🔍 getPatientById - Tipo de userId:', typeof userId);
    console.log('🔍 getPatientById - Longitud de userId:', userId.length);
    
    // userId es el identificador principal
    const user = await withDatabase(async (prisma) => {
      console.log('🔍 getPatientById - Cliente de base de datos disponible:', !!prisma);
      
      const result = await prisma.user.findUnique({
        where: { userId: userId },
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
      
      console.log('🔍 getPatientById - Usuario encontrado:', !!result);
      if (result) {
        console.log('🔍 getPatientById - Usuario tiene patientInfo:', !!result.patientInfo);
        console.log('🔍 getPatientById - Usuario tiene affiliations:', result.affiliations.length);
      }
      
      return result;
    });

    if (!user) return null;
    
    // Validación de roles estandarizada
    try {
      validateUserRole(user, UserRole.PATIENT);
    } catch (error) {
      return null; // Si no es paciente, retornar null
    }

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
    
    console.log('🔍 getPatientById - User affiliations:', user.affiliations.map((aff: any) => ({
      id: aff.id,
      companyId: aff.companyId,
      estado: aff.estado,
      companyName: aff.company?.nombre
    })));

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
    // ✅ RE-LANZAR ERRORES DE VALIDACIÓN - No capturar errores de validación
    if (error instanceof Error && error.message.includes('userId requerido')) {
      throw error;
    }
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
}, userContext?: UserContext): Promise<Company> {
  try {
    // Create company using withTransaction - atomicidad asegurada
    const company = await withTransaction(async (prisma) => {
      // Primero verificar si ya existe una empresa con este RIF
      const existingCompany = await prisma.company.findFirst({
        where: { rif: companyData.ruc }
      });

      if (existingCompany) {
        throw new Error(`Ya existe una empresa con el RIF ${companyData.ruc}. Por favor, verifica el RIF e intenta nuevamente.`);
      }
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
    // Manejo centralizado de errores - DatabaseErrorHandler
    DatabaseErrorHandler.handle(error, 'crear empresa');
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
        return await prisma.doctorInfo.create({
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
      const orphanedDoctors = await prisma.doctorInfo.findMany({
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
      return await prisma.doctorInfo.create({
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
    
    // Validación de fecha - validateDate (si se proporciona)
    if (appointmentData.date) {
      const validatedDate = validateDate(appointmentData.date, 'Fecha de la cita');
      console.log('✅ Appointment date validation passed:', validatedDate.toISOString());
    }
    
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
      userId: updatedAppointment.patientUserId,
      doctorUserId: updatedAppointment.doctorUserId || '',
      date: updatedAppointment.fecha.toISOString(),
      reason: updatedAppointment.notas || 'Consulta médica',
      status: updatedAppointment.estado === 'COMPLETADA' ? 'Completada' as const : 
              updatedAppointment.estado === 'CANCELADA' ? 'Cancelada' as const : 'Programada' as const,
    };
  } catch (error) {
    // Manejo centralizado de errores - DatabaseErrorHandler
    DatabaseErrorHandler.handle(error, 'actualizar cita');
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
    // Manejo centralizado de errores - DatabaseErrorHandler
    DatabaseErrorHandler.handle(error, 'eliminar cita');
  }
}

export async function addAppointment(appointmentData: {
  userId: string; // userId del paciente
  doctorId?: string; // Ahora es userId del doctor
  date: string;
  reason: string;
  time?: string; // Optional time parameter
}, userContext: UserContext): Promise<Appointment> {
  try {
    console.log('🔄 Creating appointment with data:', appointmentData);
    
    // Validación obligatoria del contexto de usuario - createdBy debe ser siempre un userId válido
    if (!userContext || !userContext.userId) {
      throw new Error('Contexto de usuario requerido: userId es obligatorio para crear citas');
    }
    
    if (!userContext.name || !userContext.email) {
      throw new Error('Contexto de usuario incompleto: name y email son obligatorios');
    }
    
    console.log('✅ User context validated:', {
      userId: userContext.userId,
      name: userContext.name,
      role: userContext.role
    });
    
    // Validación de fecha - validateDate
    const validatedDate = validateDate(appointmentData.date, 'Fecha de la cita');
    console.log('✅ Date validation passed:', validatedDate.toISOString());
    
    const appointment = await withDatabase(async (prisma) => {
      // Validate patient exists by userId
      const patient = await prisma.user.findUnique({
        where: { userId: appointmentData.userId },
        include: { patientInfo: true }
      });
      
      if (!patient) {
        throw new Error(`Paciente con userId ${appointmentData.userId} no encontrado`);
      }
      
      // Validación de roles estandarizada
      validateUserRole(patient, UserRole.PATIENT);
      
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
        
        // Validación de roles estandarizada
        validateUserRole(doctor, UserRole.DOCTOR);
        
        console.log('✅ Doctor exists:', doctor.name);
        validDoctorUserId = appointmentData.doctorId;
      } else {
        console.log('ℹ️ No doctor selected for this appointment');
      }
      
      // Validar que el usuario creador existe y está activo - createdBy debe ser siempre un userId válido
      const creatorUser = await prisma.user.findUnique({
        where: { userId: userContext.userId },
        select: { userId: true, name: true, email: true, role: true, status: true }
      });
      
      if (!creatorUser) {
        throw new Error(`Usuario creador con userId ${userContext.userId} no encontrado en la base de datos`);
      }
      
      if (creatorUser.status !== 'ACTIVE') {
        throw new Error(`Usuario creador ${creatorUser.name} (${creatorUser.userId}) no está activo. Estado actual: ${creatorUser.status}`);
      }
      
      console.log('✅ Creator user validated:', {
        userId: creatorUser.userId,
        name: creatorUser.name,
        role: creatorUser.role,
        status: creatorUser.status
      });
      
      // Prepare appointment data using validated user context - createdBy siempre debe ser un userId válido
      const currentTime = userContext.currentTime || new Date();
      const appointmentTime = appointmentData.time || '09:00'; // Use provided time or default
      const createdBy = creatorUser.userId; // Usar el userId validado del usuario creador
      
      const appointmentDataToCreate: any = {
        fecha: new Date(appointmentData.date),
        hora: appointmentTime, // Dynamic time from input
        tipo: 'CONSULTA',
        estado: 'PROGRAMADA',
        notas: appointmentData.reason,
        patientUserId: appointmentData.userId, // userId del paciente
        createdBy: createdBy, // Real user context
      };
      
      // Only include doctorUserId if it's provided and valid
      if (validDoctorUserId) {
        appointmentDataToCreate.doctorUserId = validDoctorUserId;
      }
      
      console.log('📝 Creating appointment with data:', appointmentDataToCreate);
      
      const result = await prisma.appointment.create({
        data: appointmentDataToCreate,
      });
      
      // ✨ NUEVO: Enviar notificaciones en background
      notifyNewAppointment(result.id).catch(error => {
        console.error('[ACTIONS] Error enviando notificaciones:', error)
        // No fallar la cita si las notificaciones fallan
      });
      
      return result;
    });

    console.log('✅ Appointment created successfully:', appointment.id);
    
    return {
      id: appointment.id,
      userId: appointment.patientUserId,
      doctorUserId: appointment.doctorUserId || '',
      date: appointment.fecha.toISOString(),
      reason: appointment.notas || 'Consulta médica',
      status: 'Programada' as const,
    };
  } catch (error) {
    // Manejo centralizado de errores - DatabaseErrorHandler
    DatabaseErrorHandler.handle(error, 'crear cita');
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
export async function getReportsByPatientId(userId: string): Promise<Report[]> {
  try {
    // For now, return all reports since we don't have patient-specific reports in schema
    const reports = await withDatabase(async (prisma) => {
      return await prisma.report.findMany({
      orderBy: { fecha: 'desc' },
      });
    });

    return reports.map((report: any) => ({
      id: report.id,
      userId: userId,
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

export async function getPatientMedicalHistoryAsString(userId: string): Promise<string> {
  try {
    const patient = await withDatabase(async (prisma) => {
      return await prisma.user.findUnique({
      where: { userId: userId },
      include: {
        patientInfo: true,
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
              patientInfo: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    console.log(`Found ${affiliations.length} affiliations for company ${companyId}`);

    // Get company name for display
    const company = await withDatabase(async (prisma) => {
      return await prisma.company.findUnique({
        where: { id: companyId }
      });
    });

    // Group affiliations by user to avoid duplicates
    const userMap = new Map<string, any>();
    affiliations.forEach((affiliation: any) => {
      const userId = affiliation.user.id;
      if (!userMap.has(userId)) {
        userMap.set(userId, affiliation);
      }
    });

    // Map unique users to Patient interface
    const mappedPatients: Patient[] = Array.from(userMap.values()).map((affiliation: any) => {
      const user = affiliation.user;
      const patientInfo = user.patientInfo;
      
      // Calculate age from patientInfo if available, otherwise default
      const age = patientInfo?.fechaNacimiento 
        ? Math.floor((Date.now() - patientInfo.fechaNacimiento.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 30; // Default age
      
      return {
        id: user.id,
        name: user.name,
        cedula: patientInfo?.cedula || 'No especificada',
        age,
        gender: (patientInfo?.gender as 'Masculino' | 'Femenino' | 'Otro') || 'Masculino',
        bloodType: (patientInfo?.bloodType as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-') || 'O+',
        status: user.status === 'ACTIVE' ? 'Activo' as const : 'Inactivo' as const,
        lastVisit: user.lastLogin?.toISOString() || new Date().toISOString(),
        contact: {
          phone: user.phone || patientInfo?.telefono || '',
          email: user.email || '',
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
  userId: string;
  amount: number;
  concept: string;
  method: string;
}, userContext?: UserContext): Promise<any> {
  try {
    console.log('createReceipt called with data:', JSON.stringify(receiptData, null, 2));
    
    if (!isDatabaseAvailable()) {
      throw new Error('Database not available');
    }

    // Create receipt using withTransaction - atomicidad asegurada
    const receipt = await withTransaction(async (prisma) => {
      // Use real user context instead of hardcoded admin
      const currentTime = userContext?.currentTime || new Date();
      const createdBy = userContext?.userId || 'system';
      const creatorName = userContext?.name || 'Sistema';
      
      console.log('Creating receipt with user context:', {
        createdBy,
        creatorName,
        currentTime: currentTime.toISOString()
      });
      
      // Check if receipt model is available
      if (!prisma.receipt) {
        throw new Error('Modelo Receipt no está disponible. Por favor, reinicia la aplicación.');
      }
      
      // Generate receipt number using dynamic time
      const year = currentTime.getFullYear();
      const month = String(currentTime.getMonth() + 1).padStart(2, '0');
      const day = String(currentTime.getDate()).padStart(2, '0');
      
      // Get count of receipts for today to generate sequential number
      const todayStart = new Date(year, currentTime.getMonth(), currentTime.getDate());
      const todayEnd = new Date(year, currentTime.getMonth(), currentTime.getDate() + 1);
      
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
        userId: receiptData.userId,
        amount: receiptData.amount,
        concept: receiptData.concept,
        method: receiptData.method,
        createdBy: createdBy,
      });

      const receipt = await prisma.receipt.create({
        data: {
          number: receiptNumber,
          patientUserId: receiptData.userId, // Use userId
          amount: new Decimal(receiptData.amount),
          concept: receiptData.concept,
          method: receiptData.method,
          createdBy: createdBy, // Use real user context
        },
      });

      console.log('Receipt created successfully:', receipt);

      // Create audit log with real user context
      await prisma.auditLog.create({
        data: {
          userId: createdBy,
          action: 'Comprobante creado',
          details: `Comprobante ${receiptNumber} generado por ${creatorName} para paciente ${receiptData.userId}`
        }
      });

      return receipt;
    });

    return {
      id: receipt.id,
      number: receipt.number,
      userId: receipt.patientUserId, // Use patientUserId instead of patientId
      amount: Number(receipt.amount), // Convert Decimal to number
      concept: receipt.concept,
      method: receipt.method,
      createdAt: receipt.createdAt,
      createdBy: receipt.createdBy,
    };
  } catch (error) {
    // Manejo centralizado de errores - DatabaseErrorHandler
    DatabaseErrorHandler.handle(error, 'crear comprobante');
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

export async function updateAffiliation(affiliationId: string, updateData: {
  planId?: string;
  tipoPago?: string;
  monto?: number;
  estado?: string;
}): Promise<void> {
  try {
    console.log('🔍 Updating affiliation:', affiliationId, updateData);
    
    await withDatabase(async (prisma) => {
      await prisma.affiliation.update({
        where: { id: affiliationId },
        data: updateData
      });
    });
    
    console.log('✅ Affiliation updated successfully');
  } catch (error) {
    console.error('❌ Error updating affiliation:', error);
    throw error;
  }
}