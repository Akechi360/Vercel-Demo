'use client';

import { useAuth } from '@/components/layout/auth-provider';
import { RestrictedNotice } from './RestrictedNotice';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PatientAccessGateProps {
  children: React.ReactNode;
}

export function PatientAccessGate({ children }: PatientAccessGateProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const [isRestricted, setIsRestricted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setIsRestricted(false);
      setIsLoading(false);
      return;
    }

    // Fetch fresh user status from server instead of using localStorage
    const checkUserStatus = async () => {
      try {
        const response = await fetch(`/api/user/status?userId=${currentUser.id}`);
        if (response.ok) {
          const userStatus = await response.json();
          
          // Check if user is a patient with restricted access using fresh data
          const shouldRestrict = userStatus.role === 'patient' && 
            (userStatus.status === 'INACTIVE' || !userStatus.patientId);
          
          if (shouldRestrict) {
            setIsRestricted(true);
          } else {
            setIsRestricted(false);
          }
        } else {
          // Fallback to localStorage data if API fails
          const shouldRestrict = currentUser.role === 'patient' && 
            (currentUser.status === 'INACTIVE' || !currentUser.patientId);
          
          if (shouldRestrict) {
            setIsRestricted(true);
          } else {
            setIsRestricted(false);
          }
        }
      } catch (error) {
        console.error('Error fetching user status:', error);
        // Fallback to localStorage data if API fails
        const shouldRestrict = currentUser.role === 'patient' && 
          (currentUser.status === 'INACTIVE' || !currentUser.patientId);
        
        if (shouldRestrict) {
          setIsRestricted(true);
        } else {
          setIsRestricted(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [currentUser, isAuthenticated]);

  // Listen for user data updates from admin changes
  useEffect(() => {
    const handleUserDataUpdate = async (event: CustomEvent) => {
      console.log('🔄 User data updated, rechecking restrictions...', event.detail);
      
      // Update current user data from the event
      const updatedUser = event.detail;
      
      // If this is the current user, fetch fresh data from server
      if (updatedUser && updatedUser.id === currentUser?.id) {
        console.log('🔄 Current user updated, fetching fresh data from server...');
        
        try {
          const response = await fetch(`/api/user/status?userId=${currentUser.id}`);
          if (response.ok) {
            const userStatus = await response.json();
            
            // Re-evaluate restrictions with fresh server data
            const shouldRestrict = userStatus.role === 'patient' && 
              (userStatus.status === 'INACTIVE' || !userStatus.patientId);
            
            if (shouldRestrict) {
              setIsRestricted(true);
            } else {
              setIsRestricted(false);
            }
            
            console.log('🔄 Restrictions updated with fresh server data:', userStatus);
          }
        } catch (error) {
          console.error('Error fetching fresh user status:', error);
        }
      } else if (updatedUser) {
        // Even if it's not the current user, we should refresh to get updated data
        console.log('🔄 Other user updated, but not refreshing to avoid issues...');
        // router.refresh(); // Commented out to avoid unnecessary refreshes
      }
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, [currentUser, isAuthenticated, router]);

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
