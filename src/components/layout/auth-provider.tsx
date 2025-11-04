'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState, createContext, useContext, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ROLE_PERMISSIONS, type Permission, type User, ROLES, type UserRole, isValidRole } from '@/lib/types';
import { LogoLoading } from '@/components/shared/logo-loading';

const PROTECTED_ROUTES = ['/dashboard', '/patients', '/settings', '/appointments', '/companies', '/administrativo'];
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/landing'];

type AuthContextType = {
    currentUser: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    can: (perm: Permission) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthScreen() {
    return <LogoLoading />
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    try {
        const userJson = localStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        
        // Mapear el rol del usuario al enum UserRole
        if (user) {
            // Convertir el rol a mayúsculas para coincidir con el enum
            const role = user.role.toUpperCase();
            
            // Verificar si el rol es válido, si no, asignar USER por defecto
            if (isValidRole(role)) {
                user.role = role as UserRole;
            } else {
                user.role = ROLES.USER;
            }
            
            // Actualizar el localStorage con el rol corregido
            localStorage.setItem('user', JSON.stringify(user));
        }
        
        console.log('AuthProvider: Loaded user from localStorage:', user?.role, user?.name);
        setCurrentUser(user);

        const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));
        const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

        if (!user && isProtectedRoute) {
            router.push('/login');
        } else if (user && isAuthRoute) {
            if (pathname !== '/landing') { // Allow logged-in users to see landing page
                router.push('/dashboard');
            }
        }
        
    } catch (error) {
        // Corrupted user data in localStorage
        localStorage.removeItem('user');
        setCurrentUser(null);
         if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
            router.push('/login');
        }
    } finally {
        setIsAuthenticating(false);
    }
  }, [pathname, router]);

  const can = (permission: Permission): boolean => {
    if (!currentUser) return false;
    
    // Admin tiene acceso a todo
    if (currentUser.role === ROLES.ADMIN) return true;
    
    // Safety check to ensure the role exists in ROLE_PERMISSIONS
    const rolePermissions = ROLE_PERMISSIONS[currentUser.role as keyof typeof ROLE_PERMISSIONS];
    if (!rolePermissions) return false;
    
    return rolePermissions.includes(permission);
  };

  const authContextValue = useMemo(() => ({
    currentUser,
    isAuthenticated: !!currentUser,
    loading: isAuthenticating,
    can,
  }), [currentUser, isAuthenticating, can]);

  // Don't render children for public routes until auth check is complete,
  // to avoid flicker on initial load to `/`.
  const isPublicRoute = AUTH_ROUTES.includes(pathname) || pathname === '/';
  if (isAuthenticating && isPublicRoute) {
    return null;
  }

  if (isAuthenticating) {
    return <AuthScreen />;
  }

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
