import { create } from 'zustand';
import { getCompanies, getUsers } from '@/lib/actions';

interface AffiliationData {
  companies: any[];
  users: any[];
  loading: boolean;
  error: string | null;
  lastFetch: number;
}

interface AffiliationStore extends AffiliationData {
  loadData: () => Promise<void>;
  clearCache: () => void;
  isDataFresh: () => boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useAffiliationStore = create<AffiliationStore>((set, get) => ({
  companies: [],
  users: [],
  loading: false,
  error: null,
  lastFetch: 0,

  isDataFresh: () => {
    const { lastFetch } = get();
    return Date.now() - lastFetch < CACHE_DURATION;
  },

  loadData: async () => {
    const { isDataFresh, companies, users } = get();
    
    // Si ya tenemos datos frescos, no hacer nada
    if (isDataFresh() && companies.length > 0 && users.length > 0) {
      console.log('⚡ Using fresh cached data - Companies:', companies.length, 'Users:', users.length);
      return;
    }

    set({ loading: true, error: null });

    try {
      console.log('🔄 Loading fresh data in parallel...');
      
      // Ejecutar todas las llamadas en paralelo
      const [companiesData, usersData] = await Promise.all([
        getCompanies(),
        getUsers()
      ]);

      set({
        companies: companiesData,
        users: usersData,
        loading: false,
        error: null,
        lastFetch: Date.now()
      });

      console.log(`✅ Loaded ${companiesData.length} companies and ${usersData.length} users`);
    } catch (error) {
      console.error('❌ Error loading affiliation data:', error);
      set({
        loading: false,
        error: 'Error al cargar los datos',
        companies: [],
        users: []
      });
    }
  },

  clearCache: () => {
    set({
      companies: [],
      users: [],
      loading: false,
      error: null,
      lastFetch: 0
    });
  }
}));
