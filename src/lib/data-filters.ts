'use server';

import { User } from './types';

// Función para filtrar pacientes según el rol del usuario
export function filterPatientsByRole(patients: any[], user: User): any[] {
  if (!user) return [];
  
  switch (user.role) {
    case 'admin':
      // Admin ve todos los pacientes
      return patients;
    
    case 'doctor':
      // Doctor ve solo los pacientes que ha atendido
      // Por ahora retornamos todos, pero esto se puede mejorar con relaciones
      return patients;
    
    case 'patient':
      // Paciente ve solo su propia información
      return patients.filter(patient => patient.id === user.userId);
    
    case 'secretaria':
      // Secretaria ve todos los pacientes
      return patients;
    
    case 'promotora':
      // Promotora no ve pacientes
      return [];
    
    default:
      return [];
  }
}

// Función para filtrar citas según el rol del usuario
export function filterAppointmentsByRole(appointments: any[], user: User): any[] {
  if (!user) return [];
  
  switch (user.role) {
    case 'admin':
      // Admin ve todas las citas
      return appointments;
    
    case 'doctor':
      // Doctor ve solo sus citas
      return appointments.filter(appointment => appointment.doctorId === user.id);
    
    case 'patient':
      // Paciente ve solo sus citas
      return appointments.filter(appointment => appointment.userId === user.userId);
    
    case 'secretaria':
      // Secretaria ve todas las citas
      return appointments;
    
    case 'promotora':
      // Promotora no ve citas
      return [];
    
    default:
      return [];
  }
}

// Función para filtrar empresas según el rol del usuario
export function filterCompaniesByRole(companies: any[], user: User): any[] {
  if (!user) return [];
  
  switch (user.role) {
    case 'admin':
      // Admin ve todas las empresas
      return companies;
    
    case 'doctor':
      // Doctor no ve empresas
      return [];
    
    case 'patient':
      // Paciente no ve empresas
      return [];
    
    case 'secretaria':
      // Secretaria ve todas las empresas
      return companies;
    
    case 'promotora':
      // Promotora no ve empresas
      return [];
    
    default:
      return [];
  }
}

// Función para filtrar pagos según el rol del usuario
export function filterPaymentsByRole(payments: any[], user: User): any[] {
  if (!user) return [];
  
  switch (user.role) {
    case 'admin':
      // Admin ve todos los pagos
      return payments;
    
    case 'doctor':
      // Doctor no ve pagos
      return [];
    
    case 'patient':
      // Paciente ve solo sus pagos
      return payments.filter(payment => payment.userId === user.userId);
    
    case 'secretaria':
      // Secretaria ve todos los pagos
      return payments;
    
    case 'promotora':
      // Promotora no ve pagos
      return [];
    
    default:
      return [];
  }
}

// Función para filtrar afiliaciones según el rol del usuario
export function filterAffiliationsByRole(affiliations: any[], user: User): any[] {
  if (!user) return [];
  
  switch (user.role) {
    case 'admin':
      // Admin ve todas las afiliaciones
      return affiliations;
    
    case 'doctor':
      // Doctor no ve afiliaciones
      return [];
    
    case 'patient':
      // Paciente no ve afiliaciones
      return [];
    
    case 'secretaria':
      // Secretaria no ve afiliaciones
      return [];
    
    case 'promotora':
      // Promotora ve solo sus afiliaciones
      return affiliations.filter(affiliation => affiliation.promotoraId === user.id);
    
    default:
      return [];
  }
}

// Función para filtrar historias médicas según el rol del usuario
export function filterMedicalHistoryByRole(history: any[], user: User): any[] {
  if (!user) return [];
  
  switch (user.role) {
    case 'admin':
      // Admin ve todas las historias
      return history;
    
    case 'doctor':
      // Doctor ve las historias de sus pacientes
      return history;
    
    case 'patient':
      // Paciente ve solo su historia médica
      return history.filter(record => record.userId === user.userId);
    
    case 'secretaria':
      // Secretaria ve todas las historias
      return history;
    
    case 'promotora':
      // Promotora no ve historias médicas
      return [];
    
    default:
      return [];
  }
}
