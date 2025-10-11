import { useState, useEffect, useCallback } from 'react';
import { getCompanies, getUsers } from '@/lib/actions';

// Cache global para evitar recargas innecesarias
let companiesCache: any[] | null = null;
let usersCache: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useCachedData() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const now = Date.now();
    
    // Si tenemos cache válido, usarlo inmediatamente
    if (companiesCache && usersCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('⚡ Using cached data (instant load) - Companies:', companiesCache.length, 'Users:', usersCache.length);
      setCompanies(companiesCache);
      setUsers(usersCache);
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Loading fresh data...');
      setLoading(true);
      setError(null);

      const [companiesData, usersResult] = await Promise.all([
        getCompanies(),
        getUsers()
      ]);

      // Extraer el array de usuarios del objeto paginado
      const usersData = usersResult.users;

      // Actualizar cache
      companiesCache = companiesData;
      usersCache = usersData;
      cacheTimestamp = now;

      setCompanies(companiesData);
      setUsers(usersData);
      console.log(`✅ Loaded ${companiesData.length} companies and ${usersData.length} users`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los datos';
      console.error('❌ Error loading data:', err);
      setError(errorMessage);
      setCompanies([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    // Limpiar cache para forzar recarga
    companiesCache = null;
    usersCache = null;
    cacheTimestamp = 0;
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    companies,
    users,
    loading,
    error,
    refreshData
  };
}
