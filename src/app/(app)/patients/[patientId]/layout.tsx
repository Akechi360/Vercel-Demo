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

  useEffect(() => {
    const fetchPatientData = async () => {
      const patientData = await getPatientById(patientId);
      if (patientData) {
        let companyName: string | undefined;
        if (patientData.companyId) {
          const company = await getCompanyById(patientData.companyId);
          companyName = company?.name;
        }
        setPatient({ ...patientData, companyName });
      }
    };
    fetchPatientData();
  }, [patientId]);
  
  const isHistoryPage = pathname === `/patients/${patientId}`;

  if (!patient) {
    // You can show a loading skeleton here
    return <div>Cargando...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PatientDetailHeader patient={patient} />
      <div className="flex justify-between items-center -mb-4">
        <PatientDetailNav patientId={patient.id} />
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
                                                <Calendar
                                                mode="single"
                                                />
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
      </div>
      <div>{children}</div>
    </div>
  );
}
