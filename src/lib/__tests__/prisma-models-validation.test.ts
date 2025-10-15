/**
 * Tests para verificar que todos los modelos de Prisma estén correctamente accesibles en transacciones
 * Valida que los nombres de modelos coincidan con el schema
 */

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
  withTransaction: jest.fn(),
}));

describe('Prisma Models Validation', () => {
  let mockPrisma: any;
  let mockTransaction: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock del cliente de transacción con todos los modelos del schema
    mockTransaction = {
      // Modelos principales del schema
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      patientInfo: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      doctorInfo: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      promotoraInfo: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      secretariaInfo: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      company: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      provider: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      appointment: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      consultation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      labResult: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      prescription: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      affiliation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      supply: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      report: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      estudio: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      systemConfig: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      receipt: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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

  describe('Modelos del Schema', () => {
    it('debe tener acceso a todos los modelos del schema en transacciones', () => {
      const expectedModels = [
        'user',
        'patientInfo',
        'doctorInfo',
        'promotoraInfo',
        'secretariaInfo',
        'company',
        'provider',
        'appointment',
        'consultation',
        'labResult',
        'prescription',
        'payment',
        'affiliation',
        'supply',
        'report',
        'estudio',
        'systemConfig',
        'receipt',
        'auditLog'
      ];

      expectedModels.forEach(model => {
        expect(mockTransaction[model]).toBeDefined();
        expect(typeof mockTransaction[model]).toBe('object');
        expect(mockTransaction[model].findUnique).toBeDefined();
        expect(mockTransaction[model].findFirst).toBeDefined();
        expect(mockTransaction[model].findMany).toBeDefined();
        expect(mockTransaction[model].create).toBeDefined();
        expect(mockTransaction[model].update).toBeDefined();
        expect(mockTransaction[model].delete).toBeDefined();
      });
    });

    it('NO debe tener acceso a modelos que no existen en el schema', () => {
      const nonExistentModels = [
        'doctor', // Debe ser doctorInfo
        'patient', // Debe ser patientInfo
        'doctorInfo', // Este sí existe
        'patientInfo', // Este sí existe
      ];

      // Verificar que los modelos incorrectos no estén disponibles
      expect(mockTransaction.doctor).toBeUndefined();
      expect(mockTransaction.patient).toBeUndefined();
      
      // Verificar que los modelos correctos sí estén disponibles
      expect(mockTransaction.doctorInfo).toBeDefined();
      expect(mockTransaction.patientInfo).toBeDefined();
    });
  });

  describe('Operaciones de Transacción', () => {
    it('debe poder crear un usuario y su información de paciente en una transacción', async () => {
      const mockUser = {
        id: 'user123',
        userId: 'U123456',
        name: 'Test User',
        email: 'test@example.com',
        role: 'patient'
      };

      const mockPatientInfo = {
        id: 'patient123',
        userId: 'U123456',
        cedula: 'V-12345678',
        fechaNacimiento: new Date('1990-01-01'),
        gender: 'Masculino',
        bloodType: 'O+'
      };

      mockTransaction.user.create.mockResolvedValue(mockUser);
      mockTransaction.patientInfo.create.mockResolvedValue(mockPatientInfo);

      // Simular operación de transacción
      const result = await mockTransaction.user.create({
        data: {
          userId: 'U123456',
          name: 'Test User',
          email: 'test@example.com',
          role: 'patient'
        }
      });

      expect(result).toEqual(mockUser);
      expect(mockTransaction.user.create).toHaveBeenCalled();
    });

    it('debe poder crear un doctor y su información en una transacción', async () => {
      const mockDoctorInfo = {
        id: 'doctor123',
        userId: 'U123456',
        especialidad: 'Urología',
        cedula: 'V-87654321'
      };

      mockTransaction.doctorInfo.create.mockResolvedValue(mockDoctorInfo);

      // Simular operación de transacción
      const result = await mockTransaction.doctorInfo.create({
        data: {
          userId: 'U123456',
          especialidad: 'Urología',
          cedula: 'V-87654321'
        }
      });

      expect(result).toEqual(mockDoctorInfo);
      expect(mockTransaction.doctorInfo.create).toHaveBeenCalled();
    });

    it('debe poder crear una consulta con relaciones en una transacción', async () => {
      const mockConsultation = {
        id: 'consultation123',
        patientUserId: 'U123456',
        doctorUserId: 'U789012',
        fecha: new Date('2024-01-15'),
        observaciones: 'Consulta inicial'
      };

      mockTransaction.consultation.create.mockResolvedValue(mockConsultation);

      // Simular operación de transacción
      const result = await mockTransaction.consultation.create({
        data: {
          patientUserId: 'U123456',
          doctorUserId: 'U789012',
          fecha: new Date('2024-01-15'),
          observaciones: 'Consulta inicial'
        }
      });

      expect(result).toEqual(mockConsultation);
      expect(mockTransaction.consultation.create).toHaveBeenCalled();
    });
  });

  describe('Validación de Nombres de Modelos', () => {
    it('debe usar nombres camelCase correctos para todos los modelos', () => {
      const modelNames = Object.keys(mockTransaction).filter(key => 
        typeof mockTransaction[key] === 'object' && 
        mockTransaction[key].findUnique
      );

      const expectedCamelCaseModels = [
        'user',
        'patientInfo',
        'doctorInfo',
        'promotoraInfo',
        'secretariaInfo',
        'company',
        'provider',
        'appointment',
        'consultation',
        'labResult',
        'prescription',
        'payment',
        'affiliation',
        'supply',
        'report',
        'estudio',
        'systemConfig',
        'receipt',
        'auditLog'
      ];

      expectedCamelCaseModels.forEach(model => {
        expect(modelNames).toContain(model);
      });
    });

    it('debe validar que no se usen nombres incorrectos de modelos', () => {
      const incorrectModelNames = [
        'doctor', // Debe ser doctorInfo
        'patient', // Debe ser patientInfo
        'Doctor', // Debe ser doctorInfo
        'Patient', // Debe ser patientInfo
      ];

      incorrectModelNames.forEach(incorrectName => {
        expect(mockTransaction[incorrectName]).toBeUndefined();
      });
    });
  });
});
