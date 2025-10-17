'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState, createContext, useContext, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ROLE_PERMISSIONS, type Permission, type User, UserRole } from '@/lib/types';

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
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
             <div className="w-full max-w-md space-y-8">
                <div className="space-y-2 text-center">
                    <Skeleton className="mx-auto h-16 w-16 rounded-full" />
                    <Skeleton className="h-8 w-48 mx-auto" />
                    <Skeleton className="h-4 w-64 mx-auto" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-12 w-full mt-6" />
                </div>
             </div>
        </div>
    )
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
        
        // Mapear el rol "user" a "secretaria" para compatibilidad
        if (user && user.role === 'user') {
            user.role = 'secretaria';
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

  const canFn = (perm: Permission) => {
    if (!currentUser) return false;
    
    // Admin has all permissions
    if (currentUser.role === 'ADMIN' || currentUser.role === 'admin') return true;
    
    // Safety check to ensure the role exists in ROLE_PERMISSIONS
    const rolePermissions = ROLE_PERMISSIONS[currentUser.role as UserRole];
    if (!rolePermissions) return false;
    
    return rolePermissions.includes(perm);
  };

  const authContextValue = useMemo(() => ({
    currentUser,
    isAuthenticated: !!currentUser,
    loading: isAuthenticating,
    can: canFn,
  }), [currentUser, isAuthenticating]);

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
