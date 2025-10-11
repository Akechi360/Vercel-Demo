import { create } from 'zustand';
import type { Patient } from '@/lib/types';

interface PatientState {
  patients: Patient[];
  isInitialized: boolean;
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  removePatient: (patientId: string) => void;
}

export const usePatientStore = create<PatientState>((set) => ({
  patients: [],
  isInitialized: false,
  setPatients: (patients) => set({ patients, isInitialized: true }),
  addPatient: (patient) => set((state) => ({
    patients: [patient, ...state.patients]
  })),
  updatePatient: (updatedPatient) => set((state) => ({
    patients: state.patients.map((p) => p.id === updatedPatient.id ? updatedPatient : p)
  })),
  removePatient: (patientId) => set((state) => ({
    patients: state.patients.filter((p) => p.id !== patientId)
  })),
}));
