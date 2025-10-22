'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LabResultsCard from '@/components/patients/lab-results-card';
import AddLabResultFab from '@/components/lab-results/add-lab-result-fab';
import { getLabResultsByPatientId } from '@/lib/actions';
import { useAuth } from '@/components/layout/auth-provider';
import type { LabResult } from '@/lib/types';

interface UrologyPageProps {
  params: Promise<{
    patientId: string;
  }>;
}

export default function UrologyPage({ params }: UrologyPageProps) {
  const { patientId } = use(params);
  const router = useRouter();
  const { currentUser } = useAuth();
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState('');

  // Fetch lab results
  const fetchResults = async () => {
    try {
      console.log('🔄 Fetching lab results for:', patientId);
      setLoading(true);
      
      const results = await getLabResultsByPatientId(patientId);
      console.log('✅ Results loaded:', results.length);
      
      setLabResults(results);
      
      // Obtener nombre del paciente del primer resultado
      if (results.length > 0 && results[0].userId) {
        setPatientName(`Paciente ${patientId}`);
      }
      
    } catch (error) {
      console.error('❌ Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch inicial
  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Callback después de agregar resultado
  const handleSuccess = () => {
    console.log('🔄 Refrescando después de agregar...');
    fetchResults(); // Recargar datos
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Resultados de Laboratorio</h1>
        <p className="text-muted-foreground">
          {patientName || `Paciente ${patientId}`}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Total de resultados: {labResults.length}
        </p>
      </div>

      <LabResultsCard results={labResults} />

      {/* FAB Button */}
      {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'DOCTOR' || currentUser.role === 'admin' || currentUser.role === 'doctor') && (
        <AddLabResultFab
          patientUserId={patientId}
          patientName={patientName || patientId}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
