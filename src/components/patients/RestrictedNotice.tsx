'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RestrictedNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md mx-auto border-orange-200 dark:border-orange-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
            <Shield className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-orange-800 dark:text-orange-200">
            Contenido Restringido
          </CardTitle>
          <CardDescription className="text-orange-600 dark:text-orange-400">
            Su cuenta de paciente no está configurada. Para acceder a los servicios médicos, 
            por favor contacte al administrador para crear su ficha de paciente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div className="text-sm text-orange-700 dark:text-orange-300">
              <p className="font-medium">Estado de la cuenta:</p>
              <p>Sin ficha de paciente - Acceso limitado</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              ¿Cómo crear su ficha de paciente?
            </h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-2">
                <Phone className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Contacte al administrador del sistema</span>
              </div>
              <div className="flex items-start space-x-2">
                <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Envíe un correo con su información</span>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/login'}
            >
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
