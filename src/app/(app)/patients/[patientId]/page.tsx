'use client';
import { getConsultationsByUserId, getPatientById } from '@/lib/actions';
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
  const { patientId: userId } = use(params);
  const { currentUser, can } = useAuth();
  const [history, setHistory] = useState<Consultation[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ VALIDACIÓN CRÍTICA - Verificar que userId sea válido
  const isValidUserId = userId && typeof userId === 'string' && userId.trim() !== '';
  
  if (!isValidUserId) {
    console.error('❌ PatientHistoryPage - userId inválido desde params:', { 
      userId, 
      type: typeof userId,
      params: { patientId: userId }
    });
  }

  console.log('🔍 PatientHistoryPage - userId extraído de params:', {
    userId,
    type: typeof userId,
    length: userId?.length,
    params: { patientId: userId }
  });

  const canViewHistory = can('patients:write') || currentUser?.userId === userId;

  useEffect(() => {
    if (!isValidUserId) return;
    console.log('🔍 PatientHistoryPage - useEffect ejecutado');
    console.log('🔍 PatientHistoryPage - canViewHistory:', canViewHistory);
    console.log('🔍 PatientHistoryPage - userId:', userId);
    
    if (!canViewHistory) {
        console.log('🔍 PatientHistoryPage - No puede ver historial, estableciendo loading false');
        setLoading(false);
        return;
    }
    
    const fetchHistory = async () => {
      console.log('🔍 PatientHistoryPage - Iniciando fetchHistory');
      setLoading(true);
      
      try {
        console.log('🔍 PatientHistoryPage - Llamando a getConsultationsByUserId y getPatientById');
        const [medicalHistory, patientData] = await Promise.all([
          getConsultationsByUserId(userId),
          getPatientById(userId)
        ]);
        
        console.log('🔍 PatientHistoryPage - Datos obtenidos:');
        console.log('🔍 PatientHistoryPage - medicalHistory:', medicalHistory.length, 'consultas');
        console.log('🔍 PatientHistoryPage - patientData:', !!patientData);
        
        setHistory(medicalHistory);
        setPatient(patientData || null);
        setLoading(false);
        console.log('🔍 PatientHistoryPage - fetchHistory completado');
      } catch (error) {
        console.error('🔍 PatientHistoryPage - Error en fetchHistory:', error);
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [userId, canViewHistory]);

  const handleNewConsultation = (newConsultation: Omit<Consultation, 'id' | 'userId'>) => {
    const fullConsultation: Consultation = {
      ...newConsultation,
      id: `c-${Date.now()}`, // Mock ID
      userId: userId,
    };
    setHistory(prevHistory => [fullConsultation, ...prevHistory]);
  };

  // Mostrar error si userId es inválido
  if (!isValidUserId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Error de Navegación</h3>
          <p className="text-muted-foreground">ID de paciente inválido o no encontrado.</p>
        </div>
      </div>
    );
  }

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
            userId={userId}
            history={history} 
            onNewConsultation={handleNewConsultation}
        />
    </div>
  );
}
