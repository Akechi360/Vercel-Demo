'use client';

import { globalEventBus } from '@/lib/store/global-store';

// Function to sync user data in localStorage when changes are made by admin
export function syncUserData(updatedUser: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  userId?: string | null;
}) {
  console.log('🚀 syncUserData called with:', updatedUser);
  
  try {
    // Get current user from localStorage
    const currentUserJson = localStorage.getItem('user');
    console.log('📱 Current user from localStorage:', currentUserJson);
    
    if (!currentUserJson) {
      console.log('❌ No current user found in localStorage');
      return;
    }

    const currentUser = JSON.parse(currentUserJson);
    console.log('👤 Parsed current user:', currentUser);
    
    // If this is the same user, update their data
    if (currentUser.id === updatedUser.id) {
      const syncedUser = {
        ...currentUser,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        userId: updatedUser.userId,
      };
      
      localStorage.setItem('user', JSON.stringify(syncedUser));
      console.log('✅ User data synced in localStorage:', syncedUser);
    }
    
    // ALWAYS dispatch the global event, regardless of whether it's the current user
    // This allows all components to react to any user changes
    console.log('🔄 Dispatching global user update event for user:', updatedUser.id);
    // Convert to full User type for global store
    const fullUser = {
      ...updatedUser,
      password: '', // Not needed for updates
      createdAt: new Date(),
      phone: null,
      lastLogin: null,
      avatarUrl: null,
    };
    globalEventBus.emitUserUpdate(fullUser);
    console.log('✅ Global user update event dispatched successfully');
    
    // No need to reload the page - let the event system handle updates
    console.log('✅ User data sync completed without page reload');
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
    
    // Check if user is a patient without userId (should be restricted)
    if (currentUser.role === 'patient' && !currentUser.userId) {
      console.log('🔍 Patient without userId detected, may need restriction');
    }
    
    // Check if user is inactive
    if (currentUser.status === 'INACTIVE') {
      console.log('🔍 Inactive user detected, may need restriction');
    }
  } catch (error) {
    console.error('❌ Error checking user updates:', error);
  }
}
