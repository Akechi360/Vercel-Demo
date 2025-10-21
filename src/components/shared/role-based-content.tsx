'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface RoleBasedContentProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  fallback?: ReactNode;
}

export function RoleBasedContent({ 
  children, 
  allowedRoles, 
  requiredPermissions, 
  fallback = null 
}: RoleBasedContentProps) {
  const { user, hasPermission, hasAnyPermission } = usePermissions();

  // Si no hay usuario, no mostrar nada
  if (!user) {
    return <>{fallback}</>;
  }

  // Verificar roles permitidos
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  // Verificar permisos requeridos
  if (requiredPermissions && !hasAnyPermission(requiredPermissions as any)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Componentes específicos por rol
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedContent allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleBasedContent>
  );
}

export function DoctorOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedContent allowedRoles={['doctor']} fallback={fallback}>
      {children}
    </RoleBasedContent>
  );
}

export function PatientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedContent allowedRoles={['patient']} fallback={fallback}>
      {children}
    </RoleBasedContent>
  );
}

export function SecretariaOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedContent allowedRoles={['secretaria']} fallback={fallback}>
      {children}
    </RoleBasedContent>
  );
}

export function PromotoraOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedContent allowedRoles={['promotora']} fallback={fallback}>
      {children}
    </RoleBasedContent>
  );
}

export function StaffOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedContent allowedRoles={['admin', 'doctor', 'secretaria']} fallback={fallback}>
      {children}
    </RoleBasedContent>
  );
}

export function NonPatientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedContent allowedRoles={['admin', 'doctor', 'secretaria', 'promotora']} fallback={fallback}>
      {children}
    </RoleBasedContent>
  );
}
