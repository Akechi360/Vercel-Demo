/**
 * Tests unitarios para la función addAppointment
 * Verifica que el agendamiento de citas funcione correctamente con todos los roles válidos
 * y que el campo createdBy siempre corresponda a un usuario real y activo.
 */

import { addAppointment } from '../actions';
import { UserRole } from '../types';
import { getPrismaClient } from '../db';

// Mock de Prisma para los tests
jest.mock('../db', () => ({
  getPrismaClient: jest.fn(),
}));

// Mock de las utilidades
jest.mock('../utils', () => ({
  validateUserRole: jest.fn(),
  DatabaseErrorHandler: {
    handle: jest.fn(),
  },
  validateDate: jest.fn((dateString: string) => new Date(dateString)),
}));

describe('addAppointment - Tests de Agendamiento de Citas', () => {
  let mockPrisma: any;
  let mockUser: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock de usuario válido
    mockUser = {
      userId: 'U123456',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.SECRETARIA,
      status: 'ACTIVE',
      currentTime: new Date('2024-01-15T10:00:00Z'),
      timezone: 'America/Caracas'
    };

    // Mock de Prisma client
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      appointment: {
        create: jest.fn(),
      },
    };

    (getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);
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
        ...mockUser,
        userId: ''
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
        ...mockUser,
        name: ''
      };

      await expect(addAppointment(appointmentData, invalidContext))
        .rejects.toThrow('Contexto de usuario incompleto: name y email son obligatorios');
    });
  });

  describe('Validación de Usuario Creador en Base de Datos', () => {
    it('debe rechazar cuando el usuario creador no existe en la base de datos', async () => {
      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
      };

      // Mock: usuario creador no existe
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // Paciente no encontrado
        .mockResolvedValueOnce(null); // Usuario creador no encontrado

      await expect(addAppointment(appointmentData, mockUser))
        .rejects.toThrow(`Usuario creador con userId ${mockUser.userId} no encontrado en la base de datos`);
    });

    it('debe rechazar cuando el usuario creador no está activo', async () => {
      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
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

      await expect(addAppointment(appointmentData, mockUser))
        .rejects.toThrow(`Usuario creador Test User (U123456) no está activo. Estado actual: INACTIVE`);
    });
  });

  describe('Tests por Rol de Usuario', () => {
    const appointmentData = {
      userId: 'U789012',
      date: '2024-01-20',
      reason: 'Consulta de rutina',
      time: '10:00'
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

    beforeEach(() => {
      // Mock básico para paciente y usuario creador
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockCreator);
    });

    it('debe permitir agendar cita como SECRETARIA', async () => {
      const secretariaContext = {
        ...mockUser,
        role: UserRole.SECRETARIA
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

      mockPrisma.appointment.create.mockResolvedValue(mockAppointment);

      const result = await addAppointment(appointmentData, secretariaContext);

      expect(result).toEqual(mockAppointment);
      expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          createdBy: 'U123456', // Debe usar el userId del usuario creador
          patientUserId: 'U789012'
        })
      });
    });

    it('debe permitir agendar cita como DOCTOR', async () => {
      const doctorContext = {
        ...mockUser,
        role: UserRole.DOCTOR
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

      mockPrisma.appointment.create.mockResolvedValue(mockAppointment);

      const result = await addAppointment(appointmentData, doctorContext);

      expect(result).toEqual(mockAppointment);
      expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          createdBy: 'U123456', // Debe usar el userId del usuario creador
          patientUserId: 'U789012'
        })
      });
    });

    it('debe permitir agendar cita como ADMIN', async () => {
      const adminContext = {
        ...mockUser,
        role: UserRole.ADMIN
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

      mockPrisma.appointment.create.mockResolvedValue(mockAppointment);

      const result = await addAppointment(appointmentData, adminContext);

      expect(result).toEqual(mockAppointment);
      expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          createdBy: 'U123456', // Debe usar el userId del usuario creador
          patientUserId: 'U789012'
        })
      });
    });

    it('debe permitir agendar cita como PROMOTORA', async () => {
      const promotoraContext = {
        ...mockUser,
        role: UserRole.PROMOTORA
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

      mockPrisma.appointment.create.mockResolvedValue(mockAppointment);

      const result = await addAppointment(appointmentData, promotoraContext);

      expect(result).toEqual(mockAppointment);
      expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          createdBy: 'U123456', // Debe usar el userId del usuario creador
          patientUserId: 'U789012'
        })
      });
    });
  });

  describe('Validación de Foreign Keys', () => {
    it('debe rechazar cuando el paciente no existe', async () => {
      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
      };

      // Mock: paciente no existe
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null);

      await expect(addAppointment(appointmentData, mockUser))
        .rejects.toThrow(`Paciente con userId U789012 no encontrado`);
    });

    it('debe rechazar cuando el doctor no existe (si se especifica)', async () => {
      const appointmentData = {
        userId: 'U789012',
        doctorId: 'U999999', // Doctor inexistente
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
      };

      // Mock: paciente existe, pero doctor no
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          userId: 'U789012',
          name: 'Test Patient',
          role: 'patient',
          patientInfo: { id: 'patient123' }
        })
        .mockResolvedValueOnce(null); // Doctor no encontrado

      await expect(addAppointment(appointmentData, mockUser))
        .rejects.toThrow(`Doctor con userId U999999 no encontrado`);
    });
  });

  describe('Verificación de createdBy', () => {
    it('debe usar el userId del usuario creador como createdBy', async () => {
      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
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

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockCreator);

      const mockAppointment = {
        id: 'appointment123',
        createdBy: 'U123456'
      };

      mockPrisma.appointment.create.mockResolvedValue(mockAppointment);

      await addAppointment(appointmentData, mockUser);

      expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          createdBy: 'U123456', // Debe ser el userId del usuario creador
          patientUserId: 'U789012'
        })
      });
    });

    it('nunca debe usar valores hardcodeados como createdBy', async () => {
      const appointmentData = {
        userId: 'U789012',
        date: '2024-01-20',
        reason: 'Consulta de rutina',
        time: '10:00'
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

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockCreator);

      const mockAppointment = {
        id: 'appointment123',
        createdBy: 'U123456'
      };

      mockPrisma.appointment.create.mockResolvedValue(mockAppointment);

      await addAppointment(appointmentData, mockUser);

      const createCall = mockPrisma.appointment.create.mock.calls[0][0];
      expect(createCall.data.createdBy).not.toBe('system');
      expect(createCall.data.createdBy).not.toBe('admin');
      expect(createCall.data.createdBy).not.toBe('admin-master-001');
      expect(createCall.data.createdBy).toBe('U123456');
    });
  });
});
