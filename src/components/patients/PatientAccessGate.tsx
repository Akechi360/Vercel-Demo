'use client';

import { useAuth } from '@/components/layout/auth-provider';
import { ROLES } from '@/lib/types';
import { RestrictedNotice } from './RestrictedNotice';
import { useUnifiedUserStatus } from '@/hooks/use-unified-user-status';
import { globalEventBus } from '@/lib/store/global-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PatientAccessGateProps {
  children: React.ReactNode;
}

export function PatientAccessGate({ children }: PatientAccessGateProps) {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const { userStatus, isLoading: statusLoading, error } = useUnifiedUserStatus(currentUser?.id);
  const router = useRouter();

  // Listen for user data updates from admin changes
  useEffect(() => {
    const handleUserDataUpdate = async (event: unknown) => {
      const customEvent = event as CustomEvent;
      console.log('🔄 User data updated, triggering update...', customEvent.detail);
      
      const updatedUser = customEvent.detail;
      
      if (updatedUser && updatedUser.id === currentUser?.id) {
        console.log('🔄 Current user updated, updating global store...');
        globalEventBus.emitUserUpdate(updatedUser);
      }
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, [currentUser]);

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 PatientAccessGate status:', {
      isAuthenticated,
      authLoading,
      currentUser: currentUser ? { id: currentUser.id, role: currentUser.role } : null,
      userStatus,
      statusLoading,
      error
    });
  }

  // Show loading state when authentication is in progress or when we're still loading user status
  if (authLoading || (isAuthenticated && statusLoading && !userStatus)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, let AuthProvider handle the redirect
  if (!isAuthenticated || !currentUser) {
    return <>{children}</>;
  }

  // If we have an error but user data is available, log it but continue
  if (error && process.env.NODE_ENV === 'development') {
    console.warn('Error in user status check:', error);
  }

  // Use userStatus if available, otherwise fall back to currentUser
  const effectiveStatus = userStatus || {
    id: currentUser.id,
    role: currentUser.role,
    status: currentUser.status || 'ACTIVE',
    userId: currentUser.id
  };

  // Check restrictions
  const isRestricted = effectiveStatus.role === ROLES.USER && effectiveStatus.status === 'INACTIVE';
  
  if (isRestricted) {
    return <RestrictedNotice />;
  }
  
  // If we get here, access is allowed
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Allowing access for user:', {
      id: effectiveStatus.id,
      role: effectiveStatus.role,
      status: effectiveStatus.status
    });
  }
  
  return <>{children}</>;
}
