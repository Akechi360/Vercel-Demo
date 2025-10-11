import { create } from 'zustand';
import type { Provider } from '@/lib/types';

interface ProviderState {
  providers: Provider[];
  isInitialized: boolean;
  setProviders: (providers: Provider[]) => void;
  addProvider: (provider: Provider) => void;
}

export const useProviderStore = create<ProviderState>((set) => ({
  providers: [],
  isInitialized: false,
  setProviders: (providers) => set({ providers, isInitialized: true }),
  addProvider: (provider) => set((state) => ({
    providers: [provider, ...state.providers]
  })),
}));
