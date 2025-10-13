import useSWR from 'swr';
import { useAuth } from '@/components/layout/auth-provider';

interface UserStatus {
  id: string;
  role: string;
  status: string;
  userId: string | null;
}

interface UseUserStatusReturn {
  userStatus: UserStatus | null;
  isLoading: boolean;
  error: any;
  mutate: () => void;
}

const fetcher = async (url: string): Promise<UserStatus> => {
  console.log('🔍 SWR fetcher called with URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('🔍 Fetch response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Fetch failed:', response.status, errorData);
      
      // Handle 404 specifically - user not found
      if (response.status === 404) {
        throw new Error(`User not found: ${errorData.error || 'User does not exist in database'}`);
      }
      
      throw new Error(`Failed to fetch user status: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('✅ SWR fetcher success:', data);
    return data;
  } catch (error) {
    console.error('❌ SWR fetcher error:', error);
    throw error;
  }
};

export function useUserStatus(userId?: string): UseUserStatusReturn {
  const { currentUser, isAuthenticated, loading } = useAuth();
  
  // Use provided userId or fallback to currentUser.id
  const targetUserId = userId || currentUser?.id;
  const shouldFetch = isAuthenticated && targetUserId && !loading;
  
  console.log('🔍 useUserStatus called with:', {
    providedUserId: userId,
    currentUserId: currentUser?.id,
    targetUserId,
    isAuthenticated,
    loading,
    shouldFetch,
  });
  
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `/api/user/status?userId=${targetUserId}` : null,
    fetcher,
    {
      refreshInterval: 0, // Disable automatic refresh - only refresh on events
      revalidateOnFocus: false, // Don't revalidate on focus to avoid constant loading
      revalidateOnReconnect: true, // Revalidate when network reconnects
      dedupingInterval: 10000, // Dedupe requests within 10 seconds
      errorRetryCount: 2, // Retry failed requests 2 times
      errorRetryInterval: 10000, // Wait 10 seconds between retries
    }
  );

  return {
    userStatus: data || null,
    isLoading,
    error,
    mutate,
  };
}
