'use client';

import { useAuth } from '@/components/layout/auth-provider';
import { usePermissions } from '@/hooks/use-permissions';

export function AuthDebug() {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const { hasPermission } = usePermissions();

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg z-50 text-xs">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>Authenticated: {isAuthenticated ? 'true' : 'false'}</div>
      <div>User: {currentUser ? `${currentUser.name} (${currentUser.role})` : 'null'}</div>
      <div>Dashboard Permission: {hasPermission('dashboard:read') ? 'true' : 'false'}</div>
      <div>Patients Permission: {hasPermission('patients:read') ? 'true' : 'false'}</div>
    </div>
  );
}
