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

describe('Consultation Final Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Refactored Consultation Tests', () => {
    it('should create consultation with optimized queries', async () => {
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

      // Verificar que se usó withTransaction
      expect(withTransaction).toHaveBeenCalledTimes(1);
      
      // Verificar que se creó la consulta
      expect(result).toBeDefined();
      expect(result.id).toBe('consultation-1');
      expect(result.userId).toBe('patient-1');
      expect(result.type).toBe('Inicial');
    });

    it('should use only tx client within transaction', async () => {
      const { withTransaction } = require('../utils');
      
      let capturedTx: any;
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
        capturedTx = mockTx;
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

      // Verificar que se usó el cliente tx correctamente
      expect(capturedTx.user.findUnique).toHaveBeenCalledWith({
        where: { userId: 'patient-1' },
        select: { 
          userId: true, 
          role: true, 
          status: true,
          name: true 
        }
      });

      expect(capturedTx.doctorInfo.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { especialidad: { contains: 'Dr. Smith' } },
            { cedula: { contains: 'Dr. Smith' } },
            { user: { name: { contains: 'Dr. Smith' } } }
          ]
        },
        select: { 
          userId: true, 
          especialidad: true,
          cedula: true 
        }
      });

      expect(capturedTx.consultation.create).toHaveBeenCalledWith({
        data: {
          fecha: new Date('2024-12-31'),
          motivo: 'Inicial',
          sintomas: '',
          diagnostico: '',
          tratamiento: '',
          observaciones: 'Test consultation',
          patientUserId: 'patient-1',
          doctorUserId: 'doctor-1',
          createdBy: 'admin-1',
        },
        select: {
          id: true,
          fecha: true,
          motivo: true,
          observaciones: true,
          patientUserId: true,
          doctorUserId: true,
          createdBy: true,
          patient: { select: { name: true, userId: true } },
          doctor: { select: { name: true, userId: true } }
        }
      });
    });

    it('should handle transaction timeout gracefully', async () => {
      const { withTransaction, DatabaseErrorHandler } = require('../utils');
      
      withTransaction.mockRejectedValue(new Error('Transaction timeout'));
      DatabaseErrorHandler.handle.mockImplementation(() => {
        throw new Error('Error al crear consulta: Transaction timeout');
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
      const consultationData = {
        userId: 'patient-1',
        date: '2024-12-31',
        doctor: 'Dr. Smith',
        type: 'Inicial' as const,
        notes: 'Test consultation',
      };

      // Sin userContext - debería fallar antes de la transacción
      try {
        await addConsultation(consultationData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('userContext.userId es requerido');
      }
    });

    it('should validate required fields before transaction', async () => {
      const userContext = {
        userId: 'admin-1',
        role: UserRole.ADMIN,
      };

      // Sin userId - debería fallar antes de la transacción
      try {
        await addConsultation({
          userId: '',
          date: '2024-12-31',
          doctor: 'Dr. Smith',
          type: 'Inicial' as const,
          notes: 'Test consultation',
        }, userContext);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('userId es requerido');
      }
    });
  });

  describe('Performance Validation', () => {
    it('should complete transaction efficiently', async () => {
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
        
        // Verificar que la transacción se completa rápidamente
        expect(duration).toBeLessThan(100);
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
      const totalDuration = Date.now() - startTime;

      expect(totalDuration).toBeLessThan(500); // Menos de 500ms total
    });
  });
});
