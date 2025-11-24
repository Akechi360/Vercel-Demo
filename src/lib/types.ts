// UI form types (lowercase, español)
export type UIRole = 'admin' | 'doctor' | 'secretaria' | 'paciente' | 'promotora';

// DB role types (uppercase)
type DBUserRole = 'ADMIN' | 'DOCTOR' | 'SECRETARIA' | 'PROMOTORA' | 'USER';

// Export UserRole as an alias for DBUserRole
export type UserRole = DBUserRole;

// Define a mapping between UI roles and DB roles
const UI_TO_DB_ROLE: Record<UIRole, UserRole> = {
  admin: 'ADMIN',
  doctor: 'DOCTOR',
  secretaria: 'SECRETARIA',
  paciente: 'USER',
  promotora: 'PROMOTORA'
};

// Map DB roles to UI roles
const DB_TO_UI_ROLE: Record<UserRole, UIRole> = {
  'ADMIN': 'admin',
  'DOCTOR': 'doctor',
  'SECRETARIA': 'secretaria',
  'PROMOTORA': 'promotora',
  'USER': 'paciente'
};

// Convert UI role to DB role
export function toDBRole(uiRole: UIRole): UserRole {
  return UI_TO_DB_ROLE[uiRole];
}

// Convert DB role to UI role
export function toUIRole(dbRole: UserRole): UIRole {
  return DB_TO_UI_ROLE[dbRole] || 'paciente'; // Default to 'paciente' for unknown roles
}

// For backward compatibility
export const ROLES = {
  ADMIN: 'ADMIN' as const,
  DOCTOR: 'DOCTOR' as const,
  USER: 'USER' as const,
  PROMOTORA: 'PROMOTORA' as const,
  SECRETARIA: 'SECRETARIA' as const
} as const;

// Definir los estados de usuario como constante para uso en runtime
export const USER_STATUS = {
  ACTIVE: 'ACTIVE' as const,
  INACTIVE: 'INACTIVE' as const,
  SUSPENDED: 'SUSPENDED' as const
} as const;

export type UserStatus = keyof typeof USER_STATUS;

// Función de validación de roles
export function isValidRole(role: string): role is UserRole {
  return Object.values(ROLES).includes(role as any);
}

// Función para validar y obtener un rol seguro
export function getValidRole(role: string, defaultRole: UserRole = 'USER'): UserRole {
  return isValidRole(role) ? role : defaultRole;
}

// UserContext interface for dynamic user context injection
export interface UserContext {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  currentTime: Date;
  timezone?: string;
}

export const ALL_PERMISSIONS = [
  'admin:all',
  'dashboard:read',
  'appointments:read',
  'appointments:write',
  'appointments:delete',
  'patients:read',
  'patients:write',
  'patients:delete',
  'companies:read',
  'companies:write',
  'settings:read',
  'settings:write',
  'finance:read',
  'finance:write',
  'finance:admin', // Para ver montos totales y estadísticas
  'finance:receipts', // Para generar comprobantes
  'finance:download', // Para descargar comprobantes existentes
  'affiliations:read',
  'affiliations:write',
  'medical_history:read',
  'medical_history:write',
  'lab_results:read',
  'lab_results:write',
  'reports:read',
  'reports:write',
  'reports:delete',
  'users:read',
  'users:write',
  'users:delete',
  'own_data:read',
  'own_data:write',
  'billing:read',
  'billing:write',
] as const;
export type Permission = (typeof ALL_PERMISSIONS)[number];

// Define role permissions
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'admin:all',
    'dashboard:read',
    'appointments:read',
    'appointments:write',
    'appointments:delete',
    'patients:read',
    'patients:write',
    'patients:delete',
    'medical_history:read',
    'medical_history:write',
    'lab_results:read',
    'lab_results:write',
    'reports:read',
    'reports:write',
    'reports:delete',
    'users:read',
    'users:write',
    'users:delete',
    'settings:read',
    'settings:write',
    'billing:read',
    'billing:write',
    'affiliations:read',
    'affiliations:write',
    'medical_history:read',
  ],
  [ROLES.DOCTOR]: [
    'dashboard:read',
    'appointments:read',
    'patients:read',
    'medical_history:read',
    'lab_results:read',
    'reports:read',
    'reports:write',
    'own_data:read',
    'own_data:write',
  ],
  [ROLES.SECRETARIA]: [
    'dashboard:read',
    'appointments:read',
    'appointments:write',
    'appointments:delete',
    'patients:read',
    'patients:write',
    'medical_history:read',
    'lab_results:read',
    'reports:read',
    'reports:write',
    'billing:read',
    'billing:write',
    'affiliations:read',
    'affiliations:write',
    'own_data:read',
    'own_data:write',
  ],
  [ROLES.USER]: [
    'appointments:read',
    'appointments:write',
    'medical_history:read',
    'lab_results:read',
    'reports:read',
    'own_data:read',
    'own_data:write',
  ],
  [ROLES.PROMOTORA]: [
    'dashboard:read',
    'affiliations:read',
    'own_data:read',
    'own_data:write',
  ],
};

export interface Patient {
  id: string;
  name: string;
  nombre?: string;  // Adding this line to support both name and nombre
  cedula: string;
  age: number;
  fechaNacimiento?: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  bloodType: string;
  status: 'Activo' | 'Inactivo';
  lastVisit?: string;
  contact: {
    phone: string;
    email: string;
  };
  avatarUrl?: string;
  companyId?: string;
  companyName?: string;
  direccion?: string;
  assignedDoctors?: { id: string; name: string; specialty?: string }[];
  assignedDoctorId?: string;
  assignedDoctorName?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  doctorUserId: string;
  date: string;
  reason: string;
  status: 'Programada' | 'Completada' | 'Cancelada';
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  duration: string;
}

export interface LabResult {
  id: string;
  userId?: string;
  testName: string;
  value: string;
  referenceRange?: string;
  date: string;
  estado?: string;        // PENDIENTE, COMPLETADO, CANCELADO
  doctor?: string;        // Nombre del doctor que solicitó el estudio
  archivoContenido?: string;
  archivoNombre?: string;
  archivoTipo?: string;
  archivoTamaño?: number;
}

export interface ReportAttachment {
  name: string;
  type: string;
  size: number;
  url: string;
  base64Content?: string;
}

export interface Report {
  id: string;
  userId: string;
  title: string;
  date: string;
  type: string;
  notes: string;
  fileUrl: string;
  attachments: ReportAttachment[];
  // Campos para compatibilidad con versiones anteriores
  archivoNombre?: string;
  archivoTipo?: string;
  archivoContenido?: string;
  archivoTamaño?: number;
  // Para datos sin procesar
  rawData?: any;
}

export interface Consultation {
  id: string;
  userId: string;
  date: string;
  doctor: string;
  type: 'Inicial' | 'Seguimiento' | 'Pre-operatorio' | 'Post-operatorio';
  notes: string;
  prescriptions: Prescription[];
  labResults: LabResult[];
  reports: Report[];
}

import { User as PrismaUser } from "@prisma/client"

// Extender el tipo User de Prisma para incluir userId como alias de id
export interface User extends Omit<PrismaUser, 'role' | 'userId'> {
  userId: string;
  role: UserRole;
};

// Helper function para mapear PrismaUser a User
export function mapUserToPatient(user: PrismaUser): User {
  return {
    ...user,
    userId: user.userId || user.id, // Usar userId si existe, de lo contrario usar id
    role: user.role // Ya es del tipo correcto
  };
}

export interface IpssScore {
  id: string;
  userId: string;
  date: string;
  score: number;
  category: 'Leve' | 'Moderado' | 'Severo';
  answers?: Record<string, number>;
  doctorName?: string;
}

export interface Company {
  id: string;
  name: string;
  ruc: string;
  phone?: string;
  email?: string;
  status: 'Activo' | 'Inactivo';
}

export type NewReportFormValues = Omit<
  Report,
  'id' | 'userId' | 'fileUrl'
> & { userId?: string };

export interface Supply {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  expiryDate: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface PaymentType {
  id: string;
  name: string;
  description: string;
  defaultAmount?: number;
}

export interface Payment {
  id: string;
  userId: string;
  doctorId?: string;
  paymentTypeId: string;
  paymentMethodId: string;
  date: string;
  monto: number;
  status: 'Pagado' | 'Pendiente' | 'Anulado';
}

export interface Doctor {
  id: string;
  userId: string;
  nombre: string;
  especialidad: string;
  area: string;
  contacto: string;
  avatarUrl?: string;
}

export interface Estudio {
  id: string;
  categoria: string;
  nombre: string;
}

export interface Affiliation {
  id: string;
  planId: string;
  tipoPago?: string;
  estado: string;
  fechaInicio: string;
  fechaFin?: string | null;
  monto: number;
  beneficiarios?: any;
  companyId?: string | null;
  userId: string;
  createdAt: string;
  company?: {
    id: string;
    nombre: string;
    rif: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    contacto?: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    createdAt: string;
    phone?: string | null;
    lastLogin?: string | null;
    userId?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface AffiliateLead {
  fullName: string;
  documentId: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  planId: 'tarjeta-saludable' | 'fondo-espiritu-santo';
  paymentMode: 'contado' | 'credito';
  paymentMethod: string;
  schedule?: { upfront: number; installments: number; installmentValue: number; frequencyDays: number; };
}
