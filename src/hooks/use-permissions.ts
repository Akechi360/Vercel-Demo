'use client';

import { useAuth } from '@/components/layout/auth-provider';
import { Permission, ROLE_PERMISSIONS, UserRole } from '@/lib/types';

export function usePermissions() {
  const { currentUser: user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    
    // Admin tiene acceso a todo
    if (user.role === 'admin') return true;
    
    // Verificar si el rol tiene el permiso específico
    const rolePermissions = ROLE_PERMISSIONS[user.role as UserRole] || [];
    return rolePermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canAccessModule = (module: string): boolean => {
    if (!user) return false;
    
    switch (module) {
      case 'dashboard':
        return hasPermission('dashboard:read');
      case 'patients':
        return hasPermission('patients:read');
      case 'appointments':
        return hasPermission('appointments:read');
      case 'companies':
        return hasPermission('companies:read');
      case 'finance':
        return hasPermission('finance:read');
      case 'affiliations':
        return hasPermission('affiliations:read');
      case 'settings':
        return hasPermission('settings:read');
      default:
        return false;
    }
  };

  const canWriteModule = (module: string): boolean => {
    if (!user) return false;
    
    switch (module) {
      case 'patients':
        return hasPermission('patients:write');
      case 'appointments':
        return hasPermission('appointments:write');
      case 'companies':
        return hasPermission('companies:write');
      case 'finance':
        return hasPermission('finance:write');
      case 'affiliations':
        return hasPermission('affiliations:write');
      case 'settings':
        return hasPermission('settings:write');
      default:
        return false;
    }
  };

  const canViewFinanceAdmin = (): boolean => {
    return hasPermission('finance:admin');
  };

  const canGenerateReceipts = (): boolean => {
    return hasPermission('finance:receipts');
  };

  const canDownloadReceipts = (): boolean => {
    return hasPermission('finance:download');
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isDoctor = (): boolean => {
    return user?.role === 'doctor' || user?.role === 'Doctor';
  };

  const isPatient = (): boolean => {
    return user?.role === 'patient';
  };

  const isSecretaria = (): boolean => {
    return user?.role === 'secretaria';
  };

  const isPromotora = (): boolean => {
    return user?.role === 'promotora';
  };

  const canViewOwnDataOnly = (): boolean => {
    return hasPermission('own_data:read') && !hasPermission('admin:all');
  };

  const canEditOwnDataOnly = (): boolean => {
    return hasPermission('own_data:write') && !hasPermission('admin:all');
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    canWriteModule,
    canViewFinanceAdmin,
    canGenerateReceipts,
    canDownloadReceipts,
    isAdmin,
    isDoctor,
    isPatient,
    isSecretaria,
    isPromotora,
    canViewOwnDataOnly,
    canEditOwnDataOnly,
    user,
  };
}
