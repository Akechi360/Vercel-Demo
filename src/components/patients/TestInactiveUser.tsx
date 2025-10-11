'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/layout/auth-provider';

export function TestInactiveUser() {
  const { currentUser } = useAuth();

  const simulateInactiveUser = () => {
    if (currentUser) {
      // Simulate setting user as inactive
      const inactiveUser = {
        ...currentUser,
        status: 'INACTIVE'
      };
      localStorage.setItem('user', JSON.stringify(inactiveUser));
      window.location.reload();
    }
  };

  const simulateActiveUser = () => {
    if (currentUser) {
      // Simulate setting user as active
      const activeUser = {
        ...currentUser,
        status: 'ACTIVE'
      };
      localStorage.setItem('user', JSON.stringify(activeUser));
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <Button 
        onClick={simulateInactiveUser}
        variant="destructive"
        size="sm"
      >
        Simular Usuario Inactivo
      </Button>
      <Button 
        onClick={simulateActiveUser}
        variant="default"
        size="sm"
      >
        Simular Usuario Activo
      </Button>
    </div>
  );
}
