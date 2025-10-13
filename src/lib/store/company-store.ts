import { create } from 'zustand';
import type { Company } from '@/lib/types';

interface CompanyState {
  companies: Company[];
  isInitialized: boolean;
  setCompanies: (companies: Company[]) => void;
  addCompany: (company: Company) => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  isInitialized: false,
  setCompanies: (companies) => set({ companies, isInitialized: true }),
  addCompany: (company) => set((state) => ({
    companies: [company, ...state.companies]
  })),
}));
