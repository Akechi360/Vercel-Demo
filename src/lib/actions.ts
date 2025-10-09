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
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return patients.map(patient => {
      const age = Math.floor((Date.now() - patient.fechaNacimiento.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return {
        id: patient.id,
        name: `${patient.nombre} ${patient.apellido}`,
        cedula: patient.cedula,
        age,
        gender: 'Masculino' as const, // Default value
        bloodType: 'O+' as const, // Default value
        status: 'Activo' as const,
        lastVisit: patient.updatedAt.toISOString(),
        contact: {
          phone: patient.telefono || '',
          email: patient.email || '',
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
  bloodType?: string;
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
      cedula: `V-${Date.now()}`,
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
          cedula: `V-${Date.now()}`, // Generate temporary ID
          fechaNacimiento,
          telefono: patientData.contact.phone,
          email: patientData.contact.email,
          direccion: '', // Default empty address
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
        bloodType: patientData.bloodType ?? 'O+', // Default blood type
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

export async function deletePatient(patientId: string): Promise<void> {
  try {
    await withDatabase(async (prisma) => {
      await prisma.patient.delete({
        where: { id: patientId },
      });
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
        paciente: true,
        doctor: true,
        provider: true,
        user: true,
      },
      orderBy: { fecha: 'desc' },
    });

    return appointments.map(appointment => ({
      id: appointment.id,
      patientId: appointment.paciente.id,
      doctorId: appointment.doctor?.id || '',
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
export async function getUsers(): Promise<any[]> {
  try {
    if (!isDatabaseAvailable()) {
      console.log('Database not available - returning empty array');
      return [];
    }
    const prisma = getPrisma();
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// DOCTOR ACTIONS
export async function getDoctors(): Promise<Doctor[]> {
  try {
    if (!isDatabaseAvailable()) {
      console.log('Database not available - returning empty array');
      return [];
    }
    const prisma = getPrisma();
    
    // Get doctors from the Doctor table
    const doctorsFromTable = await prisma.doctor.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Get users with doctor role from the User table
    const doctorUsers = await prisma.user.findMany({
      where: { role: 'doctor' },
      orderBy: { createdAt: 'desc' },
    });

    // Combine both sources, avoiding duplicates by name
    const allDoctors = [];
    const usedNames = new Set<string>();

    // First, add doctors from the Doctor table
    for (const doctor of doctorsFromTable) {
      const fullName = `${doctor.nombre} ${doctor.apellido}`.trim();
      if (!usedNames.has(fullName)) {
        allDoctors.push({
          id: doctor.id,
          nombre: fullName,
          especialidad: doctor.especialidad,
          area: doctor.area || '',
          contacto: doctor.contacto || '',
          avatarUrl: undefined, // Doctors from table don't have avatarUrl
        });
        usedNames.add(fullName);
      }
    }

    // Then, add users with doctor role (only if name not already used)
    for (const user of doctorUsers) {
      if (!usedNames.has(user.name)) {
        allDoctors.push({
          id: user.id,
          nombre: user.name,
          especialidad: 'Médico General', // Default specialty for users
          area: '',
          contacto: user.phone || '',
          avatarUrl: user.avatarUrl || undefined,
        });
        usedNames.add(user.name);
      }
    }

    return allDoctors;
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

// Get users with role "patient" that don't have a Patient record yet
export async function listSelectablePatientUsers(): Promise<Array<{
  id: string;
  name: string;
  email: string;
  status: string;
}>> {
  try {
    console.log('🔍 Fetching selectable patient users...');
    
    const users = await withDatabase(async (prisma) => {
      return await prisma.user.findMany({
        where: {
          role: 'patient', // Only users with patient role
          patientId: null, // Users that don't have a Patient record yet
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true
        },
        orderBy: { name: 'asc' }
      });
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
  bloodType?: string;
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
    const existingPatient = await prisma.patient.findFirst({
      where: {
        OR: [
          { email: user.email },
          { nombre: user.name }
        ]
      }
    });
    
    if (existingPatient) {
      throw new Error('El usuario ya tiene un registro de paciente');
    }
    
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
      cedula: `V-${Date.now()}`,
      fechaNacimiento,
      telefono: user.phone || '',
      email: user.email,
      direccion: '',
    });
    
    // Create patient
    const patient = await prisma.patient.create({
      data: {
        nombre: nombre || user.name,
        apellido: apellido || '',
        cedula: `V-${Date.now()}`, // Generate temporary ID
        fechaNacimiento,
        telefono: user.phone || '',
        email: user.email,
        direccion: '', // Default empty address
      },
    });
    
    console.log('Patient created successfully:', patient);

    // Update user with patientId
    await prisma.user.update({
      where: { id: userId },
      data: { patientId: patient.id }
    });

    console.log('User updated with patientId:', patient.id);

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
    
    // Map Prisma Patient to expected Patient type
    const mappedPatient: Patient = {
      id: patient.id,
      name: patient.nombre,
      cedula: patient.cedula,
      age: patientData.age,
      gender: patientData.gender,
      bloodType: patientData.bloodType || '',
      status: 'Activo',
      contact: {
        phone: patient.telefono || '',
        email: patient.email || '',
      },
      lastVisit: patient.createdAt.toISOString(),
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
          paciente: true,
          doctor: true,
          user: true,
        },
        orderBy: { fecha: 'desc' },
      });
    });

    return consultations.map((consultation: any) => ({
      id: consultation.id,
      patientId: consultation.paciente.id,
      date: consultation.fecha.toISOString(),
      doctor: consultation.doctor ? `${consultation.doctor.nombre} ${consultation.doctor.apellido}` : 'No especificado',
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
          pacienteId: consultationData.patientId,
          doctorId: doctor?.id || null,
          userId: userId,
        },
        include: {
          paciente: true,
          doctor: true,
        }
      });
    });

    return {
      id: consultation.id,
      patientId: consultation.pacienteId,
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
        paciente: true,
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
          paciente: true,
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
    const isAvailable = await isDatabaseAvailable();
    if (!isAvailable) {
      throw new Error('Base de datos no disponible. No se puede crear el usuario.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const prisma = getPrisma();
    
    const newUser = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

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
    throw new Error('No se pudo crear el usuario. Verifica la conexión a la base de datos.');
  }
}

export async function updateUser(userId: string, data: Partial<Omit<User, "id" | "createdAt">>): Promise<User> {
  try {
    console.log('🔄 Updating user:', userId, 'with data:', data);
    
    const updatedUser = await withDatabase(async (prisma) => {
      return await prisma.user.update({
        where: { id: userId },
        data,
      });
    });

    // If status or role was changed, revalidate relevant routes
    if (data.status || data.role) {
      console.log('🔄 User status or role changed, revalidating routes...');
      // Revalidate patient-related pages to update access gates and dropdowns
      try {
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/patients');
        revalidatePath('/dashboard');
        revalidatePath('/appointments');
        revalidatePath('/settings/users'); // Revalidate users page to update dropdowns
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
      where: { pacienteId: patientId },
      include: {
        paciente: true,
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
      where: { pacienteId: patientId },
      include: {
        paciente: true,
        doctor: true,
        user: true,
      },
      orderBy: { fecha: 'desc' },
      });
    });

    return consultations.map((consultation: any) => ({
      id: consultation.id,
      patientId: consultation.paciente.id,
      date: consultation.fecha.toISOString(),
      doctor: consultation.doctor ? `${consultation.doctor.nombre} ${consultation.doctor.apellido}` : 'No especificado',
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
    const patient = await withDatabase(async (prisma) => {
      return await prisma.patient.findUnique({
      where: { id: patientId },
    });
    });

    if (!patient) return null;

    // Get user associated with this patient
    const user = await withDatabase(async (prisma) => {
      return await prisma.user.findFirst({
        where: { patientId: patientId },
        include: {
          affiliations: {
            where: { estado: 'ACTIVA' },
            include: {
              company: true
            }
          }
        }
      });
    });

    // Get company information if user has active affiliations
    let companyId: string | undefined;
    let companyName: string | undefined;
    
    if (user && user.affiliations.length > 0) {
      const activeAffiliation = user.affiliations[0]; // Get first active affiliation
      companyId = activeAffiliation.companyId;
      companyName = activeAffiliation.company?.nombre;
    }

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
      companyName: companyName,
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

export async function addAppointment(appointmentData: {
  patientId: string;
  doctorId: string;
  date: string;
  reason: string;
}): Promise<Appointment> {
  try {
    const appointment = await withDatabase(async (prisma) => {
      return await prisma.appointment.create({
      data: {
        fecha: new Date(appointmentData.date),
        hora: '09:00', // Default time
        tipo: 'CONSULTA',
        estado: 'PROGRAMADA',
        notas: appointmentData.reason,
        pacienteId: appointmentData.patientId,
        doctorId: appointmentData.doctorId,
        userId: 'master-admin', // Default to master admin for now
      },
      });
    });

    return {
      id: appointment.id,
      patientId: appointment.pacienteId,
      doctorId: appointment.doctorId || '',
      date: appointment.fecha.toISOString(),
      reason: appointment.notas || 'Consulta médica',
      status: 'Programada' as const,
    };
  } catch (error) {
    console.error('Error adding appointment:', error);
    throw new Error('Error al agregar cita');
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
        patientId: receiptData.patientId,
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
      patientId: receipt.patientId,
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
      patientName: `${receipt.patient.nombre} ${receipt.patient.apellido}`,
      patientCedula: receipt.patient.cedula,
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
      patientName: `${receipt.patient.nombre} ${receipt.patient.apellido}`,
      patientCedula: receipt.patient.cedula,
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