'use client';

import { useEffect } from 'react';
import { usePatients, useCompanies } from '@/lib/store/global-store';
import type { Patient, Company } from '@/lib/types';
import PatientList from './patient-list';

interface PatientListWrapperProps {
  initialPatients: Patient[];
  initialCompanies: (Company & { patientCount?: number })[];
}

export function PatientListWrapper({ initialPatients, initialCompanies }: PatientListWrapperProps) {
  const { setPatients } = usePatients();
  const { setCompanies } = useCompanies();

  useEffect(() => {
    // Initialize the stores
    setPatients(initialPatients);
    // Ensure companies have patientCount property for consistency in the store
    const companiesWithCount = initialCompanies.map(c => ({...c, patientCount: c.patientCount || 0}));
    setCompanies(companiesWithCount);
  }, [initialPatients, initialCompanies, setPatients, setCompanies]);

  return <PatientList />;
}
