import useSWR from 'swr';
import { useAuth } from '@/components/layout/auth-provider';

interface UserStatus {
  id: string;
  role: string;
  status: string;
  patientId: string | null;
}

interface UseUserStatusReturn {
  userStatus: UserStatus | null;
  isLoading: boolean;
  error: any;
  mutate: () => void;
}

const fetcher = async (url: string): Promise<UserStatus> => {
  console.log('🧪 Test SWR fetcher called with URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('🧪 Test fetch response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Test fetch failed:', response.status, errorData);
      throw new Error(`Test fetch failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('✅ Test SWR fetcher success:', data);
    return data;
  } catch (error) {
    console.error('❌ Test SWR fetcher error:', error);
    throw error;
  }
};

export function useUserStatusTest(): UseUserStatusReturn {
  const { currentUser, isAuthenticated } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated && currentUser ? `/api/user/status/test?userId=${currentUser.id}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true, // Revalidate when window gains focus
      revalidateOnReconnect: true, // Revalidate when network reconnects
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
      errorRetryCount: 3, // Retry failed requests 3 times
      errorRetryInterval: 5000, // Wait 5 seconds between retries
    }
  );

  return {
    userStatus: data || null,
    isLoading,
    error,
    mutate,
  };
}
