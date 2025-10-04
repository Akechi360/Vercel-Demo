import { create } from 'zustand';
import type { Supply } from '@/lib/types';

interface SupplyState {
  supplies: Supply[];
  isInitialized: boolean;
  setSupplies: (supplies: Supply[]) => void;
  addSupply: (supply: Supply) => void;
}

export const useSupplyStore = create<SupplyState>((set) => ({
  supplies: [],
  isInitialized: false,
  setSupplies: (supplies) => set({ supplies, isInitialized: true }),
  addSupply: (supply) => set((state) => ({
    supplies: [supply, ...state.supplies]
  })),
}));
