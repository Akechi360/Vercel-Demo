export const ALL_PERMISSIONS = [
  'admin:all',
  'dashboard:read',
  'appointments:read',
  'appointments:write',
  'patients:read',
  'patients:write',
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
  'own_data:read',
  'own_data:write',
] as const;
export type Permission = (typeof ALL_PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<User['role'], Permission[]> = {
  admin: [
    'admin:all',
    'dashboard:read',
    'appointments:read',
    'appointments:write',
    'patients:read',
    'patients:write',
    'companies:read',
    'companies:write',
    'settings:read',
    'settings:write',
    'finance:read',
    'finance:write',
    'finance:admin',
    'finance:receipts',
    'finance:download',
    'affiliations:read',
    'affiliations:write',
    'medical_history:read',
  ],
  doctor: [
    'dashboard:read',
    'appointments:read',
    'patients:read',
    'patients:write',
    'medical_history:read',
    'own_data:read',
    'own_data:write',
  ],
  secretaria: [
    'dashboard:read',
    'appointments:read',
    'appointments:write',
    'patients:read',
    'patients:write',
    'companies:read',
    'companies:write',
    'finance:read',
    'finance:receipts',
    'finance:download',
    'own_data:read',
    'own_data:write',
  ],
  patient: [
    'appointments:read',
    'appointments:write',
    'medical_history:read',
    'finance:read',
    'finance:download',
    'own_data:read',
    'own_data:write',
  ],
  promotora: [
    'dashboard:read',
    'affiliations:read',
    'own_data:read',
    'own_data:write',
  ],
};

export interface Patient {
  id: string;
  name: string;
  age: number;
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
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
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
  patientId?: string;
  testName: string;
  value: string;
  referenceRange?: string;
  date: string;
}

export interface Report {
  id: string;
  patientId: string;
  title: string;
  date: string;
  type: string;
  notes: string;
  fileUrl: string;
  attachments: string[];
}

export interface Consultation {
  id: string;
  patientId: string;
  date: string;
  doctor: string;
  type: 'Inicial' | 'Seguimiento' | 'Pre-operatorio' | 'Post-operatorio';
  notes: string;
  prescriptions: Prescription[];
  labResults: LabResult[];
  reports: Report[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'patient' | 'admin' | 'secretaria' | 'promotora' | 'USER';
  patientId?: string;
}

export interface IpssScore {
  id: string;
  patientId: string;
  date: string;
  score: number;
  category: 'Leve' | 'Moderado' | 'Severo';
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
  'id' | 'patientId' | 'fileUrl'
> & { patientId?: string };

export interface Supply {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  expiryDate: string;
}

export interface Provider {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
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
    patientId: string;
    doctorId?: string;
    paymentTypeId: string;
    paymentMethodId: string;
    date: string;
    monto: number;
    status: 'Pagado' | 'Pendiente' | 'Anulado';
}

export interface Doctor {
  id: string;
  nombre: string;
  especialidad: string;
  area: string;
  contacto: string;
}

export interface Estudio {
  id: string;
  categoria: string;
  nombre: string;
}

export interface Affiliation {
    id: string;
    promotora: string;
    afiliados: number;
    ultimaAfiliacion: string;
    estado: string;
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
