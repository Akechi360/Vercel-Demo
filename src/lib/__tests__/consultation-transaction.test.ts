/**
 * Tests unitarios para la función addConsultation con transacciones
 * Verifica que el cliente de transacción tenga acceso completo a todos los modelos
 */

import { addConsultation } from '../actions';
import { UserRole } from '../types';
import { getPrismaClient } from '../db';

// Mock de las dependencias
jest.mock('../db', () => ({
  getPrismaClient: jest.fn(),
  isDatabaseAvailable: jest.fn(() => true),
}));

jest.mock('../utils', () => ({
  validateUserRole: jest.fn(),
  DatabaseErrorHandler: {
    handle: jest.fn(),
  },
  validateDate: jest.fn((dateString: string) => new Date(dateString)),
  withTransaction: jest.fn(),
}));

describe('addConsultation - Tests de Transacción', () => {
  let mockPrisma: any;
  let mockTransaction: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock del cliente de transacción con todos los modelos
    mockTransaction = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      doctorInfo: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      consultation: {
        create: jest.fn(),
      },
      patientInfo: {
        findFirst: jest.fn(),
      },
      // Métodos básicos de Prisma
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    };

    // Mock del cliente Prisma principal
    mockPrisma = {
      $transaction: jest.fn((callback) => callback(mockTransaction)),
    };

    const { getPrismaClient } = require('../db');
    getPrismaClient.mockReturnValue(mockPrisma);

    // Mock de withTransaction
    const { withTransaction } = require('../utils');
    withTransaction.mockImplementation(async (operation) => {
      return await operation(mockTransaction);
    });
  });

  describe('Validación del Cliente de Transacción', () => {
    it('debe validar que el cliente de transacción tenga todos los modelos necesarios', async () => {
      const consultationData = {
        userId: 'U123456',
        date: '2024-01-20',
        doctor: 'Dr. Juan Pérez',
        type: 'Inicial' as const,
        notes: 'Consulta inicial',
      };

      const userContext = {
        userId: 'U789012',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      const mockPatient = {
        userId: 'U123456',
        name: 'Test Patient',
        role: 'patient',
        patientInfo: { id: 'patient123' }
      };

      const mockDoctor = {
        id: 'doctor123',
        userId: 'U555666',
        especialidad: 'Médico General',
        cedula: 'DOC-123456'
      };

      const mockConsultation = {
        id: 'consultation123',
        userId: 'U123456',
        doctorId: 'doctor123',
        date: '2024-01-20',
        type: 'Inicial',
        notes: 'Consulta inicial'
      };

      // Mock de respuestas
      mockTransaction.user.findUnique.mockResolvedValue(mockPatient);
      mockTransaction.doctorInfo.findFirst.mockResolvedValue(mockDoctor);
      mockTransaction.consultation.create.mockResolvedValue(mockConsultation);

      const result = await addConsultation(consultationData, userContext);

      // Verificar que se llamaron los métodos correctos
      expect(mockTransaction.user.findUnique).toHaveBeenCalledWith({
        where: { userId: 'U123456' },
        include: { patientInfo: true }
      });

      expect(mockTransaction.doctorInfo.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { especialidad: { contains: 'Dr. Juan Pérez' } },
            { cedula: { contains: 'Dr. Juan Pérez' } },
          ]
        }
      });

      expect(result).toEqual(mockConsultation);
    });

    it('debe manejar error cuando el cliente de transacción no tiene un modelo requerido', async () => {
      const consultationData = {
        userId: 'U123456',
        date: '2024-01-20',
        doctor: 'Dr. Juan Pérez',
        type: 'Inicial' as const,
        notes: 'Consulta inicial',
      };

      const userContext = {
        userId: 'U789012',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      // Mock de cliente de transacción incompleto
      const incompleteTransaction = {
        user: {
          findUnique: jest.fn(),
        },
        // Falta doctorInfo
      };

      const { withTransaction } = require('../utils');
      withTransaction.mockImplementation(async (operation) => {
        return await operation(incompleteTransaction);
      });

      await expect(addConsultation(consultationData, userContext))
        .rejects.toThrow('Modelo doctorInfo no está disponible en la transacción');
    });

    it('debe manejar error cuando el cliente de transacción no tiene métodos básicos', async () => {
      const consultationData = {
        userId: 'U123456',
        date: '2024-01-20',
        doctor: 'Dr. Juan Pérez',
        type: 'Inicial' as const,
        notes: 'Consulta inicial',
      };

      const userContext = {
        userId: 'U789012',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      // Mock de cliente de transacción sin métodos básicos
      const incompleteTransaction = {
        user: {
          findUnique: jest.fn(),
        },
        doctorInfo: {
          findFirst: jest.fn(),
        },
        consultation: {
          create: jest.fn(),
        },
        patientInfo: {
          findFirst: jest.fn(),
        },
        // Falta findFirst, findUnique, create
      };

      const { withTransaction } = require('../utils');
      withTransaction.mockImplementation(async (operation) => {
        return await operation(incompleteTransaction);
      });

      await expect(addConsultation(consultationData, userContext))
        .rejects.toThrow('Cliente de transacción no tiene método findFirst');
    });
  });

  describe('Flujo de Creación de Consulta', () => {
    it('debe crear consulta exitosamente con todos los modelos disponibles', async () => {
      const consultationData = {
        userId: 'U123456',
        date: '2024-01-20',
        doctor: 'Dr. Juan Pérez',
        type: 'Inicial' as const,
        notes: 'Consulta inicial',
      };

      const userContext = {
        userId: 'U789012',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.SECRETARIA,
        currentTime: new Date('2024-01-15T10:00:00Z'),
        timezone: 'America/Caracas'
      };

      const mockPatient = {
        userId: 'U123456',
        name: 'Test Patient',
        role: 'patient',
        patientInfo: { id: 'patient123' }
      };

      const mockDoctor = {
        id: 'doctor123',
        userId: 'U555666',
        especialidad: 'Médico General',
        cedula: 'DOC-123456'
      };

      const mockConsultation = {
        id: 'consultation123',
        userId: 'U123456',
        doctorId: 'doctor123',
        date: '2024-01-20',
        type: 'Inicial',
        notes: 'Consulta inicial'
      };

      // Mock de respuestas
      mockTransaction.user.findUnique.mockResolvedValue(mockPatient);
      mockTransaction.doctorInfo.findFirst.mockResolvedValue(mockDoctor);
      mockTransaction.consultation.create.mockResolvedValue(mockConsultation);

      const result = await addConsultation(consultationData, userContext);

      expect(result).toEqual(mockConsultation);
      expect(mockTransaction.consultation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'U123456',
          doctorId: 'doctor123',
          date: '2024-01-20',
          type: 'Inicial',
          notes: 'Consulta inicial'
        })
      });
    });
  });
});
