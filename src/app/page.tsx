'use client';
import { useAuth } from '@/components/layout/auth-provider';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        redirect('/dashboard');
      } else {
        redirect('/landing');
      }
    }
  }, [isAuthenticated, loading]);

  // Render a loading state while checking auth
  return null;
}
