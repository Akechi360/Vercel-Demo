'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { LabResult } from '@/lib/types';
import { format } from 'date-fns';
import { Microscope } from 'lucide-react';
import CompleteLabResultButton from '@/components/lab-results/complete-lab-result-button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FileViewerModal } from '../history/file-viewer-modal';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LabResultsCardProps {
  results?: LabResult[];
  labResults?: LabResult[];
}

export default function LabResultsCard({ results, labResults }: LabResultsCardProps) {
  const router = useRouter();
  const data = results || labResults || [];
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  console.log('📊 LabResultsCard rendering with:', data.length, 'results');
  const sortedResults = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSuccess = () => {
    router.refresh(); // Recargar datos
  };

  const getEstadoBadge = (estado?: string) => {
    if (!estado) return null;
    
    const variants = {
      PENDIENTE: 'outline' as const,
      COMPLETADO: 'default' as const,
      CANCELADO: 'destructive' as const,
    };
    
    const colors = {
      PENDIENTE: 'text-yellow-600',
      COMPLETADO: 'text-green-600',
      CANCELADO: 'text-red-600',
    };
    
    return (
      <Badge variant={variants[estado as keyof typeof variants] || 'outline'} className={colors[estado as keyof typeof colors]}>
        {estado}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados de Laboratorio</CardTitle>
        <CardDescription>Resultados de laboratorio recientes e históricos.</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedResults.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Prueba</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{format(new Date(result.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="font-medium">{result.testName}</TableCell>
                  <TableCell>{(() => {
                      try {
                        const parsed = typeof result.value === 'string' && result.value.startsWith('[')
                          ? JSON.parse(result.value) : null;
                        if(Array.isArray(parsed))
                          return parsed.map((v: any, idx: number) => <div key={idx}>{v.name}: {v.value}</div>);
                      } catch { /* ignore */ }
                      return result.value;
                    })()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{result.referenceRange || 'N/A'}</TableCell>
                  <TableCell>{getEstadoBadge(result.estado)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{result.doctor || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      {result.archivoContenido && (
                        <Button size="icon" variant="outline" title="Ver archivo adjunto" onClick={() => {setSelectedResult(result); setModalOpen(true);}}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {(() => {
                        console.log('[LAB_RESULTS_CARD] Result data:', {
                          id: result.id,
                          testName: result.testName,
                          hasArchivoContenido: !!result.archivoContenido,
                          archivoNombre: result.archivoNombre,
                          archivoTipo: result.archivoTipo
                        });
                        return null;
                      })()}
                      {result.estado === 'PENDIENTE' && (
                        <CompleteLabResultButton
                          labResultId={result.id}
                          testName={result.testName}
                          currentValue={result.value}
                          onSuccess={handleSuccess}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-48">
            <Microscope className="mx-auto h-12 w-12" />
            <h3 className="mt-2 text-lg font-medium">Sin Resultados de Laboratorio</h3>
            <p className="mt-1 text-sm">No se encontraron resultados de laboratorio para este paciente.</p>
          </div>
        )}
      </CardContent>
      {selectedResult && (
        <FileViewerModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} report={selectedResult}/>
      )}
    </Card>
  );
}
