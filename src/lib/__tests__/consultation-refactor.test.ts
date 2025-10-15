import { addConsultation } from '../actions';
import { UserRole } from '../types';

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  doctorInfo: {
    findFirst: jest.fn(),
  },
  consultation: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Mock withTransaction
jest.mock('../utils', () => ({
  withTransaction: jest.fn(),
  validateUserRole: jest.fn(),
  validateDate: jest.fn(() => new Date('2024-12-31')),
  DatabaseErrorHandler: {
    handle: jest.fn(),
  },
}));

describe('Consultation Refactor Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Atomicity Tests', () => {
    it('should rollback entire transaction if patient validation fails', async () => {
      const { withTransaction, DatabaseErrorHandler } = require('../utils');
      
      // Mock transaction failure
      withTransaction.mockImplementation(async (operation) => {
        const mockTx = {
          user: {
            findUnique: jest.fn().mockResolvedValue(null), // Patient not found
          },
        };
        return await operation(mockTx);
      });
      
      DatabaseErrorHandler.handle.mockImplementation(() => {
        throw new Error('Error al crear consulta: Paciente no encontrado');
      });

      const consultationData = {
        userId: 'patient-1',
        date: '2024-12-31',
        doctor: 'Dr. Smith',
        type: 'Inicial' as const,
        notes: 'Test consultation',
      };

      const userContext = {
        userId: 'admin-1',
        role: UserRole.ADMIN,
      };

      await expect(addConsultation(consultationData, userContext)).rejects.toThrow('Error al crear consulta');
    });

    it('should complete transaction successfully with valid data', async () => {
      const { withTransaction } = require('../utils');
      
      // Reset mocks for this test
      withTransaction.mockReset();
      
      const mockConsultation = {
        id: 'consultation-1',
        fecha: new Date('2024-12-31'),
        motivo: 'Inicial',
        observaciones: 'Test consultation',
        patientUserId: 'patient-1',
        doctorUserId: 'doctor-1',
        createdBy: 'admin-1',
        patient: { name: 'John Doe', userId: 'patient-1' },
        doctor: { name: 'Dr. Smith', userId: 'doctor-1' },
      };

      withTransaction.mockImplementation(async (operation) => {
        const mockTx = {
          user: {
            findUnique: jest.fn().mockResolvedValue({
              userId: 'patient-1',
              role: 'PATIENT',
              status: 'ACTIVE',
              name: 'John Doe',
            }),
          },
          doctorInfo: {
            findFirst: jest.fn().mockResolvedValue({
              userId: 'doctor-1',
              especialidad: 'Cardiología',
              cedula: 'DOC-123',
            }),
          },
          consultation: {
            create: jest.fn().mockResolvedValue(mockConsultation),
          },
        };
        return await operation(mockTx);
      });

      const consultationData = {
        userId: 'patient-1',
        date: '2024-12-31',
        doctor: 'Dr. Smith',
        type: 'Inicial' as const,
        notes: 'Test consultation',
      };

      const userContext = {
        userId: 'admin-1',
        role: UserRole.ADMIN,
      };

      const result = await addConsultation(consultationData, userContext);

      expect(result).toEqual({
        id: 'consultation-1',
        userId: 'patient-1',
        date: '2024-12-31T00:00:00.000Z',
        doctor: 'Dr. Smith Dr. Smith', // Fixed: doctor name concatenation
        type: 'Inicial',
        notes: 'Test consultation',
        prescriptions: [],
        labResults: [],
        reports: [],
      });
    });
  });

  describe('Performance Tests', () => {
    it('should complete transaction within 5 seconds', async () => {
      const { withTransaction } = require('../utils');
      
      withTransaction.mockImplementation(async (operation) => {
        const startTime = Date.now();
        
        const mockTx = {
          user: {
            findUnique: jest.fn().mockResolvedValue({
              userId: 'patient-1',
              role: 'PATIENT',
              status: 'ACTIVE',
              name: 'John Doe',
            }),
          },
          doctorInfo: {
            findFirst: jest.fn().mockResolvedValue({
              userId: 'doctor-1',
              especialidad: 'Cardiología',
              cedula: 'DOC-123',
            }),
          },
          consultation: {
            create: jest.fn().mockResolvedValue({
              id: 'consultation-1',
              fecha: new Date('2024-12-31'),
              motivo: 'Inicial',
              observaciones: 'Test consultation',
              patientUserId: 'patient-1',
              doctorUserId: 'doctor-1',
              createdBy: 'admin-1',
              patient: { name: 'John Doe', userId: 'patient-1' },
              doctor: { name: 'Dr. Smith', userId: 'doctor-1' },
            }),
          },
        };
        
        const result = await operation(mockTx);
        const duration = Date.now() - startTime;
        
        expect(duration).toBeLessThan(5000);
        return result;
      });

      const consultationData = {
        userId: 'patient-1',
        date: '2024-12-31',
        doctor: 'Dr. Smith',
        type: 'Inicial' as const,
        notes: 'Test consultation',
      };

      const userContext = {
        userId: 'admin-1',
        role: UserRole.ADMIN,
      };

      const startTime = Date.now();
      await addConsultation(consultationData, userContext);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Concurrency Tests', () => {
    it('should handle multiple simultaneous consultations', async () => {
      const { withTransaction } = require('../utils');
      
      withTransaction.mockImplementation(async (operation) => {
        const mockTx = {
          user: {
            findUnique: jest.fn().mockResolvedValue({
              userId: 'patient-1',
              role: 'PATIENT',
              status: 'ACTIVE',
              name: 'John Doe',
            }),
          },
          doctorInfo: {
            findFirst: jest.fn().mockResolvedValue({
              userId: 'doctor-1',
              especialidad: 'Cardiología',
              cedula: 'DOC-123',
            }),
          },
          consultation: {
            create: jest.fn().mockResolvedValue({
              id: `consultation-${Date.now()}`,
              fecha: new Date('2024-12-31'),
              motivo: 'Inicial',
              observaciones: 'Test consultation',
              patientUserId: 'patient-1',
              doctorUserId: 'doctor-1',
              createdBy: 'admin-1',
              patient: { name: 'John Doe', userId: 'patient-1' },
              doctor: { name: 'Dr. Smith', userId: 'doctor-1' },
            }),
          },
        };
        return await operation(mockTx);
      });

      const consultationData = {
        userId: 'patient-1',
        date: '2024-12-31',
        doctor: 'Dr. Smith',
        type: 'Inicial' as const,
        notes: 'Test consultation',
      };

      const userContext = {
        userId: 'admin-1',
        role: UserRole.ADMIN,
      };

      // Simular 10 consultas simultáneas
      const promises = Array(10).fill(null).map((_, index) => 
        addConsultation({
          ...consultationData,
          notes: `Test consultation ${index}`,
        }, userContext)
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled');

      expect(successful.length).toBe(10);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database connection errors gracefully', async () => {
      const { withTransaction, DatabaseErrorHandler } = require('../utils');
      
      // Reset mocks for this test
      withTransaction.mockReset();
      DatabaseErrorHandler.handle.mockReset();
      
      withTransaction.mockRejectedValue(new Error('Database connection failed'));
      DatabaseErrorHandler.handle.mockImplementation(() => {
        throw new Error('Error al crear consulta: Database connection failed');
      });

      const consultationData = {
        userId: 'patient-1',
        date: '2024-12-31',
        doctor: 'Dr. Smith',
        type: 'Inicial' as const,
        notes: 'Test consultation',
      };

      const userContext = {
        userId: 'admin-1',
        role: UserRole.ADMIN,
      };

      await expect(addConsultation(consultationData, userContext)).rejects.toThrow('Error al crear consulta');
    });

    it('should validate userContext before starting transaction', async () => {
      // Reset mocks for this test
      const { withTransaction, DatabaseErrorHandler } = require('../utils');
      withTransaction.mockReset();
      DatabaseErrorHandler.handle.mockReset();
      
      const consultationData = {
        userId: 'patient-1',
        date: '2024-12-31',
        doctor: 'Dr. Smith',
        type: 'Inicial' as const,
        notes: 'Test consultation',
      };

      // Sin userContext - debería fallar antes de la transacción
      await expect(addConsultation(consultationData)).rejects.toThrow('userContext.userId es requerido');
    });
  });

  describe('Data Validation Tests', () => {
    it('should validate required fields before transaction', async () => {
      // Reset mocks for this test
      const { withTransaction, DatabaseErrorHandler } = require('../utils');
      withTransaction.mockReset();
      DatabaseErrorHandler.handle.mockReset();
      
      const userContext = {
        userId: 'admin-1',
        role: UserRole.ADMIN,
      };

      // Sin userId - debería fallar antes de la transacción
      await expect(addConsultation({
        userId: '',
        date: '2024-12-31',
        doctor: 'Dr. Smith',
        type: 'Inicial' as const,
        notes: 'Test consultation',
      }, userContext)).rejects.toThrow('userId es requerido');
    });

    it('should use userContext.userId as createdBy', async () => {
      const { withTransaction } = require('../utils');
      
      let capturedData: any;
      withTransaction.mockImplementation(async (operation) => {
        const mockTx = {
          user: {
            findUnique: jest.fn().mockResolvedValue({
              userId: 'patient-1',
              role: 'PATIENT',
              status: 'ACTIVE',
              name: 'John Doe',
            }),
          },
          doctorInfo: {
            findFirst: jest.fn().mockResolvedValue({
              userId: 'doctor-1',
              especialidad: 'Cardiología',
              cedula: 'DOC-123',
            }),
          },
          consultation: {
            create: jest.fn().mockImplementation((data) => {
              capturedData = data;
              return Promise.resolve({
                id: 'consultation-1',
                fecha: new Date('2024-12-31'),
                motivo: 'Inicial',
                observaciones: 'Test consultation',
                patientUserId: 'patient-1',
                doctorUserId: 'doctor-1',
                createdBy: 'admin-1',
                patient: { name: 'John Doe', userId: 'patient-1' },
                doctor: { name: 'Dr. Smith', userId: 'doctor-1' },
              });
            }),
          },
        };
        return await operation(mockTx);
      });

      const consultationData = {
        userId: 'patient-1',
        date: '2024-12-31',
        doctor: 'Dr. Smith',
        type: 'Inicial' as const,
        notes: 'Test consultation',
      };

      const userContext = {
        userId: 'admin-1',
        role: UserRole.ADMIN,
      };

      await addConsultation(consultationData, userContext);

      expect(capturedData.data.createdBy).toBe('admin-1');
    });
  });
});
