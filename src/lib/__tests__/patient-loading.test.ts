/**
 * Tests para verificar que las funciones de carga de pacientes funcionen correctamente
 * Verifica que no se queden en estado de carga infinito
 */

import { getConsultationsByUserId, getPatientById } from '../actions';
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
  withDatabase: jest.fn(),
}));

describe('Patient Loading Functions', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock del cliente Prisma
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      consultation: {
        findMany: jest.fn(),
      },
    };

    const { getPrismaClient } = require('../db');
    getPrismaClient.mockReturnValue(mockPrisma);

    // Mock de withDatabase
    const { withDatabase } = require('../utils');
    withDatabase.mockImplementation(async (operation) => {
      return await operation(mockPrisma);
    });
  });

  describe('getPatientById', () => {
    it('debe retornar null cuando el usuario no existe', async () => {
      const userId = 'U123456';
      
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await getPatientById(userId);

      expect(result).toBeNull();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { userId: userId },
        include: {
          patientInfo: true,
          affiliations: {
            where: { estado: 'ACTIVA' },
            include: {
              company: true
            }
          }
        }
      });
    });

    it('debe retornar datos del paciente cuando existe', async () => {
      const userId = 'U123456';
      const mockUser = {
        userId: 'U123456',
        name: 'Test Patient',
        email: 'patient@example.com',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-01'),
        lastLogin: new Date('2024-01-15'),
        phone: '1234567890',
        patientInfo: {
          cedula: 'V-12345678',
          fechaNacimiento: new Date('1990-01-01'),
          gender: 'Masculino',
          bloodType: 'O+',
          telefono: '1234567890'
        },
        affiliations: []
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await getPatientById(userId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('U123456');
      expect(result?.name).toBe('Test Patient');
      expect(result?.cedula).toBe('V-12345678');
    });

    it('debe manejar errores correctamente', async () => {
      const userId = 'U123456';
      
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await getPatientById(userId);

      expect(result).toBeNull();
    });
  });

  describe('getConsultationsByUserId', () => {
    it('debe retornar array vacío cuando no hay consultas', async () => {
      const userId = 'U123456';
      
      mockPrisma.consultation.findMany.mockResolvedValue([]);

      const result = await getConsultationsByUserId(userId);

      expect(result).toEqual([]);
      expect(mockPrisma.consultation.findMany).toHaveBeenCalledWith({
        where: { patientUserId: userId },
        include: {
          patient: true,
          doctor: true,
          creator: true,
        },
        orderBy: { fecha: 'desc' },
      });
    });

    it('debe retornar consultas cuando existen', async () => {
      const userId = 'U123456';
      const mockConsultations = [
        {
          id: 'c1',
          patientUserId: 'U123456',
          fecha: new Date('2024-01-15'),
          observaciones: 'Consulta inicial',
          patient: { name: 'Test Patient' },
          doctor: { name: 'Dr. Smith' },
          creator: { name: 'Dr. Smith' }
        }
      ];

      mockPrisma.consultation.findMany.mockResolvedValue(mockConsultations);

      const result = await getConsultationsByUserId(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c1');
      expect(result[0].userId).toBe('U123456');
      expect(result[0].notes).toBe('Consulta inicial');
    });

    it('debe manejar errores correctamente', async () => {
      const userId = 'U123456';
      
      mockPrisma.consultation.findMany.mockRejectedValue(new Error('Database error'));

      const result = await getConsultationsByUserId(userId);

      expect(result).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    it('debe cargar paciente y consultas sin quedarse en loading infinito', async () => {
      const userId = 'U123456';
      const mockUser = {
        userId: 'U123456',
        name: 'Test Patient',
        email: 'patient@example.com',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-01'),
        lastLogin: new Date('2024-01-15'),
        phone: '1234567890',
        patientInfo: {
          cedula: 'V-12345678',
          fechaNacimiento: new Date('1990-01-01'),
          gender: 'Masculino',
          bloodType: 'O+',
          telefono: '1234567890'
        },
        affiliations: []
      };

      const mockConsultations = [
        {
          id: 'c1',
          patientUserId: 'U123456',
          fecha: new Date('2024-01-15'),
          observaciones: 'Consulta inicial',
          patient: { name: 'Test Patient' },
          doctor: { name: 'Dr. Smith' },
          creator: { name: 'Dr. Smith' }
        }
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.consultation.findMany.mockResolvedValue(mockConsultations);

      // Simular carga simultánea
      const [patient, consultations] = await Promise.all([
        getPatientById(userId),
        getConsultationsByUserId(userId)
      ]);

      expect(patient).not.toBeNull();
      expect(consultations).toHaveLength(1);
    });
  });
});
