import { addConsultation } from '../actions';
import { UserRole } from '../types';

// Mock withTransaction para tests de performance
jest.mock('../utils', () => ({
  withTransaction: jest.fn(),
  validateUserRole: jest.fn(),
  validateDate: jest.fn(() => new Date('2024-12-31')),
  DatabaseErrorHandler: {
    handle: jest.fn(),
  },
}));

describe('Consultation Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('High Concurrency Tests', () => {
    it('should handle 50 simultaneous consultations', async () => {
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
              id: `consultation-${Date.now()}-${Math.random()}`,
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
      
      // Simular 50 consultas simultáneas
      const promises = Array(50).fill(null).map((_, index) => 
        addConsultation({
          ...consultationData,
          notes: `Test consultation ${index}`,
        }, userContext)
      );

      const results = await Promise.allSettled(promises);
      const duration = Date.now() - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      console.log(`✅ 50 consultas simultáneas completadas en ${duration}ms`);
      console.log(`✅ Exitosas: ${successful.length}, Fallidas: ${failed.length}`);
      
      expect(successful.length).toBe(50);
      expect(duration).toBeLessThan(10000); // Menos de 10 segundos
    });

    it('should handle rapid sequential consultations', async () => {
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
              id: `consultation-${Date.now()}-${Math.random()}`,
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
      
      // Simular 20 consultas secuenciales rápidas
      for (let i = 0; i < 20; i++) {
        await addConsultation({
          ...consultationData,
          notes: `Test consultation ${i}`,
        }, userContext);
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ 20 consultas secuenciales completadas en ${duration}ms`);
      
      expect(duration).toBeLessThan(5000); // Menos de 5 segundos
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory with multiple consultations', async () => {
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
              id: `consultation-${Date.now()}-${Math.random()}`,
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

      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simular 100 consultas para detectar memory leaks
      for (let i = 0; i < 100; i++) {
        await addConsultation({
          ...consultationData,
          notes: `Test consultation ${i}`,
        }, userContext);
      }
      
      // Forzar garbage collection si está disponible
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`✅ Memoria inicial: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`✅ Memoria final: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`✅ Incremento: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      // El incremento de memoria no debería ser excesivo (menos de 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Timeout Tests', () => {
    it('should handle timeout scenarios gracefully', async () => {
      const { withTransaction, DatabaseErrorHandler } = require('../utils');
      
      // Simular timeout
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

      const startTime = Date.now();
      
      await expect(addConsultation(consultationData, userContext)).rejects.toThrow('Error al crear consulta');
      
      const duration = Date.now() - startTime;
      console.log(`✅ Timeout manejado en ${duration}ms`);
      
      // El timeout debería ser manejado rápidamente
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Database Load Tests', () => {
    it('should handle database connection pool exhaustion', async () => {
      const { withTransaction } = require('../utils');
      
      // Simular delay en base de datos
      withTransaction.mockImplementation(async (operation) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        
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
              id: `consultation-${Date.now()}-${Math.random()}`,
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
      
      // Simular 30 consultas con delay de base de datos
      const promises = Array(30).fill(null).map((_, index) => 
        addConsultation({
          ...consultationData,
          notes: `Test consultation ${index}`,
        }, userContext)
      );

      const results = await Promise.allSettled(promises);
      const duration = Date.now() - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      console.log(`✅ 30 consultas con delay de DB completadas en ${duration}ms`);
      console.log(`✅ Exitosas: ${successful.length}, Fallidas: ${failed.length}`);
      
      expect(successful.length).toBe(30);
      // Con delay de 100ms por consulta, 30 consultas deberían tomar al menos 3 segundos
      expect(duration).toBeGreaterThan(3000);
    });
  });
});
