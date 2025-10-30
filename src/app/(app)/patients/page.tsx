'use client';
import { getCompanies, getPatients } from '@/lib/actions';
import { PatientListWrapper } from '@/components/patients/patient-list-wrapper';
import { PageHeader } from '@/components/shared/page-header';
import { useEffect, useState } from 'react';
import type { Company, Patient } from '@/lib/types';
import { useAuth } from '@/components/layout/auth-provider';
import { redirect } from 'next/navigation';
import { HeartbeatLoader } from '@/components/ui/heartbeat-loader';



export default function PatientsPage() {
  const { currentUser } = useAuth();
  const [initialPatients, setInitialPatients] = useState<Patient[] | null>(null);
  const [initialCompanies, setInitialCompanies] = useState<Company[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        const [patients, companies] = await Promise.all([getPatients(), getCompanies()]);
        setInitialPatients(patients);
        setInitialCompanies(companies);
        setLoading(false);
    }
    fetchData();
  }, []);

  if (currentUser?.role === 'patient' && currentUser.userId) {
    redirect(`/patients/${currentUser.userId}`);
  }

  if (loading || !initialPatients || !initialCompanies) {
    return <HeartbeatLoader text="Cargando pacientes..." size="md" />;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Pacientes" />
      <PatientListWrapper initialPatients={initialPatients} initialCompanies={initialCompanies} />
    </div>
  );
}
