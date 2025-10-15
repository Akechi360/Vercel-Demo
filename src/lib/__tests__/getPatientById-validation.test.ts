import { getPatientById } from '../actions';

// Mock withDatabase
jest.mock('../utils', () => ({
  withDatabase: jest.fn(),
  validateUserRole: jest.fn(),
  DatabaseErrorHandler: {
    handle: jest.fn(),
  },
}));

describe('getPatientById Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should throw error when userId is undefined', async () => {
      await expect(getPatientById(undefined as any)).rejects.toThrow('userId requerido y debe ser string para exportar informe PDF');
    });

    it('should throw error when userId is null', async () => {
      await expect(getPatientById(null as any)).rejects.toThrow('userId requerido y debe ser string para exportar informe PDF');
    });

    it('should throw error when userId is empty string', async () => {
      await expect(getPatientById('')).rejects.toThrow('userId requerido y debe ser string para exportar informe PDF');
    });

    it('should throw error when userId is whitespace only', async () => {
      await expect(getPatientById('   ')).rejects.toThrow('userId requerido y debe ser string para exportar informe PDF');
    });

    it('should throw error when userId is not a string', async () => {
      await expect(getPatientById(123 as any)).rejects.toThrow('userId requerido y debe ser string para exportar informe PDF');
    });

    it('should throw error when userId is an object', async () => {
      await expect(getPatientById({} as any)).rejects.toThrow('userId requerido y debe ser string para exportar informe PDF');
    });
  });

  describe('Valid Input Handling', () => {
    it('should accept valid string userId', async () => {
      const { withDatabase } = require('../utils');
      
      const mockPatient = {
        userId: 'patient-123',
        name: 'John Doe',
        role: 'PATIENT',
        status: 'ACTIVE',
        patientInfo: {
          cedula: '12345678',
          fechaNacimiento: new Date('1990-01-01'),
          telefono: '1234567890',
          direccion: 'Test Address',
          gender: 'Masculino',
          bloodType: 'O+'
        },
        affiliations: []
      };

      withDatabase.mockResolvedValue(mockPatient);

      const result = await getPatientById('patient-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('patient-123');
      expect(result?.name).toBe('John Doe');
    });

    it('should handle database errors gracefully', async () => {
      const { withDatabase } = require('../utils');
      
      withDatabase.mockRejectedValue(new Error('Database connection failed'));

      const result = await getPatientById('patient-123');

      expect(result).toBeNull();
    });
  });

  describe('PDF Export Flow Simulation', () => {
    it('should not call database with undefined userId', async () => {
      const { withDatabase } = require('../utils');
      
      // Simular el flujo de exportación de PDF con userId undefined
      try {
        await getPatientById(undefined as any);
      } catch (error) {
        // Verificar que no se llamó a withDatabase
        expect(withDatabase).not.toHaveBeenCalled();
      }
    });

    it('should call database with valid userId for PDF export', async () => {
      const { withDatabase } = require('../utils');
      
      const mockPatient = {
        userId: 'patient-123',
        name: 'John Doe',
        role: 'PATIENT',
        status: 'ACTIVE',
        patientInfo: {
          cedula: '12345678',
          fechaNacimiento: new Date('1990-01-01'),
          telefono: '1234567890',
          direccion: 'Test Address',
          gender: 'Masculino',
          bloodType: 'O+'
        },
        affiliations: []
      };

      withDatabase.mockResolvedValue(mockPatient);

      // Simular el flujo de exportación de PDF con userId válido
      const result = await getPatientById('patient-123');

      expect(withDatabase).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long userId strings', async () => {
      const { withDatabase } = require('../utils');
      
      const longUserId = 'a'.repeat(1000);
      const mockPatient = {
        userId: longUserId,
        name: 'John Doe',
        role: 'PATIENT',
        status: 'ACTIVE',
        patientInfo: {
          cedula: '12345678',
          fechaNacimiento: new Date('1990-01-01'),
          telefono: '1234567890',
          direccion: 'Test Address',
          gender: 'Masculino',
          bloodType: 'O+'
        },
        affiliations: []
      };

      withDatabase.mockResolvedValue(mockPatient);

      const result = await getPatientById(longUserId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(longUserId);
    });

    it('should handle special characters in userId', async () => {
      const { withDatabase } = require('../utils');
      
      const specialUserId = 'patient-123_@#$%';
      const mockPatient = {
        userId: specialUserId,
        name: 'John Doe',
        role: 'PATIENT',
        status: 'ACTIVE',
        patientInfo: {
          cedula: '12345678',
          fechaNacimiento: new Date('1990-01-01'),
          telefono: '1234567890',
          direccion: 'Test Address',
          gender: 'Masculino',
          bloodType: 'O+'
        },
        affiliations: []
      };

      withDatabase.mockResolvedValue(mockPatient);

      const result = await getPatientById(specialUserId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(specialUserId);
    });
  });

  describe('Logging Validation', () => {
    it('should log invalid userId details', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        await getPatientById(undefined as any);
      } catch (error) {
        // Verificar que se logueó la información de depuración
        expect(consoleSpy).toHaveBeenCalledWith(
          '❌ getPatientById - userId inválido:',
          { userId: undefined, type: 'undefined' }
        );
      }
      
      consoleSpy.mockRestore();
    });

    it('should log valid userId details', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { withDatabase } = require('../utils');
      
      const mockPatient = {
        userId: 'patient-123',
        name: 'John Doe',
        role: 'PATIENT',
        status: 'ACTIVE',
        patientInfo: {
          cedula: '12345678',
          fechaNacimiento: new Date('1990-01-01'),
          telefono: '1234567890',
          direccion: 'Test Address',
          gender: 'Masculino',
          bloodType: 'O+'
        },
        affiliations: []
      };

      withDatabase.mockResolvedValue(mockPatient);

      await getPatientById('patient-123');

      // Verificar que se logueó la información de depuración
      expect(consoleSpy).toHaveBeenCalledWith('🔍 getPatientById - Buscando paciente con userId:', 'patient-123');
      expect(consoleSpy).toHaveBeenCalledWith('🔍 getPatientById - Tipo de userId:', 'string');
      expect(consoleSpy).toHaveBeenCalledWith('🔍 getPatientById - Longitud de userId:', 10);
      
      consoleSpy.mockRestore();
    });
  });
});
