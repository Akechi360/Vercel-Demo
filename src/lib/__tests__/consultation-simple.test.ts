import { addConsultation } from '../actions';
import { UserRole } from '../types';

// Mock withTransaction
jest.mock('../utils', () => ({
  withTransaction: jest.fn(),
  validateUserRole: jest.fn(),
  validateDate: jest.fn(() => new Date('2024-12-31')),
  DatabaseErrorHandler: {
    handle: jest.fn(),
  },
}));

describe('Consultation Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should create consultation successfully', async () => {
      const { withTransaction } = require('../utils');
      
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

      expect(result).toBeDefined();
      expect(result.id).toBe('consultation-1');
      expect(result.userId).toBe('patient-1');
      expect(result.type).toBe('Inicial');
    });

    it('should validate userContext before transaction', async () => {
      const consultationData = {
        userId: 'patient-1',
        date: '2024-12-31',
        doctor: 'Dr. Smith',
        type: 'Inicial' as const,
        notes: 'Test consultation',
      };

      // Sin userContext
      await expect(addConsultation(consultationData)).rejects.toThrow('userContext.userId es requerido');
    });

    it('should validate required fields before transaction', async () => {
      const userContext = {
        userId: 'admin-1',
        role: UserRole.ADMIN,
      };

      // Sin userId
      await expect(addConsultation({
        userId: '',
        date: '2024-12-31',
        doctor: 'Dr. Smith',
        type: 'Inicial' as const,
        notes: 'Test consultation',
      }, userContext)).rejects.toThrow('userId es requerido');
    });
  });

  describe('Performance Tests', () => {
    it('should complete within reasonable time', async () => {
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

      const startTime = Date.now();
      await addConsultation(consultationData, userContext);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { withTransaction, DatabaseErrorHandler } = require('../utils');
      
      withTransaction.mockRejectedValue(new Error('Database error'));
      DatabaseErrorHandler.handle.mockImplementation(() => {
        throw new Error('Error al crear consulta: Database error');
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
  });
});
