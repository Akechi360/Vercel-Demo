import { getPatients } from '../actions';

// Mock withDatabase
jest.mock('../utils', () => ({
  withDatabase: jest.fn(),
  validateUserRole: jest.fn(),
  DatabaseErrorHandler: {
    handle: jest.fn(),
  },
}));

// Mock isDatabaseAvailable
jest.mock('../db', () => ({
  isDatabaseAvailable: jest.fn(),
  getPrisma: jest.fn(),
}));

describe('Patient Navigation Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Patient Data Structure', () => {
    it('should return patients with valid id field', async () => {
      const { withDatabase } = require('../utils');
      const { isDatabaseAvailable } = require('../db');
      const { getPrisma } = require('../db');
      
      // Mock database availability
      isDatabaseAvailable.mockResolvedValue(true);
      
      // Mock Prisma client
      const mockPrisma = {
        user: {
          findMany: jest.fn()
        }
      };
      getPrisma.mockReturnValue(mockPrisma);
      
      // Mock user data with valid userId
      const mockUsers = [
        {
          id: 'user-123',
          userId: 'patient-123',
          name: 'John Doe',
          role: 'PATIENT',
          status: 'ACTIVE',
          email: 'john@example.com',
          phone: '1234567890',
          createdAt: new Date(),
          lastLogin: new Date(),
          patientInfo: {
            cedula: '12345678',
            fechaNacimiento: new Date('1990-01-01'),
            telefono: '1234567890',
            direccion: 'Test Address',
            gender: 'Masculino',
            bloodType: 'O+'
          }
        }
      ];
      
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      
      const patients = await getPatients();
      
      expect(patients).toHaveLength(1);
      expect(patients[0].id).toBe('patient-123');
      expect(typeof patients[0].id).toBe('string');
      expect(patients[0].id.trim()).not.toBe('');
    });

    it('should handle users with undefined userId', async () => {
      const { withDatabase } = require('../utils');
      const { isDatabaseAvailable } = require('../db');
      const { getPrisma } = require('../db');
      
      // Mock database availability
      isDatabaseAvailable.mockResolvedValue(true);
      
      // Mock Prisma client
      const mockPrisma = {
        user: {
          findMany: jest.fn()
        }
      };
      getPrisma.mockReturnValue(mockPrisma);
      
      // Mock user data with undefined userId
      const mockUsers = [
        {
          id: 'user-123',
          userId: undefined, // ❌ userId undefined
          name: 'John Doe',
          role: 'PATIENT',
          status: 'ACTIVE',
          email: 'john@example.com',
          phone: '1234567890',
          createdAt: new Date(),
          lastLogin: new Date(),
          patientInfo: {
            cedula: '12345678',
            fechaNacimiento: new Date('1990-01-01'),
            telefono: '1234567890',
            direccion: 'Test Address',
            gender: 'Masculino',
            bloodType: 'O+'
          }
        }
      ];
      
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      
      const patients = await getPatients();
      
      expect(patients).toHaveLength(1);
      // Should use fallback id (user.id)
      expect(patients[0].id).toBe('user-123');
      expect(typeof patients[0].id).toBe('string');
      expect(patients[0].id.trim()).not.toBe('');
    });

    it('should handle users with null userId', async () => {
      const { withDatabase } = require('../utils');
      const { isDatabaseAvailable } = require('../db');
      const { getPrisma } = require('../db');
      
      // Mock database availability
      isDatabaseAvailable.mockResolvedValue(true);
      
      // Mock Prisma client
      const mockPrisma = {
        user: {
          findMany: jest.fn()
        }
      };
      getPrisma.mockReturnValue(mockPrisma);
      
      // Mock user data with null userId
      const mockUsers = [
        {
          id: 'user-456',
          userId: null, // ❌ userId null
          name: 'Jane Doe',
          role: 'PATIENT',
          status: 'ACTIVE',
          email: 'jane@example.com',
          phone: '0987654321',
          createdAt: new Date(),
          lastLogin: new Date(),
          patientInfo: {
            cedula: '87654321',
            fechaNacimiento: new Date('1985-05-15'),
            telefono: '0987654321',
            direccion: 'Test Address 2',
            gender: 'Femenino',
            bloodType: 'A+'
          }
        }
      ];
      
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      
      const patients = await getPatients();
      
      expect(patients).toHaveLength(1);
      // Should use fallback id (user.id)
      expect(patients[0].id).toBe('user-456');
      expect(typeof patients[0].id).toBe('string');
      expect(patients[0].id.trim()).not.toBe('');
    });

    it('should handle users with empty string userId', async () => {
      const { withDatabase } = require('../utils');
      const { isDatabaseAvailable } = require('../db');
      const { getPrisma } = require('../db');
      
      // Mock database availability
      isDatabaseAvailable.mockResolvedValue(true);
      
      // Mock Prisma client
      const mockPrisma = {
        user: {
          findMany: jest.fn()
        }
      };
      getPrisma.mockReturnValue(mockPrisma);
      
      // Mock user data with empty string userId
      const mockUsers = [
        {
          id: 'user-789',
          userId: '', // ❌ userId empty string
          name: 'Bob Smith',
          role: 'PATIENT',
          status: 'ACTIVE',
          email: 'bob@example.com',
          phone: '5555555555',
          createdAt: new Date(),
          lastLogin: new Date(),
          patientInfo: {
            cedula: '11223344',
            fechaNacimiento: new Date('1988-12-25'),
            telefono: '5555555555',
            direccion: 'Test Address 3',
            gender: 'Masculino',
            bloodType: 'B+'
          }
        }
      ];
      
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      
      const patients = await getPatients();
      
      expect(patients).toHaveLength(1);
      // Should use fallback id (user.id)
      expect(patients[0].id).toBe('user-789');
      expect(typeof patients[0].id).toBe('string');
      expect(patients[0].id.trim()).not.toBe('');
    });
  });

  describe('Navigation URL Generation', () => {
    it('should generate valid navigation URLs', () => {
      const patients = [
        { id: 'patient-123', name: 'John Doe' },
        { id: 'patient-456', name: 'Jane Doe' },
        { id: 'patient-789', name: 'Bob Smith' }
      ];

      patients.forEach(patient => {
        const url = `/patients/${patient.id}`;
        
        expect(url).toBe(`/patients/${patient.id}`);
        expect(patient.id).toBeTruthy();
        expect(typeof patient.id).toBe('string');
        expect(patient.id.trim()).not.toBe('');
      });
    });

    it('should handle invalid patient IDs in navigation', () => {
      const invalidPatients = [
        { id: undefined, name: 'John Doe' },
        { id: null, name: 'Jane Doe' },
        { id: '', name: 'Bob Smith' },
        { id: '   ', name: 'Alice Johnson' }
      ];

      invalidPatients.forEach(patient => {
        const isValidId = patient.id && typeof patient.id === 'string' && patient.id.trim() !== '';
        expect(isValidId).toBeFalsy();
        
        // Should not generate navigation URL for invalid IDs
        if (!isValidId) {
          console.log(`Skipping navigation for invalid patient ID: ${patient.id}`);
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const { isDatabaseAvailable } = require('../db');
      
      // Mock database unavailable
      isDatabaseAvailable.mockResolvedValue(false);
      
      const patients = await getPatients();
      
      expect(patients).toEqual([]);
    });

    it('should handle Prisma query errors gracefully', async () => {
      const { isDatabaseAvailable } = require('../db');
      const { getPrisma } = require('../db');
      
      // Mock database available but Prisma error
      isDatabaseAvailable.mockResolvedValue(true);
      
      const mockPrisma = {
        user: {
          findMany: jest.fn().mockRejectedValue(new Error('Database query failed'))
        }
      };
      getPrisma.mockReturnValue(mockPrisma);
      
      const patients = await getPatients();
      
      expect(patients).toEqual([]);
    });
  });

  describe('Performance Tests', () => {
    it('should process patients efficiently', async () => {
      const { withDatabase } = require('../utils');
      const { isDatabaseAvailable } = require('../db');
      const { getPrisma } = require('../db');
      
      // Mock database availability
      isDatabaseAvailable.mockResolvedValue(true);
      
      // Mock Prisma client
      const mockPrisma = {
        user: {
          findMany: jest.fn()
        }
      };
      getPrisma.mockReturnValue(mockPrisma);
      
      // Mock multiple users
      const mockUsers = Array.from({ length: 100 }, (_, i) => ({
        id: `user-${i}`,
        userId: `patient-${i}`,
        name: `Patient ${i}`,
        role: 'PATIENT',
        status: 'ACTIVE',
        email: `patient${i}@example.com`,
        phone: `123456789${i}`,
        createdAt: new Date(),
        lastLogin: new Date(),
        patientInfo: {
          cedula: `1234567${i}`,
          fechaNacimiento: new Date('1990-01-01'),
          telefono: `123456789${i}`,
          direccion: `Test Address ${i}`,
          gender: 'Masculino',
          bloodType: 'O+'
        }
      }));
      
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      
      const startTime = Date.now();
      const patients = await getPatients();
      const duration = Date.now() - startTime;
      
      expect(patients).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
