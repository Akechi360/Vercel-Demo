'use client';
import { getCompanyById, getPatientById } from '@/lib/actions';
import { usePathname } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import PatientDetailHeader from '@/components/patients/patient-detail-header';
import PatientDetailNav from '@/components/patients/patient-detail-nav';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, Calendar as CalendarIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { ExportHistoryButton } from '@/components/history/export-history-button';
import type { Patient, Company } from '@/lib/types';

type PatientWithCompany = Patient & { companyName?: string };

export default function PatientDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ patientId: string }>;
}) {
  const pathname = usePathname();
  const { patientId } = use(params);
  const [patient, setPatient] = useState<PatientWithCompany | null>(null);

  // ✅ VALIDACIÓN CRÍTICA - Verificar que patientId sea válido
  const isValidPatientId = patientId && typeof patientId === 'string' && patientId.trim() !== '';
  
  if (!isValidPatientId) {
    console.error('❌ PatientDetailLayout - patientId inválido desde params:', { 
      patientId, 
      type: typeof patientId,
      pathname
    });
  }

  console.log('🔍 PatientDetailLayout - patientId extraído de params:', {
    patientId,
    type: typeof patientId,
    length: patientId?.length,
    pathname,
    rawParams: { patientId }
  });

  useEffect(() => {
    if (!isValidPatientId) return;
    console.log('🔍 PatientDetailLayout - useEffect ejecutado para patientId:', patientId);
    
    const fetchPatientData = async () => {
      console.log('🔍 PatientDetailLayout - Llamando a getPatientById con:', patientId);
      const patientData = await getPatientById(patientId);
      console.log('🔍 PatientDetailLayout - patientData obtenido:', !!patientData);
      
      if (patientData) {
        let companyName: string | undefined;
        if (patientData.companyId) {
          console.log('🔍 PatientDetailLayout - Obteniendo compañía para:', patientData.companyId);
          const company = await getCompanyById(patientData.companyId);
          companyName = company?.name;
          console.log('🔍 PatientDetailLayout - Compañía obtenida:', companyName);
        }
        setPatient({ ...patientData, companyName });
        console.log('🔍 PatientDetailLayout - Patient establecido con companyName:', companyName);
      }
    };
    fetchPatientData();
  }, [patientId]);
  
  const isHistoryPage = pathname === `/patients/${patientId}`;

  // Mostrar error si patientId es inválido
  if (!isValidPatientId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Error de Navegación</h3>
          <p className="text-muted-foreground">ID de paciente inválido o no encontrado.</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    // You can show a loading skeleton here
    return <div>Cargando...</div>;
  }

  const handlePatientUpdated = (updatedPatient: PatientWithCompany) => {
    setPatient(updatedPatient);
  };

  const handlePatientDeleted = (patientId: string) => {
    // Redirect to patients list after deletion
    window.location.href = '/patients';
  };

  return (
    <div className="flex flex-col gap-4">
      <PatientDetailHeader 
        patient={patient} 
        onPatientUpdated={handlePatientUpdated}
        onPatientDeleted={handlePatientDeleted}
      />
      <PatientDetailNav patientId={patientId} />
      {isHistoryPage && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Filtros</h4>
                  <p className="text-sm text-muted-foreground">
                    Ajusta los filtros para el historial médico.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="status">Tipo</Label>
                    <Select>
                      <SelectTrigger className="w-full col-span-2">
                        <SelectValue placeholder="Filtrar por tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todos</SelectItem>
                        <SelectItem value="Inicial">Inicial</SelectItem>
                        <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                        <SelectItem value="Pre-operatorio">Pre-operatorio</SelectItem>
                        <SelectItem value="Post-operatorio">Post-operatorio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label>Fecha</Label>
                    <div className='col-span-2'>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className='w-full justify-start text-left font-normal'>
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            <span>Elige una fecha</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {patient && <ExportHistoryButton patient={patient} />}
        </div>
      )}
      {children}
    </div>
  );
}
