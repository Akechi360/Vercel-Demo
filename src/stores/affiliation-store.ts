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
  addAffiliation: (affiliation: any) => void;
  updateAffiliationInStore: (id: string, updates: any) => void;
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
      const [companiesData, usersResult] = await Promise.all([
        getCompanies(),
        getUsers()
      ]);

      // Extraer el array de usuarios del objeto paginado
      const usersData = usersResult.users;

      set({
        companies: companiesData,
        users: usersData,
        loading: false,
        error: null,
        lastFetch: Date.now()
      });

      console.log(`✅ Loaded ${companiesData.length} companies and ${usersData.length} users`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar los datos';
      console.error('❌ Error loading affiliation data:', error);
      set({
        loading: false,
        error: errorMessage,
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
  },

  addAffiliation: (affiliation: any) => {
    // Esta función se puede usar para agregar una nueva afiliación al estado local
    // si es necesario, pero por ahora no la usaremos ya que las afiliaciones
    // se manejan en el componente principal
    console.log('📝 New affiliation added to store:', affiliation);
  },

  updateAffiliationInStore: (id: string, updates: any) => {
    // Esta función actualiza una afiliación en el estado local
    // para reflejar cambios inmediatamente sin recargar la página
    console.log('🔄 Updating affiliation in store:', id, updates);
    
    // Nota: Esta función es principalmente para logging y preparación
    // La actualización real de la UI se maneja en el componente padre
    // que recibe los datos actualizados del servidor
  }
}));
