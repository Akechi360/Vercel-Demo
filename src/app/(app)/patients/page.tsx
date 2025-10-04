'use client';
import { getCompanies, getPatients } from '@/lib/actions';
import { PatientListWrapper } from '@/components/patients/patient-list-wrapper';
import { PageHeader } from '@/components/shared/page-header';
import { useEffect, useState } from 'react';
import type { Company, Patient } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/layout/auth-provider';
import { redirect } from 'next/navigation';

function PatientPageSkeleton() {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Pacientes" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="flex-1 w-full flex gap-4">
                            <Skeleton className="h-10 w-full sm:max-w-xs" />
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-10" />
                        </div>
                        <Skeleton className="h-10 w-full sm:w-auto px-6" />
                    </div>
                </div>
                <div className="rounded-lg border bg-card">
                    <div className="p-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full mt-2" />
                        <Skeleton className="h-8 w-full mt-2" />
                        <Skeleton className="h-8 w-full mt-2" />
                        <Skeleton className="h-8 w-full mt-2" />
                    </div>
                </div>
            </div>
        </div>
    );
}


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

  if (currentUser?.role === 'patient' && currentUser.patientId) {
    redirect(`/patients/${currentUser.patientId}`);
  }

  if (loading || !initialPatients || !initialCompanies) {
    return <PatientPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Pacientes" />
      <PatientListWrapper initialPatients={initialPatients} initialCompanies={initialCompanies} />
    </div>
  );
}
