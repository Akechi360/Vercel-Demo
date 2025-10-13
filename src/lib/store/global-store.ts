import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useCallback } from 'react';
import type { Patient, Company, User, Appointment, Payment, Affiliation } from '@/lib/types';

// ===== TIPOS DEL STORE GLOBAL =====
interface GlobalState {
  // === DATOS PRINCIPALES ===
  patients: Patient[];
  companies: Company[];
  users: User[];
  appointments: Appointment[];
  payments: Payment[];
  affiliations: Affiliation[];
  
  // === ESTADO DE CARGA ===
  loading: {
    patients: boolean;
    companies: boolean;
    users: boolean;
    appointments: boolean;
    payments: boolean;
    affiliations: boolean;
  };
  
  // === ERRORES ===
  errors: {
    patients: string | null;
    companies: string | null;
    users: string | null;
    appointments: string | null;
    payments: string | null;
    affiliations: string | null;
  };
  
  // === TIMESTAMPS DE CACHE ===
  lastFetch: {
    patients: number;
    companies: number;
    users: number;
    appointments: number;
    payments: number;
    affiliations: number;
  };
  
  // === CONFIGURACIÓN DE CACHE ===
  cacheConfig: {
    duration: number; // 5 minutos por defecto
    autoRefresh: boolean;
  };
  
  // === ACCIONES PRINCIPALES ===
  setPatients: (patients: Patient[]) => void;
  setCompanies: (companies: Company[]) => void;
  setUsers: (users: User[]) => void;
  setAppointments: (appointments: Appointment[]) => void;
  setPayments: (payments: Payment[]) => void;
  setAffiliations: (affiliations: Affiliation[]) => void;
  
  // === ACCIONES DE ACTUALIZACIÓN ===
  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  removePatient: (patientId: string) => void;
  
  addCompany: (company: Company) => void;
  updateCompany: (company: Company) => void;
  removeCompany: (companyId: string) => void;
  
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  removeUser: (userId: string) => void;
  
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  removeAppointment: (appointmentId: string) => void;
  
  addPayment: (payment: Payment) => void;
  updatePayment: (payment: Payment) => void;
  removePayment: (paymentId: string) => void;
  
  addAffiliation: (affiliation: Affiliation) => void;
  updateAffiliation: (affiliation: Affiliation) => void;
  removeAffiliation: (affiliationId: string) => void;
  
  // === GESTIÓN DE CACHE ===
  setLoading: (key: keyof GlobalState['loading'], loading: boolean) => void;
  setError: (key: keyof GlobalState['errors'], error: string | null) => void;
  updateLastFetch: (key: keyof GlobalState['lastFetch']) => void;
  
  // === UTILIDADES DE CACHE ===
  isDataFresh: (key: keyof GlobalState['lastFetch']) => boolean;
  clearCache: (key?: keyof GlobalState['lastFetch']) => void;
  refreshData: (key: keyof GlobalState['lastFetch']) => Promise<void>;
  
  // === CONFIGURACIÓN ===
  setCacheConfig: (config: Partial<GlobalState['cacheConfig']>) => void;
}

// ===== CONFIGURACIÓN INICIAL =====
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const initialState = {
  // Datos
  patients: [],
  companies: [],
  users: [],
  appointments: [],
  payments: [],
  affiliations: [],
  
  // Estado de carga
  loading: {
    patients: false,
    companies: false,
    users: false,
    appointments: false,
    payments: false,
    affiliations: false,
  },
  
  // Errores
  errors: {
    patients: null,
    companies: null,
    users: null,
    appointments: null,
    payments: null,
    affiliations: null,
  },
  
  // Timestamps
  lastFetch: {
    patients: 0,
    companies: 0,
    users: 0,
    appointments: 0,
    payments: 0,
    affiliations: 0,
  },
  
  // Configuración
  cacheConfig: {
    duration: CACHE_DURATION,
    autoRefresh: true,
  },
};

// ===== STORE GLOBAL UNIFICADO =====
export const useGlobalStore = create<GlobalState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // === SETTERS PRINCIPALES ===
    setPatients: (patients) => {
      set({ 
        patients,
        lastFetch: { ...get().lastFetch, patients: Date.now() },
        loading: { ...get().loading, patients: false },
        errors: { ...get().errors, patients: null }
      });
    },
    
    setCompanies: (companies) => {
      set({ 
        companies,
        lastFetch: { ...get().lastFetch, companies: Date.now() },
        loading: { ...get().loading, companies: false },
        errors: { ...get().errors, companies: null }
      });
    },
    
    setUsers: (users) => {
      set({ 
        users,
        lastFetch: { ...get().lastFetch, users: Date.now() },
        loading: { ...get().loading, users: false },
        errors: { ...get().errors, users: null }
      });
    },
    
    setAppointments: (appointments) => {
      set({ 
        appointments,
        lastFetch: { ...get().lastFetch, appointments: Date.now() },
        loading: { ...get().loading, appointments: false },
        errors: { ...get().errors, appointments: null }
      });
    },
    
    setPayments: (payments) => {
      set({ 
        payments,
        lastFetch: { ...get().lastFetch, payments: Date.now() },
        loading: { ...get().loading, payments: false },
        errors: { ...get().errors, payments: null }
      });
    },
    
    setAffiliations: (affiliations) => {
      set({ 
        affiliations,
        lastFetch: { ...get().lastFetch, affiliations: Date.now() },
        loading: { ...get().loading, affiliations: false },
        errors: { ...get().errors, affiliations: null }
      });
    },
    
    // === ACCIONES DE ACTUALIZACIÓN ===
    addPatient: (patient) => set((state) => ({
      patients: [patient, ...state.patients]
    })),
    
    updatePatient: (updatedPatient) => set((state) => ({
      patients: state.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p)
    })),
    
    removePatient: (patientId) => set((state) => ({
      patients: state.patients.filter(p => p.id !== patientId)
    })),
    
    addCompany: (company) => set((state) => ({
      companies: [company, ...state.companies]
    })),
    
    updateCompany: (updatedCompany) => set((state) => ({
      companies: state.companies.map(c => c.id === updatedCompany.id ? updatedCompany : c)
    })),
    
    removeCompany: (companyId) => set((state) => ({
      companies: state.companies.filter(c => c.id !== companyId)
    })),
    
    addUser: (user) => set((state) => ({
      users: [user, ...state.users]
    })),
    
    updateUser: (updatedUser) => set((state) => ({
      users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
    })),
    
    removeUser: (userId) => set((state) => ({
      users: state.users.filter(u => u.id !== userId)
    })),
    
    addAppointment: (appointment) => set((state) => ({
      appointments: [appointment, ...state.appointments]
    })),
    
    updateAppointment: (updatedAppointment) => set((state) => ({
      appointments: state.appointments.map(a => a.id === updatedAppointment.id ? updatedAppointment : a)
    })),
    
    removeAppointment: (appointmentId) => set((state) => ({
      appointments: state.appointments.filter(a => a.id !== appointmentId)
    })),
    
    addPayment: (payment) => set((state) => ({
      payments: [payment, ...state.payments]
    })),
    
    updatePayment: (updatedPayment) => set((state) => ({
      payments: state.payments.map(p => p.id === updatedPayment.id ? updatedPayment : p)
    })),
    
    removePayment: (paymentId) => set((state) => ({
      payments: state.payments.filter(p => p.id !== paymentId)
    })),
    
    addAffiliation: (affiliation) => set((state) => ({
      affiliations: [affiliation, ...state.affiliations]
    })),
    
    updateAffiliation: (updatedAffiliation) => set((state) => ({
      affiliations: state.affiliations.map(a => a.id === updatedAffiliation.id ? updatedAffiliation : a)
    })),
    
    removeAffiliation: (affiliationId) => set((state) => ({
      affiliations: state.affiliations.filter(a => a.id !== affiliationId)
    })),
    
    // === GESTIÓN DE CACHE ===
    setLoading: (key, loading) => set((state) => ({
      loading: { ...state.loading, [key]: loading }
    })),
    
    setError: (key, error) => set((state) => ({
      errors: { ...state.errors, [key]: error }
    })),
    
    updateLastFetch: (key) => set((state) => ({
      lastFetch: { ...state.lastFetch, [key]: Date.now() }
    })),
    
    // === UTILIDADES DE CACHE ===
    isDataFresh: (key) => {
      const { lastFetch, cacheConfig } = get();
      return Date.now() - lastFetch[key] < cacheConfig.duration;
    },
    
    clearCache: (key) => {
      if (key) {
        set((state) => ({
          lastFetch: { ...state.lastFetch, [key]: 0 }
        }));
      } else {
        set({
          lastFetch: {
            patients: 0,
            companies: 0,
            users: 0,
            appointments: 0,
            payments: 0,
            affiliations: 0,
          }
        });
      }
    },
    
    refreshData: async (key) => {
      const { setLoading, setError, updateLastFetch } = get();
      
      setLoading(key, true);
      setError(key, null);
      
      try {
        // Importar dinámicamente las funciones de actions
        const { 
          getPatients, 
          getCompanies, 
          getUsers, 
          getAppointments, 
          getPayments, 
          getAffiliations 
        } = await import('@/lib/actions');
        
        let data;
        switch (key) {
          case 'patients':
            data = await getPatients();
            get().setPatients(data);
            break;
          case 'companies':
            data = await getCompanies();
            get().setCompanies(data);
            break;
          case 'users':
            const usersResult = await getUsers();
            data = usersResult.users;
            get().setUsers(data);
            break;
          case 'appointments':
            data = await getAppointments();
            get().setAppointments(data);
            break;
          case 'payments':
            data = await getPayments();
            get().setPayments(data);
            break;
          case 'affiliations':
            data = await getAffiliations();
            get().setAffiliations(data);
            break;
        }
        
        updateLastFetch(key);
        console.log(`✅ Refreshed ${key} data`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setError(key, errorMessage);
        console.error(`❌ Error refreshing ${key}:`, error);
      } finally {
        setLoading(key, false);
      }
    },
    
    // === CONFIGURACIÓN ===
    setCacheConfig: (config) => set((state) => ({
      cacheConfig: { ...state.cacheConfig, ...config }
    })),
  }))
);

// ===== HOOKS ESPECIALIZADOS =====
export const usePatients = () => {
  const store = useGlobalStore();
  const refresh = useCallback(() => store.refreshData('patients'), [store]);
  
  return {
    patients: store.patients,
    loading: store.loading.patients,
    error: store.errors.patients,
    isFresh: store.isDataFresh('patients'),
    refresh,
    setPatients: store.setPatients,
    addPatient: store.addPatient,
    updatePatient: store.updatePatient,
    removePatient: store.removePatient,
  };
};

export const useCompanies = () => {
  const store = useGlobalStore();
  const refresh = useCallback(() => store.refreshData('companies'), [store]);
  
  return {
    companies: store.companies,
    loading: store.loading.companies,
    error: store.errors.companies,
    isFresh: store.isDataFresh('companies'),
    refresh,
    setCompanies: store.setCompanies,
    addCompany: store.addCompany,
    updateCompany: store.updateCompany,
    removeCompany: store.removeCompany,
  };
};

export const useUsers = () => {
  const store = useGlobalStore();
  const refresh = useCallback(() => store.refreshData('users'), [store]);
  
  return {
    users: store.users,
    loading: store.loading.users,
    error: store.errors.users,
    isFresh: store.isDataFresh('users'),
    refresh,
    setUsers: store.setUsers,
    addUser: store.addUser,
    updateUser: store.updateUser,
    removeUser: store.removeUser,
  };
};

export const useAppointments = () => {
  const store = useGlobalStore();
  const refresh = useCallback(() => store.refreshData('appointments'), [store]);
  
  return {
    appointments: store.appointments,
    loading: store.loading.appointments,
    error: store.errors.appointments,
    isFresh: store.isDataFresh('appointments'),
    refresh,
    addAppointment: store.addAppointment,
    updateAppointment: store.updateAppointment,
    removeAppointment: store.removeAppointment,
  };
};

export const usePayments = () => {
  const store = useGlobalStore();
  const refresh = useCallback(() => store.refreshData('payments'), [store]);
  
  return {
    payments: store.payments,
    loading: store.loading.payments,
    error: store.errors.payments,
    isFresh: store.isDataFresh('payments'),
    refresh,
    addPayment: store.addPayment,
    updatePayment: store.updatePayment,
    removePayment: store.removePayment,
  };
};

export const useAffiliations = () => {
  const store = useGlobalStore();
  const refresh = useCallback(() => store.refreshData('affiliations'), [store]);
  
  return {
    affiliations: store.affiliations,
    loading: store.loading.affiliations,
    error: store.errors.affiliations,
    isFresh: store.isDataFresh('affiliations'),
    refresh,
    addAffiliation: store.addAffiliation,
    updateAffiliation: store.updateAffiliation,
    removeAffiliation: store.removeAffiliation,
  };
};

// ===== SISTEMA DE EVENTOS GLOBALES =====
export const globalEventBus = {
  // Eventos de actualización
  emitPatientUpdate: (patient: Patient) => {
    const store = useGlobalStore.getState();
    store.updatePatient(patient);
    window.dispatchEvent(new CustomEvent('patientUpdated', { detail: patient }));
  },
  
  emitPatientDeleted: (patientId: string) => {
    const store = useGlobalStore.getState();
    store.removePatient(patientId);
    window.dispatchEvent(new CustomEvent('patientDeleted', { detail: { patientId } }));
  },
  
  emitCompanyUpdate: (company: Company) => {
    const store = useGlobalStore.getState();
    store.updateCompany(company);
    window.dispatchEvent(new CustomEvent('companyUpdated', { detail: company }));
  },
  
  emitUserUpdate: (user: User) => {
    const store = useGlobalStore.getState();
    store.updateUser(user);
    window.dispatchEvent(new CustomEvent('userUpdated', { detail: user }));
  },
  
  emitAppointmentUpdate: (appointment: Appointment) => {
    const store = useGlobalStore.getState();
    store.updateAppointment(appointment);
    window.dispatchEvent(new CustomEvent('appointmentUpdated', { detail: appointment }));
  },
  
  emitPaymentUpdate: (payment: Payment) => {
    const store = useGlobalStore.getState();
    store.updatePayment(payment);
    window.dispatchEvent(new CustomEvent('paymentUpdated', { detail: payment }));
  },
  
  emitAffiliationUpdate: (affiliation: Affiliation) => {
    const store = useGlobalStore.getState();
    store.updateAffiliation(affiliation);
    window.dispatchEvent(new CustomEvent('affiliationUpdated', { detail: affiliation }));
  },
  
  // Eventos de invalidación de cache
  emitCacheInvalidation: (keys: (keyof GlobalState['lastFetch'])[]) => {
    const store = useGlobalStore.getState();
    keys.forEach(key => store.clearCache(key));
    window.dispatchEvent(new CustomEvent('cacheInvalidated', { detail: { keys } }));
  },
  
  // Evento de refresco global
  emitGlobalRefresh: () => {
    const store = useGlobalStore.getState();
    store.clearCache();
    window.dispatchEvent(new CustomEvent('globalRefresh'));
  }
};

// ===== LISTENERS GLOBALES =====
if (typeof window !== 'undefined') {
  // Escuchar eventos de actualización
  window.addEventListener('patientUpdated', (e: any) => {
    const store = useGlobalStore.getState();
    store.updatePatient(e.detail);
  });
  
  window.addEventListener('patientDeleted', (e: any) => {
    const store = useGlobalStore.getState();
    store.removePatient(e.detail.patientId);
  });
  
  window.addEventListener('companyUpdated', (e: any) => {
    const store = useGlobalStore.getState();
    store.updateCompany(e.detail);
  });
  
  window.addEventListener('userUpdated', (e: any) => {
    const store = useGlobalStore.getState();
    store.updateUser(e.detail);
  });
  
  window.addEventListener('appointmentUpdated', (e: any) => {
    const store = useGlobalStore.getState();
    store.updateAppointment(e.detail);
  });
  
  window.addEventListener('paymentUpdated', (e: any) => {
    const store = useGlobalStore.getState();
    store.updatePayment(e.detail);
  });
  
  window.addEventListener('affiliationUpdated', (e: any) => {
    const store = useGlobalStore.getState();
    store.updateAffiliation(e.detail);
  });
  
  // Escuchar eventos de invalidación
  window.addEventListener('cacheInvalidated', (e: any) => {
    const store = useGlobalStore.getState();
    e.detail.keys.forEach((key: keyof GlobalState['lastFetch']) => {
      store.clearCache(key);
    });
  });
  
  // Escuchar refresco global
  window.addEventListener('globalRefresh', () => {
    const store = useGlobalStore.getState();
    store.clearCache();
  });
}
