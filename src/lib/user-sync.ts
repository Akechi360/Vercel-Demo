'use client';

// Function to sync user data in localStorage when changes are made by admin
export function syncUserData(updatedUser: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  patientId?: string | null;
}) {
  try {
    // Get current user from localStorage
    const currentUserJson = localStorage.getItem('user');
    if (!currentUserJson) return;

    const currentUser = JSON.parse(currentUserJson);
    
    // If this is the same user, update their data
    if (currentUser.id === updatedUser.id) {
      const syncedUser = {
        ...currentUser,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        patientId: updatedUser.patientId,
      };
      
      localStorage.setItem('user', JSON.stringify(syncedUser));
      console.log('✅ User data synced in localStorage:', syncedUser);
      
      // Trigger a custom event to notify components of the change
      window.dispatchEvent(new CustomEvent('userDataUpdated', { 
        detail: syncedUser 
      }));
      
      // Force a page refresh to get fresh data from server
      if (typeof window !== 'undefined') {
        // Small delay to allow the event to be processed
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
  } catch (error) {
    console.error('❌ Error syncing user data:', error);
  }
}

// Function to check if current user needs to be updated
export function checkForUserUpdates() {
  try {
    const currentUserJson = localStorage.getItem('user');
    if (!currentUserJson) return;

    const currentUser = JSON.parse(currentUserJson);
    
    // Check if user is a patient without patientId (should be restricted)
    if (currentUser.role === 'patient' && !currentUser.patientId) {
      console.log('🔍 Patient without patientId detected, may need restriction');
    }
    
    // Check if user is inactive
    if (currentUser.status === 'INACTIVE') {
      console.log('🔍 Inactive user detected, may need restriction');
    }
  } catch (error) {
    console.error('❌ Error checking user updates:', error);
  }
}
