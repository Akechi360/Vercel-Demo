import { useAuth } from '@/components/layout/auth-provider';
import { useUsers, useGlobalStore } from '@/lib/store/global-store';
import { useEffect, useState } from 'react';
import { getCurrentUserFresh } from '@/lib/actions';
import { UserRole } from '@/lib/types';
import { User } from '@/lib/types';

interface UserStatus {
  id: string;
  role: UserRole;
  status: string;
  userId: string | null;
}

interface UseUnifiedUserStatusReturn {
  userStatus: UserStatus | null;
  isLoading: boolean;
  error: any;
  refresh: () => void;
}

export function useUnifiedUserStatus(userId?: string): UseUnifiedUserStatusReturn {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const { users, loading: usersLoading, error: usersError, refresh } = useUsers();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  
  // Use provided userId or fallback to currentUser.id
  const targetUserId = userId || currentUser?.id;
  const shouldFetch = isAuthenticated && targetUserId && !authLoading;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 useUnifiedUserStatus:', {
      providedUserId: userId,
      currentUserId: currentUser?.id,
      targetUserId,
      isAuthenticated,
      authLoading,
      shouldFetch,
      usersCount: users?.length || 0,
      usersLoading
    });
  }
  
  // Find user in global store
  const user = users.find(u => u.id === targetUserId);
  
  // Convert user to UserStatus format
  const userStatus: UserStatus | null = user ? {
    id: user.id,
    role: user.role as UserRole,
    status: user.status,
    userId: user.userId || null,
  } : null;
  
  // Fetch user directly if not found in store
  useEffect(() => {
    const fetchUserDirectly = async () => {
      if (shouldFetch && !user && !usersLoading && !isFetchingUser) {
        try {
          setIsFetchingUser(true);
          const freshUser = await getCurrentUserFresh(targetUserId!);
          if (freshUser) {
            // Update the store with the fresh user data
            const { setUsers } = useGlobalStore.getState();
            setUsers([...users, freshUser]);
          }
        } catch (error) {
          console.error('Error fetching user directly:', error);
          setLocalError('Failed to fetch user data');
        } finally {
          setIsFetchingUser(false);
        }
      }
    };
    
    fetchUserDirectly();
  }, [shouldFetch, user, users, usersLoading, targetUserId, isFetchingUser]);
  
  // Auto-refresh if user not found and we should fetch
  useEffect(() => {
    if (shouldFetch && !user && !usersLoading && !isFetchingUser) {
      console.log('🔄 User not found in store, refreshing users list...');
      refresh().catch(err => {
        console.error('❌ Failed to refresh users list:', err);
        setLocalError('Failed to refresh users list');
      });
    }
  }, [shouldFetch, user, usersLoading, refresh, isFetchingUser]);
  
  // Handle errors
  useEffect(() => {
    if (usersError) {
      console.error('❌ Error in useUnifiedUserStatus:', usersError);
      // Safely convert any error type to string
      const errorMessage = usersError ? String(usersError) : 'Unknown error';
      setLocalError(errorMessage);
    } else {
      setLocalError(null);
    }
  }, [usersError]);
  
  const isLoading = authLoading || usersLoading || isFetchingUser;
  const error = localError || usersError;
  
  // Log when we can't find the user but have users loaded
  useEffect(() => {
    if (!isLoading && !user && users.length > 0 && targetUserId) {
      console.warn('⚠️ User not found in store:', {
        targetUserId,
        availableUserIds: users.map(u => u.id).slice(0, 10), // Show first 10 user IDs for debugging
        totalUsers: users.length
      });
    }
  }, [user, users, isLoading, targetUserId]);
  
  return {
    userStatus,
    isLoading,
    error,
    refresh,
  };
}
