import { useAuth } from '@/components/layout/auth-provider';
import { useUsers } from '@/lib/store/global-store';
import { useEffect, useState } from 'react';

interface UserStatus {
  id: string;
  role: string;
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
    role: user.role,
    status: user.status,
    userId: user.userId || null,
  } : null;
  
  // Auto-refresh if user not found and we should fetch
  useEffect(() => {
    if (shouldFetch && !user && !usersLoading) {
      console.log('🔄 User not found in store, refreshing users list...');
      refresh().catch(err => {
        console.error('❌ Failed to refresh users list:', err);
      });
    }
  }, [shouldFetch, user, usersLoading, refresh]);
  
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
  
  const isLoading = authLoading || usersLoading;
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
