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

export function PatientAccessGate({ children }: PatientAccessGateProps) {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const { userStatus, isLoading: statusLoading } = useUnifiedUserStatus(currentUser?.id);
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
      statusLoading
    });
  }

  // Show loading state only when authentication is in progress
  if (authLoading) {
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

  // If we have user status, check restrictions
  if (userStatus) {
    const isRestricted = userStatus.role === 'patient' && userStatus.status === 'INACTIVE';
    
    if (isRestricted) {
      return <RestrictedNotice />;
    }
    
    return <>{children}</>;
  }

  // If we don't have user status but user is authenticated
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Could not verify user status, checking local user data', {
      currentUser: currentUser ? { 
        id: currentUser.id, 
        role: currentUser.role,
        status: currentUser.status 
      } : null,
      userStatus,
      isAuthenticated,
      authLoading
    });
  }

  // If we have currentUser data but no userStatus, use currentUser data for access control
  if (currentUser) {
    const isRestricted = currentUser.role === 'patient' && currentUser.status === 'INACTIVE';
    
    if (isRestricted) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Restricting access based on local user data');
      }
      return <RestrictedNotice />;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Allowing access based on local user data');
    }
    return <>{children}</>;
  }
  
  // If we can't verify access but user is authenticated, allow access with warning
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Could not verify access, defaulting to allow');
  }
  return <>{children}</>;
}
