'use server';

import type { Patient, Appointment, Consultation, LabResult, IpssScore, Report, Company, Supply, PaymentMethod, PaymentType, Payment, Doctor, Estudio, AffiliateLead } from './types';
import { Prisma, PrismaClient, User } from '@prisma/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import bcrypt from 'bcryptjs';
import { Decimal } from '@prisma/client/runtime/library';
import { getPrismaClient, isDatabaseAvailable } from './db';
// Validación de roles estandarizada - Importar utilidades centralizadas
import { ROLES, type UserRole, isValidRole, getValidRole } from './types';
// Importado desde src/lib/utils.ts - única fuente de validaciones
import { validateUserRole, DatabaseErrorHandler, withTransaction, validateDate } from './utils';
import type { User as FrontendUser } from './types';
import { UserContext } from './types';
import { notifyNewAppointment } from './notification-service';
import { cookies, headers } from 'next/headers';

// Función para obtener el cliente de Prisma de manera segura
const getPrisma = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required but not found in environment variables');
  }
  return getPrismaClient();
};

// Función helper para ejecutar operaciones de base de datos con manejo de errores
export const withDatabase = async <T>(operation: (prisma: any) => Promise<T>, fallbackValue?: T): Promise<T> => {
  // Durante el build, usar fallback
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    return {} as T;
  }

  // ✅ OPTIMIZADO: Versión síncrona (sin await)
  const isAvailable = isDatabaseAvailable();
  if (!isAvailable) {
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    throw new Error('Database not configured');
  }

  const prisma = getPrismaClient();

  try {
    return await operation(prisma);
  } catch (error) {
    // Solo loggear errores reales, no checks de conexión
    if (process.env.NODE_ENV !== 'production') {
      console.error('[DB Error]:', error);
    }
    throw error;
  }
};

// Simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Normalize role values to match the database enum
 * @param role Role value to normalize
 * @returns Normalized role in uppercase
 */
function normalizeRole(role: string): 'ADMIN' | 'DOCTOR' | 'SECRETARIA' | 'PROMOTORA' | 'USER' {
  const roleMap: Record<string, 'ADMIN' | 'DOCTOR' | 'SECRETARIA' | 'PROMOTORA' | 'USER'> = {
    'admin': 'ADMIN',
    'doctor': 'DOCTOR',
    'secretaria': 'SECRETARIA',
    'promotora': 'PROMOTORA',
    'patient': 'USER',
    'user': 'USER',
  };

  const normalizedRole = roleMap[role.toLowerCase()] || 'USER';

  // Type assertion is safe because we've provided all possible values in the map
  return normalizedRole as 'ADMIN' | 'DOCTOR' | 'SECRETARIA' | 'PROMOTORA' | 'USER';
}

/**
 * Normalize status values to match the database enum
 * @param status Status value to normalize
 * @returns Normalized status in uppercase
 */
function normalizeStatus(status: string): 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' {
  const statusMap: Record<string, 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'> = {
    'active': 'ACTIVE',
    'inactive': 'INACTIVE',
    'suspended': 'SUSPENDED',
    'activo': 'ACTIVE',
    'inactivo': 'INACTIVE',
    'suspendido': 'SUSPENDED'
  };

  const normalizedStatus = statusMap[status.toLowerCase()] || 'ACTIVE';
  return normalizedStatus;
}

// Helper function to normalize gender
function normalizeGender(gender: string): 'MASCULINO' | 'FEMENINO' | 'OTRO' | null {
  if (!gender) return null;
  const genderMap: Record<string, 'MASCULINO' | 'FEMENINO' | 'OTRO'> = {
    'masculino': 'MASCULINO',
    'male': 'MASCULINO',
    'femenino': 'FEMENINO',
    'female': 'FEMENINO',
    'otro': 'OTRO',
    'other': 'OTRO',
  };
  const normalized = genderMap[gender.toLowerCase()];
  if (!normalized) {
    console.warn(`⚠️ Género no reconocido: ${gender}`);
    return null;
  }
  return normalized;
}

// Helper function to normalize blood type
function normalizeBloodType(bloodType: string): string | null {
  if (!bloodType) return null;
  const bloodTypeMap: Record<string, string> = {
    'a+': 'A_POSITIVE',
    'a-': 'A_NEGATIVE',
    'b+': 'B_POSITIVE',
    'b-': 'B_NEGATIVE',
    'ab+': 'AB_POSITIVE',
    'ab-': 'AB_NEGATIVE',
    'o+': 'O_POSITIVE',
    'o-': 'O_NEGATIVE',
  };
  const normalized = bloodTypeMap[bloodType.toLowerCase().replace(/\s+/g, '')];
  if (!normalized) {
    console.warn(`⚠️ Tipo de sangre no reconocido: ${bloodType}`);
    return null;
  }
  return normalized;
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    return isDatabaseAvailable();
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

async function getCurrentUserRoleFromRequest(prisma: PrismaClient): Promise<string | null> {
  try {
    // Método 1: Header X-User-ID (desarrollo)
    const headerStore = await headers();
    const userIdFromHeader = headerStore.get('X-User-ID') || headerStore.get('x-user-id');

    if (userIdFromHeader) {
      if (process.env.NODE_ENV === 'development' && userIdFromHeader === 'admin-master-001') {
        console.log('[AUTH] Backdoor admin detectado');
        return 'ADMINISTRATOR';
      }
      const user = await prisma.user.findUnique({
        where: { id: userIdFromHeader },
        select: { role: true }
      });
      if (user?.role) {
        console.log('[AUTH] Role from header:', user.role);
        return user.role;
      }
    }

    // Método 2: Cookie session-token
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;
    if (sessionToken) {
      const user = await prisma.user.findUnique({
        where: { id: sessionToken },
        select: { role: true }
      });
      if (user?.role) {
        console.log('[AUTH] Role from cookie:', user.role);
        return user.role;
      }
    }

    console.log('[AUTH] No role found - no header and no valid cookie');
    return null;
  } catch (error) {
    console.error('[AUTH] Error getting user role:', error);
    return null;
  }
}

// REPORT UPDATE with role validation
export async function updateReport(reportId: string, currentUserId: string, data: {
  titulo?: string;  // Backend field name
  title?: string;   // Frontend field name
  fecha?: string;   // Backend field name
  date?: string;    // Frontend field name
  tipo?: string;    // Backend field name
  type?: string;    // Frontend field name
  notas?: string;   // Backend field name
  notes?: string;   // Frontend field name
  descripcion?: string;
  archivoNombre?: string;
  archivoTipo?: string;
  archivoContenido?: string;
  archivoTamaño?: number;
}) {
  return withDatabase(async (prisma) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: currentUserId }, select: { role: true } });
      const normalizedRole = user?.role ? user.role.toUpperCase() : null;
      console.log('[updateReport] role resolved =>', user?.role, normalizedRole);
      if (!normalizedRole || !['DOCTOR', 'ADMIN', 'ADMINISTRATOR'].includes(normalizedRole)) {
        throw new Error('No tienes permisos para editar informes');
      }

      // Update report
      await prisma.report.update({
        where: { id: reportId },
        data: {
          titulo: data.title || data.titulo,
          tipo: data.type || data.tipo,
          fecha: data.date ? new Date(data.date) : (data.fecha ? new Date(data.fecha) : undefined),
          notas: data.notes || data.notas,
          descripcion: data.descripcion,
          archivoNombre: data.archivoNombre,
          archivoTipo: data.archivoTipo,
          archivoContenido: data.archivoContenido,
          archivoTamaño: data.archivoTamaño,
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating report:', error);
      throw new Error('Error al actualizar el reporte');
    }
  });
}

export async function deleteReport(reportId: string) {
  return withDatabase(async (prisma) => {
    try {
      await prisma.report.delete({
        where: { id: reportId }
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting report:', error);
      throw new Error('Error al eliminar el reporte');
    }
  });
}

export async function getPatients(currentUserId?: string) {
  return withDatabase(async (prisma) => {
    try {
      console.log('🔍 getPatients called with currentUserId:', currentUserId);

      let whereClause: any = {
        role: 'USER', // Using string literal instead of ROLES.USER to avoid import issues if ROLES is not available in this scope (though it should be)
        status: 'ACTIVE'
      };

      if (currentUserId) {
        const currentUser = await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { role: true, userId: true }
        });

        console.log('👤 Current user role:', currentUser?.role);

        if (currentUser?.role === 'DOCTOR') {
          // Doctors see patients assigned to them
          whereClause = {
            ...whereClause,
            patientAssignments: {
              some: {
                doctorId: currentUserId,
                active: true
              }
            }
          };
        } else if (currentUser?.role === 'USER') {
          // Patients see only themselves
          whereClause = {
            ...whereClause,
            id: currentUserId
          };
        }
        // Admins/Secretarias see all (default whereClause)
      }

      console.log('📋 Prisma where clause:', JSON.stringify(whereClause, null, 2));

      const patients = await prisma.user.findMany({
        where: whereClause,
        include: {
          patientInfo: true,
          affiliations: {
            where: { estado: 'ACTIVA' },
            include: { company: true }
          },
          patientAssignments: {
            where: { active: true },
            include: {
              doctor: {
                include: {
                  doctorInfo: true
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return patients.map((user: any) => {
        const patientInfo = user.patientInfo;
        const age = patientInfo?.fechaNacimiento
          ? Math.floor((Date.now() - new Date(patientInfo.fechaNacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 0;

        // Get assigned doctor info
        const assignment = user.patientAssignments?.[0];
        const assignedDoctor = assignment?.doctor;
        const doctorName = assignedDoctor ? assignedDoctor.name : undefined;
        const doctorId = assignedDoctor ? assignedDoctor.id : undefined;

        return {
          id: user.userId, // Use userId as the stable ID
          name: user.name,
          cedula: patientInfo?.cedula || '',
          age,
          gender: patientInfo?.gender || 'Otro',
          bloodType: patientInfo?.bloodType || 'O+',
          status: user.status === 'ACTIVE' ? 'Activo' : 'Inactivo',
          lastVisit: user.lastLogin?.toISOString() || user.createdAt.toISOString(),
          contact: {
            phone: user.phone || '',
            email: user.email || ''
          },
          companyId: user.affiliations?.[0]?.companyId,
          companyName: user.affiliations?.[0]?.company?.nombre,
          assignedDoctorId: doctorId,
          assignedDoctorName: doctorName
        };
      });
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  }, []);
}

export async function addPatient(patientData: any) {
  return withDatabase(async (prisma) => {
    try {
      // Create user first
      const userId = `U${Date.now().toString().slice(-6)}`;
      const hashedPassword = await bcrypt.hash('123456', 10); // Default password

      const user = await prisma.user.create({
        data: {
          userId,
          name: `${patientData.firstName} ${patientData.lastName}`,
          email: patientData.email,
          password: hashedPassword,
          role: 'USER',
          status: 'ACTIVE',
          phone: patientData.phone
        }
      });

      // Create patient info
      await prisma.patientInfo.create({
        data: {
          userId: user.userId,
          cedula: patientData.cedula,
          fechaNacimiento: new Date(patientData.birthDate),
          gender: patientData.gender,
          bloodType: patientData.bloodType,
          telefono: patientData.phone,
          direccion: patientData.address
        }
      });

      // Handle doctor assignment if provided
      if (patientData.assignedDoctorId) {
        await prisma.doctorPatient.create({
          data: {
            doctorId: patientData.assignedDoctorId,
            patientId: user.id, // Use internal ID for relation
            active: true,
            assignedAt: new Date(),
            assignedBy: 'SYSTEM' // Should ideally be currentUserId
          }
        });
      }

      return { success: true, userId: user.userId };
    } catch (error) {
      console.error('Error adding patient:', error);
      throw new Error('Error al agregar paciente');
    }
  });
}

export async function updatePatient(userId: string, patientData: any) {
  try {
    console.log(`🔄 Actualizando paciente: ${userId}`, patientData);

    // Validate date
    const fechaNacimientoDate = new Date(patientData.fechaNacimiento);
    if (isNaN(fechaNacimientoDate.getTime())) {
      throw new Error('Fecha de nacimiento inválida');
    }

    // Normalize and validate gender
    const normalizedGender = normalizeGender(patientData.gender);
    if (!normalizedGender) {
      throw new Error('Género inválido. Debe ser: Masculino, Femenino u Otro');
    }

    // Normalize and validate blood type
    const normalizedBloodType = normalizeBloodType(patientData.bloodType);
    if (!normalizedBloodType) {
      throw new Error('Tipo de sangre inválido. Debe ser: A+, A-, B+, B-, AB+, AB-, O+ u O-');
    }

    // Prepare patient info data
    const patientInfoData = {
      cedula: patientData.cedula,
      direccion: patientData.direccion || '',
      gender: normalizedGender,
      bloodType: normalizedBloodType,
      telefono: patientData.phone || '',
      fechaNacimiento: fechaNacimientoDate,
    };

    // Execute transaction and capture result
    const result = await withDatabase(async (prisma) => {
      // Find the user first to get internal ID
      const user = await prisma.user.findUnique({
        where: { userId: userId }
      });

      if (!user) throw new Error('Usuario no encontrado');

      const [updatedUser, updatedPatientInfo] = await prisma.$transaction([
        // Update user data
        prisma.user.update({
          where: { id: user.id },
          data: {
            name: patientData.name.trim(),
            email: patientData.email,
            phone: patientData.phone
          },
          include: { patientInfo: true }
        }),

        // Upsert patient info (update if exists, create if not)
        prisma.patientInfo.upsert({
          where: { userId: userId },
          update: patientInfoData,
          create: {
            ...patientInfoData,
            userId: userId,
          },
        }),
      ]);

      // Handle doctor assignment
      if (patientData.assignedDoctorId) {
        // Deactivate current active assignments
        await prisma.doctorPatient.updateMany({
          where: {
            patientId: user.id,
            active: true
          },
          data: { active: false, unassignedAt: new Date() }
        });

        // Create new assignment
        await prisma.doctorPatient.create({
          data: {
            doctorId: patientData.assignedDoctorId,
            patientId: user.id,
            active: true,
            assignedBy: 'SYSTEM'
          }
        });
      }

      // Handle company affiliation changes
      if (patientData.companyId) {
        // First, deactivate any existing affiliations for this user
        await prisma.affiliation.updateMany({
          where: {
            userId: user.userId,
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
            userId: user.userId,
          },
        });
      } else {
        // If no companyId, deactivate all affiliations (patient becomes particular)
        await prisma.affiliation.updateMany({
          where: {
            userId: user.userId,
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

      // Calculate age from fechaNacimiento
      const birthDate = new Date(updatedPatientInfo.fechaNacimiento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Return patient in the expected format
      return {
        ...updatedUser,
        patientInfo: updatedPatientInfo,
        id: updatedUser.userId,
        cedula: updatedPatientInfo.cedula,
        age,
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

    console.log(`✅ Paciente actualizado: ${result.name} (userId: ${result.userId})`);
    return result;
  } catch (error: unknown) {
    console.error('[UPDATE_USER] ❌ Error capturado:', {
      message: error instanceof Error ? error.message : 'Error desconocido',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined,
      fullError: error
    });

    // Manejo centralizado de errores - DatabaseErrorHandler
    if (error instanceof Error) {
      DatabaseErrorHandler.handle(error, 'actualizar paciente');
    } else {
      // Si el error no es una instancia de Error, lanzamos un error genérico
      throw new Error('Ocurrió un error inesperado al actualizar el paciente');
    }
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
      }

      // Delete the user
      await prisma.user.delete({
        where: { id: user.id }
      });

      // Dispatch global event to notify all components
      if (typeof window !== 'undefined') {
        const { globalEventBus } = await import('@/lib/store/global-store');
        globalEventBus.emitPatientDeleted(userId);
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
      return [];
    }
    const prisma = getPrisma();
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: true, // Relación con User (paciente)
        doctor: true,  // Relación con User (doctor)
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
      return null;
    }

    const prisma = getPrisma();

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
                  where: { role: ROLES.DOCTOR }, // Validación de roles estandarizada
                  select: { email: true }
                }).then((users: any[]) => users.map((u: any) => u.email).filter(Boolean))
              }
            },
            {
              telefono: {
                in: await prisma.user.findMany({
                  where: { role: ROLES.DOCTOR }, // Validación de roles estandarizada
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

    return doctors.map((doctor: {
      id: string;
      userId?: string;
      nombre: string;
      especialidad: string;
      area: string;
      contacto: string;
      avatarUrl?: string;
    }) => ({
      id: doctor.id,
      userId: doctor.userId || doctor.id, // Usar userId si existe, si no, usar id como fallback
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

export async function getDoctors() {
  return withDatabase(async (prisma) => {
    try {
      console.log('🔍 Fetching doctors with doctorInfo...');

      // Primero obtenemos los IDs de usuarios que tienen doctorInfo
      const doctorsWithInfo = await prisma.doctorInfo.findMany({
        select: {
          userId: true
        }
      });

      const doctorUserIds = doctorsWithInfo.map((doc: { userId: string }) => doc.userId);

      if (doctorUserIds.length === 0) {
        console.log('ℹ️ No se encontraron doctores con información en doctor_info');
        return [];
      }

      // Luego obtenemos los usuarios que tienen doctorInfo
      const doctors = await prisma.user.findMany({
        where: {
          userId: { in: doctorUserIds },
          status: 'ACTIVE'
        },
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          avatarUrl: true,
          doctorInfo: {
            select: {
              id: true,
              especialidad: true,
              area: true,
              cedula: true,
              telefono: true,
              direccion: true,
              email: true,
              contacto: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      console.log(`✅ Found ${doctors.length} doctors with complete info`);

      // Map the data to match the Doctor type - include both Spanish and English properties for compatibility
      return doctors.map((doctor: {
        id: string;
        userId: string;
        name: string | null;
        email: string | null;
        phone: string | null;
        avatarUrl: string | null;
        doctorInfo: {
          especialidad?: string;
          cedula?: string;
          telefono?: string;
          area?: string;
        } | null;
      }) => ({
        id: doctor.id,
        userId: doctor.userId,
        // Spanish properties (for backward compatibility)
        nombre: doctor.name || 'Sin nombre',
        especialidad: doctor.doctorInfo?.especialidad || 'General',
        // English properties (for new components)
        name: doctor.name || 'Sin nombre',
        specialty: doctor.doctorInfo?.especialidad || 'General',
        // Additional fields
        cedula: doctor.doctorInfo?.cedula || '',
        telefono: doctor.doctorInfo?.telefono || '',
        area: doctor.doctorInfo?.area || '',
        contacto: doctor.phone || doctor.email || '',
        avatarUrl: doctor.avatarUrl,
        displayName: `Dr. ${doctor.name || 'Sin nombre'} - ${doctor.doctorInfo?.especialidad || 'General'}`,
      }));

    } catch (error) {
      console.error('❌ Error fetching doctors:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      return [];
    }
  }, []);
}

// COMPANY ACTIONS
export async function getCompanies(): Promise<Company[]> {
  try {
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

    const mappedCompanies = companies.map((company: any) => ({
      id: company.id,
      name: company.nombre,
      ruc: company.rif,
      phone: company.telefono || '',
      email: company.email || '',
      status: 'Activo' as const,
    }));
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

    const users = await withDatabase(async (prisma) => {
      // Get users with role 'patient' but without patientInfo (not added to patients module yet)
      const patientUsersWithoutInfo = await prisma.user.findMany({
        where: {
          role: ROLES.USER, // Validación de roles estandarizada
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
      return null;
    }
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

    // Validación de fecha - validateDate
    const validatedDate = validateDate(consultationData.date, 'Fecha de la consulta');
    console.log('✅ Consultation date validation passed:', validatedDate.toISOString());

    // ✅ TRANSACCIÓN OPTIMIZADA - Solo cliente tx, consultas simplificadas
    const consultation = await withTransaction(async (tx) => {

      // ✅ CONSULTA OPTIMIZADA 1: Validar paciente (solo campos necesarios)
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
      validateUserRole(patient, ROLES.USER);

      // ✅ CONSULTA OPTIMIZADA 2: Buscar doctor (una sola consulta con OR optimizado)
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

      // ✅ CONSULTA OPTIMIZADA 3: Crear consulta
      const newConsultation = await tx.consultation.create({
        data: {
          fecha: validatedDate,
          motivo: consultationData.type,
          sintomas: '',
          diagnostico: '',
          tratamiento: '',
          observaciones: consultationData.notes,
          patientUserId: consultationData.userId,
          doctorUserId: doctor?.userId || null,
          createdBy: userContext.userId,
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

      // Create audit log for consultation
      await createAuditLog(
        userContext.userId,
        'Historia clínica creada',
        `Nueva consulta para ${patient.name} con motivo: ${consultationData.type}`
      );

      // ✅ GUARDAR PRESCRIPCIONES
      if (consultationData.prescriptions && consultationData.prescriptions.length > 0) {
        await tx.prescription.createMany({
          data: consultationData.prescriptions.map(prescription => ({
            medicamento: prescription.medication,
            dosis: prescription.dosage,
            frecuencia: prescription.duration, // Mapear duration a frecuencia
            duracion: prescription.duration,
            instrucciones: prescription.dosage, // Usar dosage como instrucciones
            patientUserId: consultationData.userId,
            consultationId: newConsultation.id,
          }))
        });
      }

      // ✅ GUARDAR RESULTADOS DE LABORATORIO
      if (consultationData.labResults && consultationData.labResults.length > 0) {
        await tx.labResult.createMany({
          data: consultationData.labResults.map(labResult => ({
            nombre: labResult.testName,
            tipo: 'Consulta', // Tipo por defecto
            resultado: labResult.value,
            valores: labResult.referenceRange ? { referencia: labResult.referenceRange } : null,
            fecha: new Date(labResult.date),
            estado: 'COMPLETADO',
            patientUserId: consultationData.userId,
            consultationId: newConsultation.id,
            doctorUserId: doctor?.userId || userContext.userId,
          }))
        });
      }

      // GUARDAR REPORTES DE CONSULTA
      if (consultationData.reports && consultationData.reports.length > 0) {
        console.log('💾 Guardando reportes en BD:', consultationData.reports.map(r => ({
          title: r.title,
          archivoNombre: r.archivoNombre,
          archivoTipo: r.archivoTipo,
          archivoTamaño: r.archivoTamaño,
          hasArchivoContenido: !!r.archivoContenido,
          archivoContenidoLength: r.archivoContenido?.length || 0,
          archivoContenidoPreview: r.archivoContenido?.substring(0, 100)
        })));

        await tx.consultationReport.createMany({
          data: consultationData.reports.map(report => {
            const reportData = {
              titulo: report.title,
              descripcion: report.notes || '',
              tipo: 'Informe',
              // Extraer solo el nombre del archivo, no el objeto completo
              archivoNombre: typeof report.archivoNombre === 'object'
                ? report.archivoNombre.name
                : report.archivoNombre || report.attachments?.[0]?.name || '',
              // Extraer solo la URL, no el objeto completo
              archivoUrl: typeof report.fileUrl === 'string'
                ? report.fileUrl
                : report.attachments?.[0]?.url || '',
              // Extraer el tipo MIME
              archivoTipo: typeof report.archivoTipo === 'string'
                ? report.archivoTipo
                : report.archivoNombre?.type || report.type || 'application/pdf',
              // Extraer el tamaño en bytes
              archivoTamaño: typeof report.archivoTamaño === 'number'
                ? report.archivoTamaño
                : report.archivoNombre?.size || report.size || null,
              // Base64 content si existe
              archivoContenido: report.archivoContenido || report.fileContent || null,
              patientUserId: consultationData.userId,
              consultationId: newConsultation.id,
              createdBy: userContext.userId,
            };

            console.log('💾 Datos a insertar en BD:', {
              titulo: reportData.titulo,
              archivoNombre: reportData.archivoNombre,
              archivoTipo: reportData.archivoTipo,
              archivoTamaño: reportData.archivoTamaño,
              hasArchivoContenido: !!reportData.archivoContenido,
              archivoContenidoLength: reportData.archivoContenido?.length || 0
            });

            return reportData;
          })
        });
      }

      return newConsultation;
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
  return withDatabase(async (prisma) => {
    try {
      const reports = await prisma.report.findMany({
        orderBy: { fecha: 'desc' },
      });

      return reports.map((report: any) => ({
        id: report.id,
        userId: report.userId || 'default-patient',
        title: report.titulo,
        date: report.fecha ? new Date(report.fecha).toISOString() : new Date().toISOString(),
        type: report.tipo,
        notes: report.descripcion || '',
        fileUrl: report.archivoUrl || '',
        archivoNombre: report.archivoNombre,
        archivoTipo: report.archivoTipo,
        archivoTamaño: report.archivoTamaño,
        archivoContenido: report.archivoContenido,
        attachments: report.archivoNombre ? [{
          name: report.archivoNombre,
          type: report.archivoTipo || 'application/octet-stream',
          size: report.archivoTamaño || 0,
          url: report.archivoUrl || ''
        }] : [],
        rawData: report
      }));
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }, []);
}

export async function createReport(reportData: {
  // Frontend field names (with fallbacks to backend names)
  title?: string;
  titulo?: string;
  type?: string;
  tipo?: string;
  date?: string;
  fecha?: string;
  notes?: string;
  notas?: string;
  // Other fields
  descripcion?: string;
  contenido?: any;
  autor?: string;
  patientUserId: string;
  userId?: string; // Alternative to patientUserId
  archivoNombre?: string;
  archivoTipo?: string;
  archivoTamaño?: number;
  archivoContenido?: string;
  createdBy?: string;
}) {
  console.log('🔵 createReport called with:', {
    title: reportData.title || reportData.titulo,
    type: reportData.type || reportData.tipo,
    patientId: reportData.patientUserId || reportData.userId,
    hasFile: !!reportData.archivoNombre
  });

  return withDatabase(async (prisma) => {
    try {
      const patientId = reportData.patientUserId || reportData.userId;
      if (!patientId) {
        throw new Error('Se requiere un ID de paciente válido');
      }

      const report = await prisma.report.create({
        data: {
          // Handle both frontend and backend field names with fallbacks
          titulo: reportData.title || reportData.titulo || 'Sin título',
          tipo: reportData.type || reportData.tipo || 'General',
          fecha: reportData.date
            ? new Date(reportData.date)
            : reportData.fecha
              ? new Date(reportData.fecha)
              : new Date(), // Fallback to current date
          notas: reportData.notes || reportData.notas || '',
          descripcion: reportData.descripcion || '',
          contenido: reportData.contenido || {},
          autor: reportData.autor || 'Sistema',
          patientUserId: patientId,
          archivoNombre: reportData.archivoNombre ?? null,
          archivoTipo: reportData.archivoTipo ?? null,
          archivoTamaño: reportData.archivoTamaño ?? null,
          archivoContenido: reportData.archivoContenido ?? null,
          createdBy: reportData.createdBy ?? patientId, // Fallback to patientId if createdBy not provided
        },
      });

      console.log('✅ Report created successfully:', report.id);
      return report;

    } catch (error) {
      console.error('❌ Error creating report:', error);
      throw new Error('Error al guardar el informe');
    }
  });
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
    console.error('Error al obtener suministros:', error);
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
            role: ROLES.ADMIN,
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
          role: ROLES.ADMIN, // Validación de roles estandarizada
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
    await createAuditLog(user.userId, 'Inicio de sesión', `Usuario ${user.name} inició sesión`);

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

    // Create affiliation using withTransaction - atomicidad asegurada
    const affiliation = await withTransaction(async (prisma) => {
      // Verificar que el usuario existe
      const userExists = await prisma.user.findUnique({
        where: { id: affiliationData.userId }
      });

      if (!userExists) {
        throw new Error(`Usuario con ID ${affiliationData.userId} no existe`);
      }

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

    // Create audit log for affiliation
    await createAuditLog(
      userContext?.userId || 'system',
      'Afiliación creada',
      `Nueva afiliación ${affiliation.planId} para usuario ${affiliation.user.name || affiliation.userId}${affiliation.company ? ` en compañía ${affiliation.company.name}` : ''}`
    );

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
    const affiliations = await withDatabase(async (prisma) => {
      return await prisma.affiliation.findMany({
        include: {
          company: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }, []); // Fallback to empty array

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
    return mappedAffiliations;
  } catch (error) {
    console.error('❌ Error fetching affiliations:', error);
    return [];
  }
}

export async function cleanDuplicateAffiliations(): Promise<{ success: boolean; removed: number; error?: string }> {
  try {

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
      for (const group of Array.from(grouped.values())) {
        if (group.length > 1) {

          // Sort by createdAt (oldest first) and keep the first one
          const sorted = group.sort((a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          const toKeep = sorted[0];
          const toRemove = sorted.slice(1);

          // Remove the duplicates
          for (const duplicate of toRemove) {
            await prisma.affiliation.delete({
              where: { id: duplicate.id }
            });
            removedCount++;
          }
        }
      }

      return removedCount;
    });
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
          user: true
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
export async function createUser(data: Omit<FrontendUser, "id" | "createdAt">): Promise<FrontendUser> {
  try {

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
      throw new Error('Ya existe un usuario registrado con ese correo electrónico.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Generate unique userId
    const userId = `U${Date.now().toString().slice(-6)}`;

    // Normalizar el rol usando la función de utilidad
    const mappedRole = normalizeRole(data.role);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: mappedRole,
        status: normalizeStatus(data.status || 'inactive'),
        phone: data.phone || null,
        lastLogin: data.lastLogin || null,
        avatarUrl: data.avatarUrl || null,
        userId: userId,
      },
    });

    // ✨ Si es paciente (USER), crear PatientInfo automáticamente
    if (mappedRole === ROLES.USER) {
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
            bloodType: null, // Se establecerá más tarde
            gender: null     // Se establecerá más tarde
          }
        });
      } catch (patientInfoError) {
        console.error('⚠️ Error creando PatientInfo (no crítico):', patientInfoError);
        // No fallar el registro si PatientInfo falla - se puede crear después
      }
    }
    // ✨ Si es doctor, crear DoctorInfo automáticamente
    else if (mappedRole === 'DOCTOR') {
      try {
        console.log('🔄 Creando registro de doctor para el usuario:', newUser.userId);

        const doctorCedula = `MD-${Date.now().toString().slice(-6)}`;
        const doctorData = {
          userId: newUser.userId,
          cedula: doctorCedula,
          especialidad: 'Urología', // Especialidad por defecto
          telefono: data.phone || newUser.phone || '',
          direccion: '',
          area: 'Urología General', // Área por defecto
          contacto: data.name || newUser.name || '',
          email: data.email || newUser.email || ''
        };

        console.log('📝 Datos del doctor a crear:', JSON.stringify(doctorData, null, 2));

        const doctorInfo = await prisma.doctorInfo.create({
          data: doctorData
        });

        console.log('✅ Registro de doctor creado exitosamente:', doctorInfo);
      } catch (doctorInfoError) {
        console.error('⚠️ Error creando DoctorInfo (no crítico):', doctorInfoError);
        // No fallar el registro si DoctorInfo falla - se puede crear después
      }
    }

    // Create audit log for user creation
    try {
      await createAuditLog(newUser.userId, 'Usuario creado', `Nuevo usuario ${newUser.name} con rol ${newUser.role}`);
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
      }
      throw new Error('No se pudo crear el usuario. Verifica la conexión a la base de datos.');
    }

    throw new Error('Error inesperado al crear usuario');
  }
}

// Get current user with fresh data (no cache)
export async function getCurrentUserFresh(userId: string): Promise<FrontendUser | null> {
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

    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();

    const user = await withDatabase(async (prisma) => {
      const result = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          status: true,
          userId: true,
        },
      });
      return result;
    });
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
export async function ensureDoctorRecord(userId: string, userData: Partial<FrontendUser>): Promise<string | null> {
  console.log(`🔍 Verificando/creando registro de doctor para usuario: ${userId}`);

  try {
    const doctorId = await withDatabase(async (prisma) => {
      // Verificar si el usuario existe y obtener sus datos
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, phone: true }
      });

      if (!user) {
        console.error('❌ Usuario no encontrado al crear registro de doctor');
        return null;
      }

      // Verificar si ya existe un registro de doctor
      const existingDoctor = await prisma.doctorInfo.findUnique({
        where: { userId: userId }
      });

      if (existingDoctor) {
        console.log('✅ Registro de doctor ya existe:', existingDoctor.id);
        return existingDoctor.id;
      }

      // Crear nuevo registro de doctor
      const newDoctor = await prisma.doctorInfo.create({
        data: {
          userId: userId,
          especialidad: 'Urología', // Especialidad por defecto
          cedula: `MD-${Date.now().toString().slice(-6)}`, // Ejemplo: MD-123456
          telefono: userData.phone || user.phone || '',
          direccion: '',
          area: 'Urología General',
          contacto: userData.name || user.name || 'Dr. Usuario',
          email: userData.email || user.email || ''
        }
      });

      console.log('✅ Nuevo registro de doctor creado:', newDoctor);
      return newDoctor.id;
    });

    return doctorId;
  } catch (error) {
    console.error('❌ Error en ensureDoctorRecord:', {
      userId,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

// Helper function to remove doctor record when user role changes from "Doctor"
export async function removeDoctorRecord(userId: string): Promise<void> {
  try {

    await withDatabase(async (prisma) => {
      // Find and delete doctor record
      const doctor = await prisma.doctorInfo.findUnique({
        where: { userId: userId }
      });

      if (doctor) {
        await prisma.doctorInfo.delete({
          where: { id: doctor.id }
        });
      } else {
      }
    });
  } catch (error) {
    console.error('❌ Error removing doctor record:', error);
  }
}

// Helper function to create promotora record when user role changes to "promotora"
export async function ensurePromotoraRecord(userId: string, userData: Partial<FrontendUser>): Promise<string | null> {
  try {

    const promotoraId = await withDatabase(async (prisma) => {
      // Check if promotora record already exists
      const existingPromotora = await prisma.promotoraInfo.findUnique({
        where: { userId: userId }
      });

      if (existingPromotora) {
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

    await withDatabase(async (prisma) => {
      // Find and delete promotora record
      const promotora = await prisma.promotoraInfo.findUnique({
        where: { userId: userId }
      });

      if (promotora) {
        await prisma.promotoraInfo.delete({
          where: { id: promotora.id }
        });
      } else {
      }
    });
  } catch (error) {
    console.error('❌ Error removing promotora record:', error);
  }
}

// Helper function to create secretaria record when user role changes to "secretaria"
export async function ensureSecretariaRecord(userId: string, userData: Partial<FrontendUser>): Promise<string | null> {
  try {

    const secretariaId = await withDatabase(async (prisma) => {
      // Check if secretaria record already exists
      const existingSecretaria = await prisma.secretariaInfo.findUnique({
        where: { userId: userId }
      });

      if (existingSecretaria) {
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

    await withDatabase(async (prisma) => {
      // Find and delete secretaria record
      const secretaria = await prisma.secretariaInfo.findUnique({
        where: { userId: userId }
      });

      if (secretaria) {
        await prisma.secretariaInfo.delete({
          where: { id: secretaria.id }
        });
      } else {
      }
    });
  } catch (error) {
    console.error('❌ Error removing secretaria record:', error);
  }
}

export async function updateUser(userId: string, data: Partial<Omit<FrontendUser, "id" | "createdAt">>): Promise<FrontendUser> {
  try {
    console.log('🔄 updateUser data keys:', Object.keys(data));

    // Get current user data to check role changes
    const currentUser = await withDatabase(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true, email: true, phone: true }
      });
    });

    // Normalize role before any comparison
    const normalizedRole = data.role ? normalizeRole(data.role) : undefined;

    // Update user using withTransaction - atomicidad asegurada
    const result = await withTransaction(async (prisma) => {
      // Prepare update data with normalized role and status
      const updateData: any = { ...data };
      const userUpdateData: any = {
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
      };

      // Use the pre-normalized role
      if (normalizedRole) {
        userUpdateData.role = normalizedRole;
      }

      // Normalize status if provided
      if (data.status) {
        userUpdateData.status = normalizeStatus(data.status);
      }

      // Update password if provided
      if (updateData.password) {
        userUpdateData.password = updateData.password;
      }

      // First update the user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      });

      // Handle Doctor specific updates
      if (normalizedRole === 'DOCTOR' || (!normalizedRole && currentUser?.role === 'DOCTOR')) {
        // Extract doctor specific fields
        const doctorData = {
          especialidad: updateData.specialty || updateData.especialidad,
          cedula: updateData.cedula,
          telefono: updateData.phone || updateData.telefono, // Use phone from user data if not provided specifically
          direccion: updateData.direccion || updateData.address,
          area: updateData.area,
          contacto: updateData.contacto || updateData.contact,
        };

        // Only update if we have at least some doctor data
        if (Object.values(doctorData).some(val => val !== undefined)) {
          // Clean undefined values
          const cleanDoctorData = Object.fromEntries(
            Object.entries(doctorData).filter(([_, v]) => v !== undefined)
          );

          // Ensure we have required fields for creation if it doesn't exist
          if (!cleanDoctorData.especialidad) cleanDoctorData.especialidad = 'General';
          if (!cleanDoctorData.cedula) cleanDoctorData.cedula = `MD-${Date.now().toString().slice(-6)}`;

          await prisma.doctorInfo.upsert({
            where: { userId: updatedUser.userId },
            create: {
              userId: updatedUser.userId,
              ...cleanDoctorData,
              // Ensure required fields have defaults if missing during create
              especialidad: cleanDoctorData.especialidad || 'General',
              cedula: cleanDoctorData.cedula || `MD-${Date.now().toString().slice(-6)}`,
            },
            update: cleanDoctorData,
          });
        }
      }

      // Manejar cambios de rol
      if (normalizedRole && currentUser && normalizedRole !== currentUser.role) {
        console.log(`🔄 Cambio de rol detectado: ${currentUser.role} -> ${normalizedRole}`);
        const newRole = normalizedRole;
        const oldRole = currentUser.role;

        // Manejar cambios DESDE roles específicos
        if (oldRole === 'DOCTOR' && newRole !== 'DOCTOR') {
          await removeDoctorRecord(userId);
        } else if (oldRole === 'PROMOTORA' && newRole !== 'PROMOTORA') {
          await removePromotoraRecord(userId);
        } else if ((oldRole === 'SECRETARIA' || oldRole === 'USER') &&
          (newRole !== 'SECRETARIA' && newRole !== 'USER')) {
          await removeSecretariaRecord(userId);
        } else if (oldRole === 'USER' && newRole !== 'USER') {
          try {
            await prisma.patientInfo.deleteMany({
              where: { userId: updatedUser.userId }
            });
          } catch (error) {
            console.error('⚠️ Error eliminando PatientInfo:', error);
          }
        }

        // Limpiar información de roles anteriores si es necesario
        if (newRole !== 'USER' && oldRole === 'USER') {
          try {
            await prisma.patientInfo.deleteMany({
              where: { userId: updatedUser.userId }
            });
            console.log('🧹 Registro de paciente eliminado');
          } catch (error) {
            console.error('⚠️ Error eliminando registro de paciente:', error);
          }
        }

        if (newRole !== 'DOCTOR' && oldRole === 'DOCTOR') {
          try {
            await removeDoctorRecord(userId);
            console.log('🧹 Registro de doctor eliminado');
          } catch (error) {
            console.error('⚠️ Error eliminando registro de doctor:', error);
          }
        }

        // Manejar cambios A roles específicos
        if (newRole === 'USER') {
          try {
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
                  bloodType: null,
                  gender: null
                }
              });
              console.log('✅ Registro de paciente creado exitosamente');
            }
          } catch (error) {
            console.error('⚠️ Error creando registro de paciente:', error);
          }
        }
        else if (newRole === 'DOCTOR') {
          // Doctor creation is now handled by the upsert block above if data is present, 
          // but we keep this as a fallback for role switching without specific doctor data
          try {
            const existingDoctor = await prisma.doctorInfo.findUnique({
              where: { userId: updatedUser.userId }
            });

            if (!existingDoctor) {
              await prisma.doctorInfo.create({
                data: {
                  userId: updatedUser.userId,
                  cedula: `MD-${Date.now().toString().slice(-6)}`,
                  especialidad: 'Urología',
                  telefono: data.phone || currentUser.phone || '',
                  direccion: '',
                  area: 'Urología General',
                  contacto: data.name || currentUser.name || '',
                  email: data.email || currentUser.email || ''
                }
              });
              console.log('✅ Registro de doctor creado exitosamente');
            }
          } catch (error) {
            console.error('❌ Error al crear registro de doctor:', error);
          }
        }
      }

      return updatedUser;
    });

    // Si se cambió el estado o el rol, revalidar rutas relevantes
    if (data.status || data.role) {
      try {
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/(app)/patients');
        revalidatePath('/(app)/dashboard');
        revalidatePath('/(app)/appointments');
        revalidatePath('/(app)/settings/users');
        revalidatePath('/(app)/afiliaciones');
      } catch (revalidateError) {
        console.warn('⚠️ No se pudieron revalidar las rutas:', revalidateError);
      }
    }

    // Retornar los datos actualizados del usuario
    return {
      ...result,
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
      status: result.status,
      userId: result.userId,
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

export async function addPaymentMethod(data: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> {
  throw new Error('Not implemented');
}

export async function addPaymentType(data: Omit<PaymentType, 'id'>): Promise<PaymentType> {
  throw new Error('Not implemented');
}

// MISSING FUNCTIONS - Added to fix build errors
export async function getIpssScoresByUserId(userId: string): Promise<IpssScore[]> {
  try {
    const ipssScores = await withDatabase(async (prisma) => {
      return await prisma.ipssScore.findMany({
        where: { userId: userId },
        include: {
          doctor: { select: { name: true } }
        },
        orderBy: { fecha: 'desc' }
      });
    });

    return ipssScores.map((score: any) => ({
      id: score.id,
      userId: score.userId,
      date: score.fecha.toISOString(),
      score: score.puntaje,
      category: score.categoria as 'Leve' | 'Moderado' | 'Severo',
      answers: score.respuestas,
      doctorName: score.doctor?.name
    }));
  } catch (error) {
    console.error('Error fetching IPSS scores:', error);
    return [];
  }
}

export async function saveIpssScore(data: {
  userId: string;
  puntaje: number;
  categoria: string;
  respuestas: Record<string, number>;
  createdBy: string;
}): Promise<IpssScore> {
  try {
    // Validate puntaje is between 0-35
    if (data.puntaje < 0 || data.puntaje > 35) {
      throw new Error('Puntaje debe estar entre 0 y 35');
    }

    // Validate categoria
    if (!['Leve', 'Moderado', 'Severo'].includes(data.categoria)) {
      throw new Error('Categoría debe ser Leve, Moderado o Severo');
    }

    const ipssScore = await withDatabase(async (prisma) => {
      return await prisma.ipssScore.create({
        data: {
          userId: data.userId,
          puntaje: data.puntaje,
          categoria: data.categoria,
          respuestas: data.respuestas,
          createdBy: data.createdBy
        },
        include: {
          doctor: { select: { name: true } }
        }
      });
    });

    return {
      id: ipssScore.id,
      userId: ipssScore.userId,
      date: ipssScore.fecha.toISOString(),
      score: ipssScore.puntaje,
      category: ipssScore.categoria as 'Leve' | 'Moderado' | 'Severo',
      answers: ipssScore.respuestas,
      doctorName: ipssScore.doctor?.name
    };
  } catch (error) {
    console.error('Error saving IPSS score:', error);
    throw error;
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
          doctor: true,
        },
        orderBy: { fecha: 'desc' },
      });
    });

    return labResults.map((result: any) => ({
      id: result.id,
      userId: result.patientUserId, // ✅ Usar el campo directo en vez de result.patient.id
      testName: result.nombre,
      value: result.resultado,
      referenceRange: result.tipo,
      date: result.fecha.toISOString(),
      estado: result.estado, // ✅ NUEVO: agregar estado
      doctor: result.doctor?.name, // ✅ NUEVO: nombre del doctor
    }));
  } catch (error) {
    console.error('Error fetching lab results by patient:', error);
    return [];
  }
}

/**
 * Obtener resultados de laboratorio por patientId (userId)
 */
export async function getLabResultsByPatientId(patientId: string): Promise<LabResult[]> {
  try {
    console.log('[LAB_RESULTS] 🔍 Buscando por patientId:', patientId);

    const labResults = await withDatabase(async (prisma) => {
      // patientId ES el userId - buscar directamente
      const results = await prisma.labResult.findMany({
        where: { patientUserId: patientId },
        select: {
          id: true,
          nombre: true,
          tipo: true,
          resultado: true,
          fecha: true,
          estado: true,
          patientUserId: true,
          archivoContenido: true,
          archivoNombre: true,
          archivoTipo: true,
          archivoTamaño: true,
          patient: { select: { name: true, userId: true } },
          doctor: { select: { name: true, userId: true } }
        },
        orderBy: { fecha: 'desc' }
      });

      console.log('[LAB_RESULTS] ✅ Encontrados:', results.length, 'resultados');
      return results;
    });

    return labResults.map((result: any) => ({
      id: result.id,
      userId: result.patientUserId,
      testName: result.nombre,
      value: result.resultado,
      referenceRange: result.tipo,
      date: result.fecha.toISOString(),
      estado: result.estado,
      doctor: result.doctor?.name,
      archivoContenido: result.archivoContenido,
      archivoNombre: result.archivoNombre,
      archivoTipo: result.archivoTipo,
      archivoTamaño: result.archivoTamaño
    }));

  } catch (error) {
    console.error('[LAB_RESULTS] ❌ Error:', error);
    return [];
  }
}

export async function getConsultationsByUserId(userId: string): Promise<Consultation[]> {
  try {

    const consultations = await withDatabase(async (prisma) => {

      const result = await prisma.consultation.findMany({
        where: { patientUserId: userId },
        include: {
          patient: true,
          doctor: true,
          creator: true,
          prescriptions: true, // ✅ Incluir prescripciones
          labResults: true,    // ✅ Incluir resultados de laboratorio
          reports: {           // ✅ Incluir reportes de consulta con campos específicos
            select: {
              id: true,
              titulo: true,
              descripcion: true,
              tipo: true,
              createdAt: true,
              archivoNombre: true,
              archivoTipo: true,
              archivoTamaño: true,
              archivoContenido: true,
              archivoUrl: true
            }
          }
        },
        orderBy: { fecha: 'desc' },
      });
      return result;
    });

    return consultations.map((consultation: any) => ({
      id: consultation.id,
      userId: consultation.patientUserId, // userId del paciente
      date: consultation.fecha.toISOString(),
      doctor: consultation.doctor ? consultation.doctor.name : 'No especificado',
      type: consultation.motivo as 'Inicial' | 'Seguimiento' | 'Pre-operatorio' | 'Post-operatorio',
      notes: consultation.observaciones || '',
      prescriptions: consultation.prescriptions?.map((prescription: any) => ({
        id: prescription.id,
        medication: prescription.medicamento,
        dosage: prescription.dosis,
        duration: prescription.duracion || prescription.frecuencia,
      })) || [],
      labResults: consultation.labResults?.map((labResult: any) => ({
        id: labResult.id,
        testName: labResult.nombre,
        value: labResult.resultado,
        referenceRange: labResult.valores?.referencia || '',
        date: labResult.fecha.toISOString(),
      })) || [],
      reports: consultation.reports?.map((report: any) => ({
        id: report.id,
        title: report.titulo,
        date: report.createdAt.toISOString(),
        type: report.tipo,
        notes: report.descripcion || '',
        fileUrl: report.archivoUrl || '',
        attachments: report.archivoNombre ? [report.archivoNombre] : [],
        archivoNombre: report.archivoNombre,
        archivoTipo: report.archivoTipo,
        archivoContenido: report.archivoContenido,
        archivoTamaño: report.archivoTamaño,
      })) || [],
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

    // userId es el identificador principal
    const user = await withDatabase(async (prisma) => {

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
      if (result) {
      }

      return result;
    });

    if (!user) return null;

    // Validación de roles estandarizada
    try {
      validateUserRole(user, ROLES.USER);
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

    return {
      id: user.userId, // Usar userId como ID
      name: user.name,
      cedula: patientInfo.cedula,
      age,
      fechaNacimiento: patientInfo.fechaNacimiento.toISOString().split('T')[0],
      gender: (patientInfo.gender as 'Masculino' | 'Femenino' | 'Otro') || 'Otro',
      bloodType: (patientInfo.bloodType as 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-') || 'O+',
      status: user.status === 'ACTIVE' ? 'Activo' as const : 'Inactivo' as const,
      lastVisit: user.lastLogin?.toISOString() || user.createdAt.toISOString(),
      contact: {
        phone: patientInfo.telefono || user.phone || '',
        email: user.email || '',
      },
      direccion: patientInfo.direccion || undefined,
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
          created++;
        } catch (error) {
          const errorMsg = `Error creating user for doctor ${doctor.nombre} ${doctor.apellido}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
        }
      }

      return { created, errors };
    });
    return result;
  } catch (error) {
    console.error('❌ Error syncing orphaned doctors:', error);
    return { created: 0, errors: [`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`] };
  }
}

// Function to create a sample doctor for testing
export async function createSampleDoctor(): Promise<Doctor> {
  try {

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
    return {
      id: doctor.id,
      userId: doctor.id, // Usar el mismo ID como userId para el doctor de ejemplo
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

    await withDatabase(async (prisma) => {
      await prisma.appointment.delete({
        where: { id: appointmentId },
      });
    });
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

    // Validación obligatoria del contexto de usuario - createdBy debe ser siempre un userId válido
    if (!userContext || !userContext.userId) {
      throw new Error('Contexto de usuario requerido: userId es obligatorio para crear citas');
    }

    if (!userContext.name || !userContext.email) {
      throw new Error('Contexto de usuario incompleto: name y email son obligatorios');
    }

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
      validateUserRole(patient, ROLES.USER);

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
        validateUserRole(doctor, ROLES.DOCTOR);
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

      // Create audit log for appointment
      await createAuditLog(
        createdBy,
        'Cita agendada',
        `Nueva cita programada para el paciente (ID: ${appointmentData.userId}) el ${appointmentData.date} a las ${appointmentTime}`
      );

      return result;
    });

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

export async function getLabResultsStats(): Promise<{ completed: number; pending: number; cancelled: number; total: number }> {
  try {
    const labResultsStats = await withDatabase(async (prisma) => {
      return await prisma.labResult.groupBy({
        by: ['estado'],
        _count: {
          id: true
        }
      });
    });

    const completed = labResultsStats.find((s: any) => s.estado === 'COMPLETADO')?._count.id || 0;
    const pending = labResultsStats.find((s: any) => s.estado === 'PENDIENTE')?._count.id || 0;
    const cancelled = labResultsStats.find((s: any) => s.estado === 'CANCELADO')?._count.id || 0;
    const total = completed + pending + cancelled;

    return { completed, pending, cancelled, total };
  } catch (error) {
    console.error('Error fetching lab results stats:', error);
    return { completed: 0, pending: 0, cancelled: 0, total: 0 };
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

export async function getLatestPsaByUserId(userId: string): Promise<{ value: string; date: string; unit?: string; valores?: any[] } | null> {
  try {
    const latestPsa = await withDatabase(async (prisma) => {
      return await prisma.labResult.findFirst({
        where: {
          patientUserId: userId,
          estado: { in: ['COMPLETADO', 'PENDIENTE'] },
          OR: [
            { tipo: 'PSA' },
            {
              nombre: {
                contains: 'PSA',
                mode: 'insensitive',
              }
            }
          ]
        },
        orderBy: {
          fecha: 'desc',
        },
      });
    });
    if (!latestPsa) return null;
    let valorPSA = null;
    let valores = undefined;
    try {
      // First try to parse from resultado field
      if (latestPsa.resultado && latestPsa.resultado.trim().startsWith('[')) {
        const arr = JSON.parse(latestPsa.resultado);
        valores = arr;
        if (Array.isArray(arr)) {
          const psaObj = arr.find(v => v.name && v.name.toLowerCase().includes('psa'));
          if (psaObj) valorPSA = psaObj.value;
        }
      }
      // Fallback: check valores field directly
      if (!valorPSA && latestPsa.valores && Array.isArray(latestPsa.valores)) {
        valores = latestPsa.valores;
        const psaObj = latestPsa.valores.find((v: any) => v.name && v.name.toLowerCase().includes('psa'));
        if (psaObj) valorPSA = psaObj.value;
      }
    } catch { /* silent fail */ }
    // fallback texto plano
    if (!valorPSA) {
      const match = latestPsa.resultado.match(/(\d+\.?\d*)/);
      valorPSA = match ? match[1] : latestPsa.resultado;
    }
    const date = latestPsa.fecha.toISOString().split('T')[0];
    return {
      value: valorPSA,
      date,
      unit: 'ng/mL',
      valores
    };
  } catch (error) {
    console.error('Error fetching latest PSA for user:', userId, error);
    return null;
  }
}

// ADDITIONAL MISSING FUNCTIONS
export async function getReportsByPatientId(patientUserId: string): Promise<Report[]> {
  return withDatabase(async (prisma) => {
    try {
      console.log('📋 Fetching reports for patient:', patientUserId);

      const reports = await prisma.report.findMany({
        where: {
          patientUserId: patientUserId
        },
        orderBy: {
          fecha: 'desc',
        },
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          tipo: true,
          fecha: true,
          notas: true,
          archivoNombre: true,
          archivoTipo: true,
          archivoUrl: true,
          archivoTamaño: true,
          archivoContenido: true,
          createdAt: true,
          updatedAt: true,
          autor: true
        }
      });

      console.log(`✅ Found ${reports.length} reports for patient ${patientUserId}`);

      // Log the first report for debugging
      if (reports.length > 0) {
        console.log('📝 Sample report data:', {
          id: reports[0].id,
          titulo: reports[0].titulo,
          fecha: reports[0].fecha,
          fechaType: typeof reports[0].fecha,
          notas: reports[0].notas,
          descripcion: reports[0].descripcion,
          hasFile: !!reports[0].archivoNombre
        });
      }

      // Map the database fields to the Report type
      return reports.map((report: { id: string; titulo: string; fecha: Date; tipo: string; notas: string | null; descripcion: string | null; archivoUrl: string | null; archivoNombre: string | null; archivoTipo: string | null; archivoTamaño: number | null; archivoContenido: string | null; }) => {
        const reportData: Report = {
          id: report.id,
          userId: patientUserId,
          title: report.titulo,
          date: report.fecha ? new Date(report.fecha).toISOString() : new Date().toISOString(),
          type: report.tipo,
          notes: report.notas || report.descripcion || '',
          fileUrl: report.archivoUrl || '',
          archivoNombre: report.archivoNombre || undefined,
          archivoTipo: report.archivoTipo || undefined,
          archivoTamaño: report.archivoTamaño || undefined,
          archivoContenido: report.archivoContenido || undefined,
          attachments: report.archivoNombre ? [{
            name: report.archivoNombre,
            type: report.archivoTipo || 'application/octet-stream',
            size: report.archivoTamaño || 0,
            url: report.archivoUrl || ''
          }] : [],
          // Include raw data for debugging and backward compatibility
          rawData: report
        };
        return reportData;
      });
    } catch (error) {
      console.error('❌ Error fetching reports:', error);
      // Return empty array on error to prevent UI from breaking
      return [];
    }
  }, []);
}

export async function getPatientMedicalHistoryAsString(userId: string): Promise<string> {
  try {
    const patient = await withDatabase(async (prisma) => {
      return await prisma.user.findUnique({
        where: { userId: userId },
        include: {
          patientInfo: true,
          patientConsultations: {
            include: {
              doctor: true,
              labResults: true,
              prescriptions: true,
              reports: true,
            },
            orderBy: { fecha: 'desc' },
          },
          patientLabResults: {
            orderBy: { fecha: 'desc' },
          },
          patientAppointments: {
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

    // Usar datos del User y PatientInfo
    const patientName = patient.name;
    const patientInfo = patient.patientInfo;

    let history = `HISTORIA MÉDICA - ${patientName}\n`;
    if (patientInfo) {
      history += `Cédula: ${patientInfo.cedula || 'No disponible'}\n`;
      history += `Fecha de Nacimiento: ${patientInfo.fechaNacimiento ? patientInfo.fechaNacimiento.toLocaleDateString() : 'No disponible'}\n`;
      history += `Teléfono: ${patientInfo.telefono || 'No disponible'}\n`;
      history += `Email: ${patient.email || 'No disponible'}\n`;
      history += `Dirección: ${patientInfo.direccion || 'No disponible'}\n\n`;
    } else {
      history += `Email: ${patient.email || 'No disponible'}\n\n`;
    }

    // Consultas
    if (patient.patientConsultations.length > 0) {
      history += 'CONSULTAS MÉDICAS:\n';
      history += '='.repeat(50) + '\n';
      patient.patientConsultations.forEach((consultation: any, index: number) => {
        history += `${index + 1}. Fecha: ${consultation.fecha.toLocaleDateString()}\n`;
        history += `   Doctor: ${consultation.doctor ? consultation.doctor.name : 'No especificado'}\n`;
        history += `   Motivo: ${consultation.motivo}\n`;
        if (consultation.sintomas) history += `   Síntomas: ${consultation.sintomas}\n`;
        if (consultation.diagnostico) history += `   Diagnóstico: ${consultation.diagnostico}\n`;
        if (consultation.tratamiento) history += `   Tratamiento: ${consultation.tratamiento}\n`;
        if (consultation.observaciones) history += `   Observaciones: ${consultation.observaciones}\n`;

        // Prescripciones
        if (consultation.prescriptions && consultation.prescriptions.length > 0) {
          history += `   Prescripciones:\n`;
          consultation.prescriptions.forEach((prescription: any) => {
            history += `     - ${prescription.medicamento}: ${prescription.dosis} (${prescription.duracion || prescription.frecuencia})\n`;
          });
        }

        // Reportes
        if (consultation.reports && consultation.reports.length > 0) {
          history += `   Reportes:\n`;
          consultation.reports.forEach((report: any) => {
            history += `     - ${report.titulo}: ${report.descripcion || 'Sin descripción'}\n`;
          });
        }

        history += '\n';
      });
    }

    // Resultados de Laboratorio
    if (patient.patientLabResults.length > 0) {
      history += 'RESULTADOS DE LABORATORIO:\n';
      history += '='.repeat(50) + '\n';
      patient.patientLabResults.forEach((result: any, index: number) => {
        history += `${index + 1}. Fecha: ${result.fecha.toLocaleDateString()}\n`;
        history += `   Estudio: ${result.nombre}\n`;
        history += `   Tipo: ${result.tipo}\n`;
        history += `   Resultado: ${result.resultado}\n`;
        history += '\n';
      });
    }

    // Citas
    if (patient.patientAppointments.length > 0) {
      history += 'CITAS MÉDICAS:\n';
      history += '='.repeat(50) + '\n';
      patient.patientAppointments.forEach((appointment: any, index: number) => {
        history += `${index + 1}. Fecha: ${appointment.fecha.toLocaleDateString()}\n`;
        history += `   Hora: ${appointment.hora}\n`;
        history += `   Tipo: ${appointment.tipo}\n`;
        history += `   Estado: ${appointment.estado}\n`;
        if (appointment.doctor) {
          history += `   Doctor: ${appointment.doctor.name}\n`;
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
    return mappedPatients;
  } catch (error) {
    console.error('Error fetching patients by company ID:', error);
    return [];
  }
}

// RECEIPT FUNCTIONS
export async function createReceipt(data: {
  patientUserId: string;    // userId del paciente
  amount: number;           // Monto del pago
  method: string;           // Método de pago
  type: 'Consulta' | 'Afiliación';
  paymentType: 'Contado' | 'Crédito';
  createdBy: string;        // userId del usuario que crea el recibo
  doctorId?: string;        // userId del doctor (opcional para afiliaciones)
  companyId?: string;       // ID de la empresa (requerido para afiliaciones)
  plan?: string;            // Plan (solo para afiliaciones)
  notes?: string;           // Notas adicionales
}) {
  return withDatabase(async (prisma) => {
    // Iniciar transacción con tipo explícito
    return await prisma.$transaction(async (tx: typeof prisma) => {
      try {
        // 0. Validaciones iniciales
        if (!data.patientUserId) {
          throw new Error('Debe seleccionar un paciente');
        }

        // Doctor es opcional SOLO para afiliaciones
        if (!data.doctorId && !data.companyId) {
          throw new Error('Debe seleccionar un doctor o una empresa (afiliación)');
        }

        // Debug logs
        console.log('📝 Creando recibo:');
        console.log('🏢 Company ID:', data.companyId);
        console.log('👨‍⚕️ Doctor ID:', data.doctorId);
        console.log('👤 Patient ID:', data.patientUserId);
        console.log('💵 Amount:', data.amount);
        console.log('💳 Method:', data.method);
        console.log('📌 Type:', data.type);

        // 1. Validar que el paciente existe y traer sus datos
        const patient = await tx.user.findUnique({
          where: { userId: data.patientUserId },
          include: {
            patientInfo: true,
            affiliations: {
              include: {
                company: true
              }
            }
          }
        });

        if (!patient) {
          throw new Error(`Paciente con ID ${data.patientUserId} no encontrado`);
        }

        // 2. Validar y obtener datos del doctor si es necesario
        let doctor = null;
        if (data.doctorId) {
          console.log('🔍 Buscando doctor con id:', data.doctorId);

          doctor = await tx.user.findUnique({
            where: { id: data.doctorId },
            include: {
              doctorInfo: true,
            }
          });

          if (!doctor) {
            console.error('❌ Doctor con id', data.doctorId, 'no encontrado');
            throw new Error(`Doctor con id ${data.doctorId} no encontrado`);
          }

          console.log('✅ Doctor encontrado:', doctor.name || 'Sin nombre');
        } else {
          console.log('ℹ️  No se especificó doctor (puede ser una afiliación)');
        }

        // 3. Generar número de recibo
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const count = await tx.receipt.count({
          where: { createdAt: { gte: startOfDay } }
        });

        const receiptNumber = `REC-${dateStr}-${String(count + 1).padStart(3, '0')}`;

        // 4. Generar concepto dinámico
        let concept = data.notes || '';
        if (!concept) {
          if (data.type === 'Consulta' && doctor) {
            const doctorName = doctor?.name || 'Médico';
            const specialty = doctor?.doctorInfo?.especialidad || 'No especificada';
            concept = `Consulta - Dr. ${doctorName} (${specialty})`;
          } else if (data.type === 'Afiliación') {
            // Si hay companyId, intentar obtener el nombre de la empresa
            let companyName = 'Particular';
            if (data.companyId) {
              const company = await tx.company.findUnique({
                where: { id: data.companyId },
                select: { nombre: true }
              });
              companyName = company?.nombre || 'Empresa no encontrada';
            } else if (patient.affiliations?.[0]?.company) {
              companyName = patient.affiliations[0].company.nombre;
            }
            concept = `Afiliación - ${companyName}`;

            // Agregar el plan si está disponible
            if (data.plan) {
              concept += ` - Plan ${data.plan}`;
            }
          }

          // Agregar fecha al concepto
          concept += ` - ${now.toLocaleDateString()}`;
        }

        // 5. Validar que el creador existe
        const receiptCreator = await tx.user.findUnique({
          where: { id: data.createdBy }
        });

        console.log('👤 Creator found:', receiptCreator ? `Yes - ${receiptCreator.name}` : `NO - USER NOT FOUND (${data.createdBy})`);

        if (!receiptCreator) {
          throw new Error(`Usuario creador con id ${data.createdBy} no encontrado en BD`);
        }

        // 6. Crear el recibo
        const receipt = await tx.receipt.create({
          data: {
            number: receiptNumber,
            amount: new Decimal(data.amount),
            concept: concept,
            method: data.method,
            type: data.type,
            paymentType: data.paymentType,
            plan: data.plan || null,
            patient: {
              connect: { userId: data.patientUserId }  // ← ESTE ESTÁ BIEN (es userId string)
            },
            createdBy: {
              connect: { id: data.createdBy }  // ← CAMBIAR: id en vez de userId
            },
            // Doctor condicional
            ...(data.doctorId && {
              doctor: {
                connect: { id: data.doctorId }  // ← CAMBIAR: id en vez de userId
              }
            })
          },
          include: {
            patient: {
              include: {
                patientInfo: true,
                affiliations: {
                  include: { company: true }
                }
              }
            },
            doctor: {
              include: { doctorInfo: true }
            },
            createdBy: true
          }
        });

        // 6. Registro de auditoría eliminado temporalmente

        return {
          ...receipt,
          amount: receipt.amount.toNumber(),
          // Asegurar que los datos relacionados estén disponibles
          patientName: patient.name,
          patientCedula: patient.patientInfo?.cedula || 'No especificada',
          doctorName: doctor?.name || 'No asignado',
          createdByName: receipt.createdBy?.name || 'Sistema'
        };

      } catch (error: any) {
        console.error('❌ Error al crear recibo:', error);
        // El error se propagará y hará rollback de la transacción
        throw new Error(`Error al crear recibo: ${error.message}`);
      }
    });
  }, null);
}

interface ReceiptResult {
  id: string;
  number: string;
  amount: number | string;
  concept: string | null;
  method: string;
  type: string;
  paymentType: string;
  status: string;
  patientId: string | null;
  doctorId: string | null;
  createdById: string | null;
  plan: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  patientName: string | null;
  patientCedula: string | null;
  patientEmail: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  doctorName: string | null;
  doctorEmail: string | null;
}

type ReceiptWithRelations = Prisma.ReceiptGetPayload<{
  include: {
    patient: {
      include: {
        patientInfo: true;
      };
    };
    doctor: {
      include: {
        doctorInfo: true,
        user: true; // This is the correct way to include the user relation
      };
    };
    createdBy: true; // This is the correct way to include the createdBy relation
  };
}>;

export async function getReceipts(): Promise<any[]> {
  try {
    // ... (rest of the code remains the same)
    if (!isDatabaseAvailable()) {
      return [];
    }

    const prisma = getPrisma();

    const receipts = await prisma.receipt.findMany({
      include: {
        patient: {
          include: {
            patientInfo: true
          }
        },
        doctor: {
          include: {
            doctorInfo: true
          }
        },
        createdBy: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }) as unknown as ReceiptWithRelations[];

    return receipts.map(receipt => {
      // Get patient data with fallbacks
      const patient = receipt.patient;
      const patientName = patient?.name || 'Sin paciente asignado';
      const patientCedula = patient?.patientInfo?.cedula || 'No especificada';
      const patientEmail = (patient as any)?.email || null;

      // Get doctor data with fallbacks
      const doctor = receipt.doctor;
      const doctorUser = doctor?.user as { name?: string; email?: string } | null | undefined;
      const doctorName = doctorUser?.name || 'Sin doctor asignado';
      const doctorEmail = doctorUser?.email || null;

      // Get creator data with fallbacks
      const createdBy = receipt.createdBy as { name?: string; email?: string } | null | undefined;
      const createdByName = createdBy?.name || 'Sistema UroVital';
      const createdByEmail = createdBy?.email || null;

      // Ensure amount is a number
      const amount = typeof receipt.amount === 'string'
        ? parseFloat(receipt.amount)
        : Number(receipt.amount);

      // Ensure dates are properly formatted
      const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return new Date().toISOString();
        return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
      };

      return {
        ...receipt,
        amount,
        createdAt: formatDate(receipt.createdAt),
        updatedAt: formatDate(receipt.updatedAt),
        patientName,
        patientCedula,
        patientEmail,
        doctorName,
        doctorEmail,
        createdBy: { name: createdByName, email: createdByEmail },
        createdByName,
        createdByEmail,
        // Include the full patient and doctor objects for debugging
        patient: receipt.patient,
        doctor: receipt.doctor
      };
    });
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
      where: { id: receiptId }
    });

    if (!receipt) {
      return null;
    }

    return {
      ...receipt,
      amount: receipt.amount.toNumber(),
      createdAt: receipt.createdAt.toISOString(),
      patientName: 'Paciente', // Placeholder since we're not joining with users
      patientCedula: 'No especificada'
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

    await withDatabase(async (prisma) => {
      await prisma.affiliation.update({
        where: { id: affiliationId },
        data: updateData
      });
    });
  } catch (error) {
    console.error('❌ Error updating affiliation:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// LAB RESULTS FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * 🔬 Agregar resultado de laboratorio
 * 
 * Crea un nuevo resultado de laboratorio con estado PENDIENTE.
 * El resultado se marca como completado usando updateLabResultStatus().
 */
export async function addLabResult(
  labData: {
    nombre: string;
    tipo: string;
    resultado?: string;
    valores?: any;
    patientUserId: string; // userId del paciente
    doctorUserId?: string;
    consultationId?: string;
    archivoNombre?: string;
    archivoTipo?: string;
    archivoTamaño?: number;
    archivoContenido?: string;
  },
  userContext: UserContext
) {
  try {
    console.log('[LAB_RESULT] Creando resultado de laboratorio:', labData.nombre);
    console.log('[LAB_RESULT] PatientUserId recibido:', labData.patientUserId);
    console.log('[LAB_RESULT] Archivo adjunto:', {
      archivoNombre: labData.archivoNombre,
      archivoTipo: labData.archivoTipo,
      archivoTamaño: labData.archivoTamaño,
      hasArchivoContenido: !!labData.archivoContenido
    });

    // Validar permisos (solo doctor y admin pueden crear)
    if (userContext.role !== ROLES.ADMIN && userContext.role !== ROLES.DOCTOR) {
      throw new Error('No tienes permisos para crear resultados de laboratorio');
    }

    const result = await withDatabase(async (prisma) => {
      // Usar directamente el patientUserId (ya es el userId)
      const labResult = await prisma.labResult.create({
        data: {
          nombre: labData.nombre,
          tipo: labData.tipo,
          resultado: labData.resultado || 'Pendiente',
          valores: labData.valores || null,
          fecha: new Date(),
          estado: 'PENDIENTE',
          patientUserId: labData.patientUserId,
          doctorUserId: labData.doctorUserId || userContext.userId,
          consultationId: labData.consultationId,
          archivoNombre: labData.archivoNombre,
          archivoTipo: labData.archivoTipo,
          archivoTamaño: labData.archivoTamaño,
          archivoContenido: labData.archivoContenido
        },
        include: {
          patient: { select: { name: true, userId: true } },
          doctor: { select: { name: true, userId: true } }
        }
      });

      console.log('[LAB_RESULT] ✅ Resultado creado:', labResult.id);
      return labResult;
    });

    return result;

  } catch (error) {
    console.error('[LAB_RESULT] ❌ Error al crear:', error);
    throw error;
  }
}

/**
 * 🔄 Actualizar estado de resultado de laboratorio
 * 
 * Cuando se marca como COMPLETADO, se envía notificación al doctor y paciente.
 */
export async function updateLabResultStatus(
  labResultId: string,
  nuevoEstado: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO',
  resultado?: string,
  userContext?: UserContext
) {
  try {
    console.log('[LAB_RESULT] Actualizando estado a:', nuevoEstado);

    const updated = await withDatabase(async (prisma) => {
      // Actualizar el resultado
      const labResult = await prisma.labResult.update({
        where: { id: labResultId },
        data: {
          estado: nuevoEstado,
          resultado: resultado || undefined,
          updatedAt: new Date()
        },
        include: {
          patient: { select: { id: true, name: true, userId: true } },
          doctor: { select: { id: true, name: true, userId: true } }
        }
      });

      console.log('[LAB_RESULT] ✅ Estado actualizado a:', nuevoEstado);

      // 🔔 Si se marca como COMPLETADO → Enviar notificaciones
      if (nuevoEstado === 'COMPLETADO') {
        console.log('[LAB_RESULT] 📧 Enviando notificaciones...');

        // Importar función de notificaciones
        const { notifyLabResultReady } = await import('./notification-service');

        // Enviar notificaciones en background
        notifyLabResultReady(labResult.id).catch(error => {
          console.error('[LAB_RESULT] Error al enviar notificaciones:', error);
        });
      }

      return labResult;
    });

    return updated;

  } catch (error) {
    console.error('[LAB_RESULT] ❌ Error al actualizar:', error);
    throw error;
  }
}
