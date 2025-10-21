import type { Patient } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { getInitials } from '@/lib/utils';
import { User, HeartPulse, Droplets, Phone, Mail, Building } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import PatientActions from './patient-actions';

interface PatientDetailHeaderProps {
  patient: Patient & { companyName?: string };
  onPatientUpdated?: (updatedPatient: Patient) => void;
  onPatientDeleted?: (patientId: string) => void;
}

export default function PatientDetailHeader({ patient, onPatientUpdated, onPatientDeleted }: PatientDetailHeaderProps) {
  return (
    <>
      <PageHeader title={patient.name} backHref="/patients" />
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row items-start gap-6">
          <Avatar className="w-24 h-24 border">
            {patient.avatarUrl && <AvatarImage src={patient.avatarUrl} alt={patient.name} />}
            <AvatarFallback className="text-3xl">{getInitials(patient.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-headline sr-only">{patient.name}</h2>
              <PatientActions 
                patient={patient}
                onPatientUpdated={onPatientUpdated}
                onPatientDeleted={onPatientDeleted}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center"><User className="w-4 h-4 mr-2 text-primary" /> {patient.age} años</div>
              <div className="flex items-center"><HeartPulse className="w-4 h-4 mr-2 text-primary" /> {patient.gender || 'No especificado'}</div>
              <div className="flex items-center"><Droplets className="w-4 h-4 mr-2 text-primary" /> Grupo Sanguíneo: {patient.bloodType || 'No especificado'}</div>
              <div className="flex items-center"><Phone className="w-4 h-4 mr-2 text-primary" /> {patient.contact.phone || 'No disponible'}</div>
              <div className="flex items-center col-span-2 md:col-span-1"><Mail className="w-4 h-4 mr-2 text-primary" /> {patient.contact.email || 'No disponible'}</div>
               <div className="flex items-center col-span-2 md:col-span-1">
                <Building className="w-4 h-4 mr-2 text-primary" />
                {patient.companyName ? (
                    <span>{patient.companyName}</span>
                ) : (
                    <span className="italic text-gray-400">Paciente Particular</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
