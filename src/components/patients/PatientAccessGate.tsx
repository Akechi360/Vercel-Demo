'use client';

import { useAuth } from '@/components/layout/auth-provider';
import { RestrictedNotice } from './RestrictedNotice';
import { useUserStatus } from '@/hooks/use-user-status';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PatientAccessGateProps {
  children: React.ReactNode;
}

export function PatientAccessGate({ children }: PatientAccessGateProps) {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const { userStatus, isLoading, error, mutate } = useUserStatus(currentUser?.id);
  const router = useRouter();

  // Listen for user data updates from admin changes and trigger SWR revalidation
  useEffect(() => {
    const handleUserDataUpdate = async (event: unknown) => {
      const customEvent = event as CustomEvent;
      console.log('🔄 User data updated, triggering SWR revalidation...', customEvent.detail);
      
      const updatedUser = customEvent.detail;
      
      // If this is the current user, trigger SWR revalidation
      if (updatedUser && updatedUser.id === currentUser?.id) {
        console.log('🔄 Current user updated, revalidating SWR cache...');
        mutate(); // This will trigger a fresh fetch
      }
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, [currentUser, mutate]);

  // Check if user should be restricted based on fresh server data
  // ONLY restrict patients with INACTIVE status, never restrict ACTIVE patients
  const isRestricted = userStatus && 
    userStatus.role === 'patient' && 
    userStatus.status === 'INACTIVE';

  // Debug logging to ensure correct restriction logic
  console.log('🔍 PatientAccessGate restriction check:', {
    userStatus,
    role: userStatus?.role,
    status: userStatus?.status,
    patientId: userStatus?.patientId,
    isRestricted,
    isAdmin: userStatus?.role === 'admin' || userStatus?.role === 'master',
    restrictionLogic: userStatus?.role === 'patient' && userStatus?.status === 'INACTIVE',
  });

  // Show loading state while authenticating or fetching user status
  if (loading || (isLoading && !userStatus)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show children (let AuthProvider handle redirect)
  if (!isAuthenticated || !currentUser) {
    return <>{children}</>;
  }

  // If there's an error fetching user status, use localStorage fallback
  if (error) {
    console.error('❌ Error fetching user status:', error);
    console.log('🔄 Using localStorage fallback for user:', currentUser);
    
    // Fallback to localStorage data if API fails
    const shouldRestrict = currentUser.role === 'patient' && 
      currentUser.status === 'INACTIVE';
    
    if (shouldRestrict) {
      return <RestrictedNotice />;
    }
    
    // If no restriction needed, show children
    return <>{children}</>;
  }

  // If user is restricted, show restricted notice
  if (isRestricted) {
    return <RestrictedNotice />;
  }

  // User has access, show content
  return <>{children}</>;
}
