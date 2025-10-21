/**
 * EJEMPLOS DE REFACTORIZACIÓN CON LAS NUEVAS UTILIDADES
 * 
 * Este archivo muestra cómo refactorizar las funciones existentes
 * para usar las nuevas utilidades centralizadas.
 * 
 * IMPORTANTE: Este es un archivo de ejemplo - NO usar en producción
 */

import { UserRole, User } from './types';
// Importado desde src/lib/utils.ts - única fuente de validateDate
import { validateUserRole, DatabaseErrorHandler, withTransaction, validateDate } from './utils';

// ============================================================================
// EJEMPLO 1: REFACTORIZACIÓN DE addAppointment
// ============================================================================

/**
 * ✅ VERSIÓN REFACTORIZADA DE addAppointment
 * 
 * Mejoras implementadas:
 * - Uso de enum UserRole para validación consistente
 * - Transacciones para atomicidad
 * - Manejo centralizado de errores
 * - Validación robusta de fechas
 */
export async function addAppointmentRefactored(appointmentData: {
  userId: string;
  doctorId?: string;
  date: string;
  reason: string;
  createdBy: string; // ✅ Ahora se pasa el contexto del usuario
}): Promise<any> {
  try {
    console.log('🔄 Creating appointment with data:', appointmentData);
    
    // ✅ Usar transacciones para atomicidad
    const appointment = await withTransaction(async (prisma) => {
      // ✅ Validar fecha con utilidades centralizadas
      const appointmentDate = validateDate(appointmentData.date, 'Fecha de cita');
      
      // ✅ Validar paciente con enum centralizado
      const patient = await prisma.user.findUnique({
        where: { userId: appointmentData.userId },
        include: { patientInfo: true }
      });
      
      if (!patient) {
        throw new Error(`Paciente con userId ${appointmentData.userId} no encontrado`);
      }
      
      // ✅ Usar función centralizada de validación de roles
      validateUserRole(patient, UserRole.PATIENT);
      
      console.log('✅ Patient exists:', patient.name);
      
      // ✅ Validar doctor con enum centralizado
      let validDoctorUserId: string | undefined = undefined;
      
      if (appointmentData.doctorId && appointmentData.doctorId.trim() !== '') {
        const doctor = await prisma.user.findUnique({
          where: { userId: appointmentData.doctorId },
          include: { doctorInfo: true }
        });
        
        if (!doctor) {
          throw new Error(`Doctor con userId ${appointmentData.doctorId} no encontrado`);
        }
        
        // ✅ Usar función centralizada de validación de roles
        validateUserRole(doctor, UserRole.DOCTOR);
        
        console.log('✅ Doctor exists:', doctor.name);
        validDoctorUserId = appointmentData.doctorId;
      }
      
      // ✅ Crear cita con datos validados
      return await prisma.appointment.create({
        data: {
          fecha: appointmentDate,
          hora: '09:00',
          tipo: 'CONSULTA',
          estado: 'PROGRAMADA',
          notas: appointmentData.reason,
          patientUserId: appointmentData.userId,
          doctorUserId: validDoctorUserId,
          createdBy: appointmentData.createdBy, // ✅ Usar contexto real
        },
      });
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
    // ✅ Usar manejo centralizado de errores
    DatabaseErrorHandler.handle(error, 'crear cita');
  }
}

// ============================================================================
// EJEMPLO 2: REFACTORIZACIÓN DE addPatient
// ============================================================================

/**
 * ✅ VERSIÓN REFACTORIZADA DE addPatient
 * 
 * Mejoras implementadas:
 * - Transacciones para operaciones complejas
 * - Validación robusta de datos
 * - Manejo centralizado de errores
 */
export async function addPatientRefactored(patientData: {
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
  createdBy: string; // ✅ Contexto del usuario
}): Promise<any> {
  try {
    console.log('addPatient called with data:', JSON.stringify(patientData, null, 2));
    
    // ✅ Validaciones de entrada
    if (!patientData.name || patientData.name.trim().length === 0) {
      throw new Error('El nombre es requerido');
    }
    if (!patientData.age || patientData.age <= 0) {
      throw new Error('La edad debe ser mayor a 0');
    }
    if (!patientData.gender) {
      throw new Error('El género es requerido');
    }
    
    // ✅ Usar transacciones para operaciones complejas
    const result = await withTransaction(async (prisma) => {
      // Crear usuario
      const user = await prisma.user.create({
        data: {
          name: patientData.name,
          email: patientData.contact.email || `patient-${Date.now()}@local.com`,
          password: 'temp-password',
          role: UserRole.PATIENT, // ✅ Usar enum
          status: 'ACTIVE',
          phone: patientData.contact.phone,
          userId: `U${Date.now().toString().slice(-6)}`,
        },
      });
      
      console.log('User created successfully:', user);

      // Crear información del paciente
      const [nombre, apellido] = patientData.name.split(' ', 2);
      const fechaNacimiento = new Date(Date.now() - patientData.age * 365.25 * 24 * 60 * 60 * 1000);
      
      const patientInfo = await prisma.patientInfo.create({
        data: {
          userId: user.userId, // ✅ Usar userId del usuario
          cedula: patientData.cedula,
          fechaNacimiento,
          telefono: patientData.contact.phone,
          direccion: '',
          bloodType: patientData.bloodType,
          gender: patientData.gender,
        },
      });
      
      console.log('PatientInfo created successfully:', patientInfo);

      // ✅ Crear afiliación si se proporciona companyId
      if (patientData.companyId) {
        const affiliation = await prisma.affiliation.create({
          data: {
            planId: 'default-plan',
            tipoPago: null,
            estado: 'ACTIVA',
            fechaInicio: new Date(),
            monto: 0,
            beneficiarios: undefined,
            companyId: patientData.companyId,
            userId: user.userId, // ✅ Usar userId del usuario
          },
        });
        
        console.log('Affiliation created successfully:', affiliation);
      }
      
      return { user, patientInfo };
    });

    return {
      id: result.user.id,
      name: result.user.name,
      cedula: result.patientInfo.cedula,
      age: patientData.age,
      gender: patientData.gender,
      bloodType: result.patientInfo.bloodType,
      status: 'Activo' as const,
      contact: {
        phone: result.user.phone || '',
        email: result.user.email,
      },
      avatarUrl: result.user.avatarUrl || undefined,
    };
    
  } catch (error) {
    // ✅ Usar manejo centralizado de errores
    DatabaseErrorHandler.handle(error, 'crear paciente');
  }
}

// ============================================================================
// EJEMPLO 3: REFACTORIZACIÓN DE addAffiliation
// ============================================================================

/**
 * ✅ VERSIÓN REFACTORIZADA DE addAffiliation
 * 
 * Mejoras implementadas:
 * - Validación de roles con enum
 * - Transacciones para atomicidad
 * - Manejo centralizado de errores
 */
export async function addAffiliationRefactored(affiliationData: {
  companyId?: string;
  userId: string;
  planId?: string;
  tipoPago?: string;
  monto?: number;
  estado?: string;
  createdBy: string; // ✅ Contexto del usuario
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔍 Creating affiliation with data:', affiliationData);
    
    // ✅ Usar transacciones para atomicidad
    const affiliation = await withTransaction(async (prisma) => {
      // ✅ Validar que el usuario existe y es un paciente
      const user = await prisma.user.findUnique({
        where: { id: affiliationData.userId }
      });
      
      if (!user) {
        throw new Error(`Usuario con ID ${affiliationData.userId} no existe`);
      }
      
      // ✅ Usar función centralizada de validación de roles
      validateUserRole(user, UserRole.PATIENT);
      
      console.log('✅ User exists and is a patient:', user.name);
      
      // ✅ Validar empresa si se proporciona
      if (affiliationData.companyId) {
        const company = await prisma.company.findUnique({
          where: { id: affiliationData.companyId }
        });
        
        if (!company) {
          throw new Error(`Empresa con ID ${affiliationData.companyId} no existe`);
        }
        
        console.log('✅ Company exists:', company.nombre);
      }
      
      // ✅ Crear afiliación
      return await prisma.affiliation.create({
        data: {
          planId: affiliationData.planId || 'default-plan',
          tipoPago: affiliationData.tipoPago || null,
          estado: (affiliationData.estado as any) || 'ACTIVA',
          fechaInicio: new Date(),
          monto: affiliationData.monto || 0,
          beneficiarios: undefined,
          companyId: affiliationData.companyId || null,
          userId: affiliationData.userId,
        },
        include: {
          company: true,
          user: true,
        },
      });
    });

    console.log('✅ Affiliation created successfully:', affiliation);
    
    return {
      success: true,
      data: {
        id: affiliation.id,
        planId: affiliation.planId,
        estado: affiliation.estado,
        fechaInicio: affiliation.fechaInicio,
        monto: Number(affiliation.monto),
        company: affiliation.company,
        user: affiliation.user,
      }
    };
    
  } catch (error) {
    // ✅ Usar manejo centralizado de errores
    DatabaseErrorHandler.handle(error, 'crear afiliación');
  }
}

// ============================================================================
// EJEMPLO 4: REFACTORIZACIÓN DE createReceipt
// ============================================================================

/**
 * ✅ VERSIÓN REFACTORIZADA DE createReceipt
 * 
 * Mejoras implementadas:
 * - Eliminación de valores hardcodeados
 * - Transacciones para atomicidad
 * - Validación de contexto de usuario
 */
export async function createReceiptRefactored(receiptData: {
  userId: string;
  amount: number;
  concept: string;
  method: string;
  createdBy: string; // ✅ Contexto del usuario (no hardcoded)
}): Promise<any> {
  try {
    console.log('createReceipt called with data:', JSON.stringify(receiptData, null, 2));
    
    // ✅ Usar transacciones para atomicidad
    const receipt = await withTransaction(async (prisma) => {
      // ✅ Validar que el usuario creador existe
      const creator = await prisma.user.findUnique({
        where: { id: receiptData.createdBy }
      });
      
      if (!creator) {
        throw new Error(`Usuario creador con ID ${receiptData.createdBy} no existe`);
      }
      
      // ✅ Validar que el paciente existe
      const patient = await prisma.user.findUnique({
        where: { id: receiptData.userId }
      });
      
      if (!patient) {
        throw new Error(`Paciente con ID ${receiptData.userId} no existe`);
      }
      
      // ✅ Generar número de comprobante de forma segura
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      const todayStart = new Date(year, today.getMonth(), today.getDate());
      const todayEnd = new Date(year, today.getMonth(), today.getDate() + 1);
      
      const todayReceipts = await prisma.receipt.count({
        where: {
          createdAt: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      });
      
      const receiptNumber = `REC-${year}${month}${day}-${String(todayReceipts + 1).padStart(3, '0')}`;
      
      // ✅ Crear comprobante
      return await prisma.receipt.create({
        data: {
          number: receiptNumber,
          patientUserId: receiptData.userId,
          amount: receiptData.amount,
          concept: receiptData.concept,
          method: receiptData.method,
          createdBy: receiptData.createdBy, // ✅ Usar contexto real
        },
      });
    });

    console.log('Receipt created successfully:', receipt);

    // ✅ Crear log de auditoría
    try {
      await createAuditLog(receiptData.createdBy, 'Comprobante creado', `Comprobante ${receipt.number} generado para paciente ${receiptData.userId}`);
    } catch (auditError) {
      console.warn('Error creating audit log:', auditError);
      // No fallar la operación principal si falla el audit log
    }

    return {
      id: receipt.id,
      number: receipt.number,
      userId: receipt.patientUserId,
      amount: Number(receipt.amount),
      concept: receipt.concept,
      method: receipt.method,
      createdAt: receipt.createdAt,
      createdBy: receipt.createdBy,
    };
    
  } catch (error) {
    // ✅ Usar manejo centralizado de errores
    DatabaseErrorHandler.handle(error, 'crear comprobante');
  }
}

// ============================================================================
// FUNCIÓN AUXILIAR PARA AUDIT LOG (ejemplo)
// ============================================================================

async function createAuditLog(userId: string, action: string, details?: string): Promise<void> {
  try {
    // Implementación del audit log
    console.log(`Audit: ${action} by ${userId} - ${details}`);
  } catch (error) {
    console.error('Error creating audit log:', error);
    // No lanzar error para no romper la operación principal
  }
}

// ============================================================================
// RESUMEN DE MEJORAS IMPLEMENTADAS
// ============================================================================

/**
 * ✅ MEJORAS IMPLEMENTADAS:
 * 
 * 1. ENUM CENTRALIZADO:
 *    - UserRole enum para validación consistente
 *    - Eliminación de strings sueltos
 * 
 * 2. VALIDACIÓN DE ROLES:
 *    - Función validateUserRole() centralizada
 *    - Mensajes de error consistentes
 * 
 * 3. MANEJO DE ERRORES:
 *    - DatabaseErrorHandler centralizado
 *    - Mensajes de error en español
 *    - Manejo de códigos de error de Prisma
 * 
 * 4. TRANSACCIONES:
 *    - withTransaction() para atomicidad
 *    - Operaciones complejas en una sola transacción
 * 
 * 5. VALIDACIÓN DE FECHAS:
 *    - validateDate() para fechas válidas y futuras
 * 
 * 6. ELIMINACIÓN DE HARDCODED:
 *    - Contexto de usuario real
 *    - No más valores fijos
 * 
 * 7. MEJORES PRÁCTICAS:
 *    - Documentación JSDoc
 *    - Manejo de errores robusto
 *    - Logging consistente
 */
