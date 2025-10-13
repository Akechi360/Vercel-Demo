'use client';

import { useAuth } from '@/components/layout/auth-provider';
import { RestrictedNotice } from './RestrictedNotice';
import { useUnifiedUserStatus } from '@/hooks/use-unified-user-status';
import { globalEventBus } from '@/lib/store/global-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PatientAccessGateProps {
  children: React.ReactNode;
}

export function PatientAccessGateTest({ children }: PatientAccessGateProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const { userStatus, isLoading, error, refresh } = useUnifiedUserStatus();
  const router = useRouter();

  console.log('🧪 PatientAccessGateTest render:', {
    currentUser: currentUser?.id,
    isAuthenticated,
    userStatus,
    isLoading,
    error: error?.message,
  });

  // Listen for user data updates from admin changes and trigger SWR revalidation
  useEffect(() => {
    const handleUserDataUpdate = async (event: unknown) => {
      const customEvent = event as CustomEvent;
      console.log('🧪 User data updated, triggering SWR revalidation...', customEvent.detail);
      
      const updatedUser = customEvent.detail;
      
      // If this is the current user, trigger global store update
      if (updatedUser && updatedUser.id === currentUser?.id) {
        console.log('🧪 Current user updated, updating global store...');
        globalEventBus.emitUserUpdate(updatedUser);
      }
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, [currentUser, refresh]);

  // Check if user should be restricted based on fresh server data
  const isRestricted = userStatus && 
    userStatus.role === 'patient' && 
    (userStatus.status === 'INACTIVE' || !userStatus.userId);

  console.log('🧪 Restriction check:', {
    userStatus,
    isRestricted,
    role: userStatus?.role,
    status: userStatus?.status,
    userId: userStatus?.userId,
  });

  // Show loading state while fetching user status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">🧪 Testing - Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // If there's an error fetching user status, show error
  if (error) {
    console.error('❌ Test Error fetching user status:', error);
    console.error('❌ Test Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Fallback to localStorage data if API fails
    if (currentUser) {
      const shouldRestrict = currentUser.role === 'patient' && 
        (currentUser.status === 'INACTIVE' || !currentUser.userId);
      
      if (shouldRestrict) {
        return <RestrictedNotice />;
      }
    }
    
    // If no fallback data, show children
    return <>{children}</>;
  }

  // If user is not authenticated, show children (let AuthProvider handle redirect)
  if (!isAuthenticated || !currentUser) {
    return <>{children}</>;
  }

  // If user is restricted, show restricted notice
  if (isRestricted) {
    return <RestrictedNotice />;
  }

  // User has access, show content
  return <>{children}</>;
}
