'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { migrateExistingPatientsToJuanCarlos } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function MigratePatientsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ processed: number; assigned: number; errors: string[] } | null>(null);

    const handleMigration = async () => {
        try {
            setIsLoading(true);
            const res = await migrateExistingPatientsToJuanCarlos();
            setResult(res);

            if (res.errors.length === 0) {
                Swal.fire('Éxito', `Se procesaron ${res.processed} pacientes y se asignaron ${res.assigned} correctamente.`, 'success');
            } else {
                Swal.fire('Atención', `Se asignaron ${res.assigned} pacientes, pero hubo ${res.errors.length} errores.`, 'warning');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Ocurrió un error al ejecutar la migración.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Migración de Pacientes</CardTitle>
                    <CardDescription>
                        Asignar todos los pacientes sin médico al Dr. Juan Carlos - Urología.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-800">
                        <p className="font-medium">⚠️ Acción Irreversible</p>
                        <p className="text-sm mt-1">
                            Esta acción buscará todos los pacientes que NO tienen un médico asignado actualmente y los asignará al Dr. Juan Carlos.
                        </p>
                    </div>

                    <Button
                        onClick={handleMigration}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            'Ejecutar Migración'
                        )}
                    </Button>

                    {result && (
                        <div className="mt-6 space-y-2">
                            <h3 className="font-semibold">Resultados:</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Pacientes procesados: {result.processed}</li>
                                <li>Asignaciones creadas: {result.assigned}</li>
                                <li>Errores: {result.errors.length}</li>
                            </ul>

                            {result.errors.length > 0 && (
                                <div className="mt-4 bg-red-50 p-4 rounded-md border border-red-200 text-red-800 text-sm overflow-auto max-h-60">
                                    <p className="font-medium mb-2">Detalle de errores:</p>
                                    {result.errors.map((err, i) => (
                                        <div key={i}>{err}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
