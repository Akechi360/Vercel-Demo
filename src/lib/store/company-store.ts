import { create } from 'zustand';
import type { Company } from '@/lib/types';

type CompanyWithPatientCount = Company & { patientCount: number };

interface CompanyState {
  companies: CompanyWithPatientCount[];
  isInitialized: boolean;
  setCompanies: (companies: CompanyWithPatientCount[]) => void;
  addCompany: (company: CompanyWithPatientCount) => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  isInitialized: false,
  setCompanies: (companies) => set({ companies, isInitialized: true }),
  addCompany: (company) => set((state) => ({
    companies: [company, ...state.companies]
  })),
}));
