'use client';
import { getConsultationsByPatientId, getPatientById } from '@/lib/actions';
import { MedicalHistoryTimeline } from '@/components/history/medical-history-timeline';
import type { Consultation, Patient } from '@/lib/types';
import { useEffect, useState, use } from 'react';
import { useAuth } from '@/components/layout/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldBan } from 'lucide-react';

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
  const { patientId } = use(params);
  const { currentUser, can } = useAuth();
  const [history, setHistory] = useState<Consultation[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const canViewHistory = can('patients:write') || currentUser?.patientId === patientId;

  useEffect(() => {
    if (!canViewHistory) {
        setLoading(false);
        return;
    }
    const fetchHistory = async () => {
      setLoading(true);
      const [medicalHistory, patientData] = await Promise.all([
        getConsultationsByPatientId(patientId),
        getPatientById(patientId)
      ]);
      setHistory(medicalHistory);
      setPatient(patientData || null);
      setLoading(false);
    };
    fetchHistory();
  }, [patientId, canViewHistory]);

  const handleNewConsultation = (newConsultation: Omit<Consultation, 'id' | 'patientId'>) => {
    const fullConsultation: Consultation = {
      ...newConsultation,
      id: `c-${Date.now()}`, // Mock ID
      patientId: patientId,
    };
    setHistory(prevHistory => [fullConsultation, ...prevHistory]);
  };

  if (loading) {
    // You can replace this with a proper skeleton loader for the timeline
    return <div>Cargando historial...</div>;
  }

  if (!canViewHistory) {
      return <DeniedAccess />;
  }

  return (
    <div className="flex flex-col gap-6">
        <MedicalHistoryTimeline 
            history={history} 
            onNewConsultation={handleNewConsultation}
        />
    </div>
  );
}
