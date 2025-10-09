'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/layout/auth-provider';
import { useState } from 'react';

export function TestUserChanges() {
  const { currentUser } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testRoleChange = () => {
    if (currentUser) {
      // Simulate changing role from patient to doctor
      const userWithNewRole = {
        ...currentUser,
        role: 'doctor'
      };
      localStorage.setItem('user', JSON.stringify(userWithNewRole));
      addResult('✅ Rol cambiado a "doctor" - debería desaparecer del dropdown');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const testStatusChange = () => {
    if (currentUser) {
      // Simulate changing status to INACTIVE
      const userWithNewStatus = {
        ...currentUser,
        status: 'INACTIVE'
      };
      localStorage.setItem('user', JSON.stringify(userWithNewStatus));
      addResult('✅ Status cambiado a "INACTIVE" - debería mostrar pantalla restringida');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const resetUser = () => {
    if (currentUser) {
      // Reset to patient with ACTIVE status
      const resetUser = {
        ...currentUser,
        role: 'patient',
        status: 'ACTIVE'
      };
      localStorage.setItem('user', JSON.stringify(resetUser));
      addResult('✅ Usuario reseteado a "patient" + "ACTIVE"');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-80 max-h-96 overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-sm">Test de Cambios de Usuario</CardTitle>
        <CardDescription className="text-xs">
          Usuario actual: {currentUser.name} ({currentUser.role})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center space-x-2">
          <Badge variant={currentUser.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {currentUser.status}
          </Badge>
          <Badge variant="outline">{currentUser.role}</Badge>
        </div>
        
        <div className="space-y-1">
          <Button 
            onClick={testRoleChange}
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
          >
            Cambiar a Doctor
          </Button>
          <Button 
            onClick={testStatusChange}
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
          >
            Cambiar a Inactivo
          </Button>
          <Button 
            onClick={resetUser}
            variant="default" 
            size="sm" 
            className="w-full text-xs"
          >
            Reset a Patient Activo
          </Button>
        </div>
        
        {testResults.length > 0 && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs max-h-32 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-gray-600">{result}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
