/**
 * Tests simples para la función addAppointment
 * Verifica que las validaciones funcionen correctamente
 */

import { addAppointment } from '../actions';
import { UserRole } from '../types';

// Mock de las dependencias
jest.mock('../db', () => ({
  getPrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn(),
    },
    appointment: {
      create: jest.fn(),
    },
  })),
  isDatabaseAvailable: jest.fn(() => true),
}));

jest.mock('../utils', () => ({
  validateUserRole: jest.fn(),
  DatabaseErrorHandler: {
    handle: jest.fn(),
  },
  validateDate: jest.fn((dateString: string) => new Date(dateString)),
}));

describe('addAppointment - Tests Simples', () => {
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

    const { getPrismaClient } = require('../db');
    getPrismaClient.mockReturnValue(mockPrisma);
  });

  describe('Validación de Contexto de Usuario', () => {
    it('debe rechazar cuando userContext es undefined', async () => {
      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
      };

      await expect(addAppointment(appointmentData, undefined as any))
        .rejects.toThrow('Contexto de usuario requerido: userId es obligatorio para crear citas');
    });

    it('debe rechazar cuando userId está vacío', async () => {
      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
      };

      const invalidContext = {
        userId: '',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      await expect(addAppointment(appointmentData, invalidContext))
        .rejects.toThrow('Contexto de usuario requerido: userId es obligatorio para crear citas');
    });

    it('debe rechazar cuando name está vacío', async () => {
      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
      };

      const invalidContext = {
        userId: 'U123456',
        name: '',
        email: 'test@example.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      await expect(addAppointment(appointmentData, invalidContext))
        .rejects.toThrow('Contexto de usuario incompleto: name y email son obligatorios');
    });
  });

  describe('Validación de Usuario Creador', () => {
    it('debe rechazar cuando el usuario creador no existe', async () => {
      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
      };

      const userContext = {
        userId: 'U123456',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      // Mock: paciente existe, pero usuario creador no
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          userId: 'U789012',
          name: 'Test Patient',
          role: 'patient',
          patientInfo: { id: 'patient123' }
        })
        .mockResolvedValueOnce(null); // Usuario creador no encontrado

      await expect(addAppointment(appointmentData, userContext))
        .rejects.toThrow('Usuario creador con userId U123456 no encontrado en la base de datos');
    });

    it('debe rechazar cuando el usuario creador no está activo', async () => {
      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
      };

      const userContext = {
        userId: 'U123456',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      // Mock: paciente existe, pero usuario creador inactivo
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          userId: 'U789012',
          name: 'Test Patient',
          role: 'patient',
          patientInfo: { id: 'patient123' }
        })
        .mockResolvedValueOnce({
          userId: 'U123456',
          name: 'Test User',
          email: 'test@example.com',
          role: 'secretaria',
          status: 'INACTIVE' // Usuario inactivo
        });

      await expect(addAppointment(appointmentData, userContext))
        .rejects.toThrow('Usuario creador Test User (U123456) no está activo. Estado actual: INACTIVE');
    });
  });

  describe('Flujo Exitoso', () => {
    it('debe crear cita exitosamente con usuario válido', async () => {
      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
      };

      const userContext = {
        userId: 'U123456',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      const mockPatient = {
        userId: 'U789012',
        name: 'Test Patient',
        role: 'patient',
        patientInfo: { id: 'patient123' }
      };

      const mockCreator = {
        userId: 'U123456',
        name: 'Test User',
        email: 'test@example.com',
        role: 'secretaria',
        status: 'ACTIVE'
      };

      const mockAppointment = {
        id: 'appointment123',
        fecha: new Date('2024-01-20'),
        hora: '10:00',
        tipo: 'CONSULTA',
        estado: 'PROGRAMADA',
        notas: 'Consulta de rutina',
        patientUserId: 'U789012',
        createdBy: 'U123456'
      };

      // Mock de respuestas
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockCreator);
      
      mockPrisma.appointment.create.mockResolvedValue(mockAppointment);

      const result = await addAppointment(appointmentData, userContext);

      expect(result).toEqual(mockAppointment);
      expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          createdBy: 'U123456', // Debe usar el userId del usuario creador
          patientUserId: 'U789012'
        })
      });
    });
  });
});
