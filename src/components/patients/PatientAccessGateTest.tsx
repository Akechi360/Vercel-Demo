'use client';

import { useAuth } from '@/components/layout/auth-provider';
import { RestrictedNotice } from './RestrictedNotice';
import { useUserStatusTest } from '@/hooks/use-user-status-test';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PatientAccessGateProps {
  children: React.ReactNode;
}

export function PatientAccessGateTest({ children }: PatientAccessGateProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const { userStatus, isLoading, error, mutate } = useUserStatusTest();
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
    const handleUserDataUpdate = async (event: CustomEvent) => {
      console.log('🧪 User data updated, triggering SWR revalidation...', event.detail);
      
      const updatedUser = event.detail;
      
      // If this is the current user, trigger SWR revalidation
      if (updatedUser && updatedUser.id === currentUser?.id) {
        console.log('🧪 Current user updated, revalidating SWR cache...');
        mutate(); // This will trigger a fresh fetch
      }
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, [currentUser, mutate]);

  // Check if user should be restricted based on fresh server data
  const isRestricted = userStatus && 
    userStatus.role === 'patient' && 
    (userStatus.status === 'INACTIVE' || !userStatus.patientId);

  console.log('🧪 Restriction check:', {
    userStatus,
    isRestricted,
    role: userStatus?.role,
    status: userStatus?.status,
    patientId: userStatus?.patientId,
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
        (currentUser.status === 'INACTIVE' || !currentUser.patientId);
      
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
