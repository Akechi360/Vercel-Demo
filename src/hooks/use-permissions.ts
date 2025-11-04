'use client';

import { useAuth } from '@/components/layout/auth-provider';
import { Permission, ROLE_PERMISSIONS, ROLES } from '@/lib/types';

export function usePermissions() {
  const { currentUser: user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    
    // Admin tiene acceso a todo
    if (user.role === ROLES.ADMIN) return true;
    
    // Verificar si el rol tiene el permiso específico
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
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

  const isAdmin = (): boolean => user?.role === ROLES.ADMIN;

  const isDoctor = (): boolean => user?.role === ROLES.DOCTOR;

  const isPatient = (): boolean => user?.role === ROLES.USER;

  const isSecretaria = (): boolean => user?.role === ROLES.SECRETARIA;

  const isPromotora = (): boolean => user?.role === ROLES.PROMOTORA;

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
