/**
 * Tests de integración para el agendamiento de citas
 * Verifica el flujo completo desde diferentes roles de usuario
 */

import { addAppointment } from '../actions';
import { UserRole } from '../types';
import { getPrismaClient } from '../db';

// Mock de Prisma para los tests de integración
jest.mock('../db', () => ({
  getPrismaClient: jest.fn(),
}));

// Mock de las utilidades
jest.mock('../utils', () => ({
  validateUserRole: jest.fn(),
  DatabaseErrorHandler: {
    handle: jest.fn(),
  },
  validateDate: jest.fn((dateString: string) => new Date(dateString)),
}));

describe('addAppointment - Tests de Integración', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      appointment: {
        create: jest.fn(),
      },
    };

    (getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);
  });

  describe('Flujo Completo de Agendamiento', () => {
    const baseAppointmentData = {
      userId: 'U789012',
      date: '2024-01-20',
      reason: 'Consulta de rutina',
      time: '10:00'
    };

    const mockPatient = {
      userId: 'U789012',
      name: 'Juan Pérez',
      role: 'patient',
      patientInfo: { id: 'patient123' }
    };

    const mockDoctor = {
      userId: 'U555666',
      name: 'Dr. María González',
      role: 'doctor',
      doctorInfo: { id: 'doctor123' }
    };

    it('debe completar el flujo completo como SECRETARIA', async () => {
      const secretariaContext = {
        userId: 'U123456',
        name: 'Ana Secretaria',
        email: 'ana@urovital.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      // Mock de respuestas de base de datos
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockPatient) // Paciente encontrado
        .mockResolvedValueOnce(secretariaContext); // Usuario creador encontrado

      const mockAppointment = {
        id: 'appointment123',
        fecha: new Date('2024-01-20'),
        hora: '10:00',
        tipo: 'CONSULTA',
        estado: 'PROGRAMADA',
        notas: 'Consulta de rutina',
        patientUserId: 'U789012',
        createdBy: 'U123456',
        createdAt: new Date('2024-01-15T10:00:00Z')
      };

      mockPrisma.appointment.create.mockResolvedValue(mockAppointment);

      const result = await addAppointment(baseAppointmentData, secretariaContext);

      // Verificaciones
      expect(result).toEqual(mockAppointment);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fecha: new Date('2024-01-20'),
          hora: '10:00',
          tipo: 'CONSULTA',
          estado: 'PROGRAMADA',
          notas: 'Consulta de rutina',
          patientUserId: 'U789012',
          createdBy: 'U123456' // Debe ser el userId de la secretaria
        })
      });
    });

    it('debe completar el flujo completo como DOCTOR', async () => {
      const doctorContext = {
        userId: 'U777888',
        name: 'Dr. Carlos López',
        email: 'carlos@urovital.com',
        role: UserRole.DOCTOR,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      const appointmentDataWithDoctor = {
        ...baseAppointmentData,
        doctorId: 'U555666'
      };

      // Mock de respuestas de base de datos
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockPatient) // Paciente encontrado
        .mockResolvedValueOnce(mockDoctor) // Doctor encontrado
        .mockResolvedValueOnce(doctorContext); // Usuario creador encontrado

      const mockAppointment = {
        id: 'appointment123',
        fecha: new Date('2024-01-20'),
        hora: '10:00',
        tipo: 'CONSULTA',
        estado: 'PROGRAMADA',
        notas: 'Consulta de rutina',
        patientUserId: 'U789012',
        doctorUserId: 'U555666',
        createdBy: 'U777888',
        createdAt: new Date('2024-01-15T10:00:00Z')
      };

      mockPrisma.appointment.create.mockResolvedValue(mockAppointment);

      const result = await addAppointment(appointmentDataWithDoctor, doctorContext);

      // Verificaciones
      expect(result).toEqual(mockAppointment);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(3);
      expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          createdBy: 'U777888' // Debe ser el userId del doctor
        })
      });
    });

    it('debe completar el flujo completo como ADMIN', async () => {
      const adminContext = {
        userId: 'U999000',
        name: 'Admin Sistema',
        email: 'admin@urovital.com',
        role: UserRole.ADMIN,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      // Mock de respuestas de base de datos
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockPatient) // Paciente encontrado
        .mockResolvedValueOnce(adminContext); // Usuario creador encontrado

      const mockAppointment = {
        id: 'appointment123',
        fecha: new Date('2024-01-20'),
        hora: '10:00',
        tipo: 'CONSULTA',
        estado: 'PROGRAMADA',
        notas: 'Consulta de rutina',
        patientUserId: 'U789012',
        createdBy: 'U999000',
        createdAt: new Date('2024-01-15T10:00:00Z')
      };

      mockPrisma.appointment.create.mockResolvedValue(mockAppointment);

      const result = await addAppointment(baseAppointmentData, adminContext);

      // Verificaciones
      expect(result).toEqual(mockAppointment);
      expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          createdBy: 'U999000' // Debe ser el userId del admin
        })
      });
    });
  });

  describe('Casos de Error en Integración', () => {
    it('debe manejar error cuando el paciente no existe', async () => {
      const secretariaContext = {
        userId: 'U123456',
        name: 'Ana Secretaria',
        email: 'ana@urovital.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      const appointmentData = {
        userId: 'U999999', // Paciente inexistente
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
      };

      // Mock: paciente no encontrado
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null);

      await expect(addAppointment(appointmentData, secretariaContext))
        .rejects.toThrow('Paciente con userId U999999 no encontrado');
    });

    it('debe manejar error cuando el usuario creador no está activo', async () => {
      const secretariaContext = {
        userId: 'U123456',
        name: 'Ana Secretaria',
        email: 'ana@urovital.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
      };

      const mockPatient = {
        userId: 'U789012',
        name: 'Juan Pérez',
        role: 'patient',
        patientInfo: { id: 'patient123' }
      };

      // Mock: paciente existe, pero usuario creador inactivo
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce({
          userId: 'U123456',
          name: 'Ana Secretaria',
          email: 'ana@urovital.com',
          role: 'secretaria',
          status: 'SUSPENDED' // Usuario suspendido
        });

      await expect(addAppointment(appointmentData, secretariaContext))
        .rejects.toThrow('Usuario creador Ana Secretaria (U123456) no está activo. Estado actual: SUSPENDED');
    });
  });

  describe('Verificación de Seguridad', () => {
    it('debe rechazar cuando se intenta usar un userId falso', async () => {
      const fakeContext = {
        userId: 'FAKE_USER_ID',
        name: 'Fake User',
        email: 'fake@example.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
      };

      const mockPatient = {
        userId: 'U789012',
        name: 'Juan Pérez',
        role: 'patient',
        patientInfo: { id: 'patient123' }
      };

      // Mock: paciente existe, pero usuario creador falso no existe
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(null); // Usuario creador falso no encontrado

      await expect(addAppointment(appointmentData, fakeContext))
        .rejects.toThrow('Usuario creador con userId FAKE_USER_ID no encontrado en la base de datos');
    });

    it('debe validar que createdBy nunca sea un valor hardcodeado', async () => {
      const secretariaContext = {
        userId: 'U123456',
        name: 'Ana Secretaria',
        email: 'ana@urovital.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
      };

      const mockPatient = {
        userId: 'U789012',
        name: 'Juan Pérez',
        role: 'patient',
        patientInfo: { id: 'patient123' }
      };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(secretariaContext);

      const mockAppointment = {
        id: 'appointment123',
        createdBy: 'U123456'
      };

      mockPrisma.appointment.create.mockResolvedValue(mockAppointment);

      await addAppointment(appointmentData, secretariaContext);

      // Verificar que createdBy es el userId real, no un valor hardcodeado
      const createCall = mockPrisma.appointment.create.mock.calls[0][0];
      const createdByValue = createCall.data.createdBy;
      
      expect(createdByValue).toBe('U123456');
      expect(createdByValue).not.toBe('system');
      expect(createdByValue).not.toBe('admin');
      expect(createdByValue).not.toBe('admin-master-001');
      expect(createdByValue).toMatch(/^U\d+$/); // Debe seguir el patrón de userId
    });
  });
});
