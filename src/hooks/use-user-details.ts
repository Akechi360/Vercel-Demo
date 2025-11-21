import { useState, useCallback } from 'react';
import { getUserDetails } from '@/lib/actions';

interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone: string | null;
  lastLogin: Date | null;
  patientId: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient?: {
    id: string;
    nombre: string;
    apellido: string;
    cedula: string;
    fechaNacimiento: Date;
    telefono: string | null;
    direccion: string | null;
  } | null;
  payments?: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
    paymentMethod: string;
  }>;
  appointments?: Array<{
    id: string;
    date: Date;
    status: string;
    type: string;
    createdAt: Date;
  }>;
  doctorInfo?: {
    especialidad: string | null;
    area: string | null;
    cedula: string | null;
    telefono: string | null;
  } | null;
}

interface UseUserDetailsReturn {
  userDetails: UserDetails | null;
  isLoading: boolean;
  error: string | null;
  loadUserDetails: (userId: string) => Promise<UserDetails | null>;
  clearUserDetails: () => void;
}

export function useUserDetails(): UseUserDetailsReturn {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserDetails = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔄 Loading user details for: ${userId}`);

      const details = await getUserDetails(userId);

      if (details) {
        setUserDetails(details);
        console.log(`✅ User details loaded successfully for: ${userId}`);
        return details;
      } else {
        setError('Usuario no encontrado');
        console.log(`❌ User not found: ${userId}`);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar detalles del usuario';
      setError(errorMessage);
      console.error('❌ Error loading user details:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearUserDetails = useCallback(() => {
    setUserDetails(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    userDetails,
    isLoading,
    error,
    loadUserDetails,
    clearUserDetails,
  };
}
