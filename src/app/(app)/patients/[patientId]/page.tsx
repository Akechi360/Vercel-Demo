'use client';
import { getConsultationsByUserId, getPatientById } from '@/lib/actions';
import { MedicalHistoryTimeline } from '@/components/history/medical-history-timeline';
import type { Consultation, Patient } from '@/lib/types';
import { use, useEffect, useState } from 'react';
import { useAuth } from '@/components/layout/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldBan } from 'lucide-react';
import { usePathname } from 'next/navigation';

function DeniedAccess() {
    return (
        <Card>
            <CardContent className="p-10 flex flex-col items-center justify-center gap-4 text-center">
                <ShieldBan className="h-12 w-12 text-destructive" />
                <h3 className="text-xl font-semibold">Acceso Restringido</h3>
                <p className="text-muted-foreground">No tienes permiso para ver el historial médico detallado de este paciente.</p>
            </CardContent>
        </Card>
    )
}

export default function PatientHistoryPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId: userId } = use(params);
  const { currentUser, can } = useAuth();
  const [history, setHistory] = useState<Consultation[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Validar que el ID de usuario sea válido
  const isValidUserId = userId && typeof userId === 'string' && userId.trim() !== '';
  const canViewHistory = can('patients:write') || currentUser?.userId === userId;

  // Cargar datos del paciente y su historial
  useEffect(() => {
    if (!isValidUserId || !canViewHistory) return;

    let isMounted = true;
    
    const loadData = async () => {
      try {
        const [patientData, medicalHistory] = await Promise.all([
          getPatientById(userId),
          getConsultationsByUserId(userId)
        ]);

        if (isMounted) {
          setPatient(patientData);
          setHistory(medicalHistory);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error al cargar los datos del paciente:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userId, isValidUserId, canViewHistory]);

  if (!isValidUserId) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">ID de paciente no válido</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!canViewHistory) {
    return <DeniedAccess />;
  }

  if (!patient) {
    return (
      <div className="p-4 text-center">
        <p>No se encontró el paciente</p>
      </div>
    );
  }

  const handleNewConsultation = (newConsultation: Omit<Consultation, 'id' | 'userId'>) => {
    const fullConsultation: Consultation = {
      ...newConsultation,
      id: `c-${Date.now()}`, // Mock ID
      userId: userId,
    };
    setHistory(prevHistory => [fullConsultation, ...prevHistory]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <MedicalHistoryTimeline 
            history={history} 
            userId={userId}
            onNewConsultation={handleNewConsultation}
          />
        </CardContent>
      </Card>
    </div>
  );
}
