'use client';

import { useAuth } from '@/components/layout/auth-provider';
import { RestrictedNotice } from './RestrictedNotice';
import { useEffect, useState } from 'react';

interface PatientAccessGateProps {
  children: React.ReactNode;
}

export function PatientAccessGate({ children }: PatientAccessGateProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const [isRestricted, setIsRestricted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // Check if user is a patient with inactive status OR without a patient record
      if (currentUser.role === 'patient' && (currentUser.status === 'INACTIVE' || !currentUser.patientId)) {
        setIsRestricted(true);
      } else {
        setIsRestricted(false);
      }
    } else {
      setIsRestricted(false);
    }
    setIsLoading(false);
  }, [currentUser, isAuthenticated]);

  // Listen for user data updates from admin changes
  useEffect(() => {
    const handleUserDataUpdate = (event: CustomEvent) => {
      console.log('🔄 User data updated, rechecking restrictions...', event.detail);
      // Force re-evaluation of restrictions
      if (isAuthenticated && currentUser) {
        if (currentUser.role === 'patient' && (currentUser.status === 'INACTIVE' || !currentUser.patientId)) {
          setIsRestricted(true);
        } else {
          setIsRestricted(false);
        }
      }
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, [currentUser, isAuthenticated]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show restricted notice for inactive patients
  if (isRestricted) {
    return <RestrictedNotice />;
  }

  // Show normal content for all other users
  return <>{children}</>;
}
