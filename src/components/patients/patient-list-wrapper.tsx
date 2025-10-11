'use client';

import { useEffect } from 'react';
import { usePatientStore } from '@/lib/store/patient-store';
import { useCompanyStore } from '@/lib/store/company-store';
import type { Patient, Company } from '@/lib/types';
import PatientList from './patient-list';

interface PatientListWrapperProps {
  initialPatients: Patient[];
  initialCompanies: (Company & { patientCount?: number })[];
}

export function PatientListWrapper({ initialPatients, initialCompanies }: PatientListWrapperProps) {
  const { setPatients, isInitialized: isPatientsInitialized } = usePatientStore();
  const { setCompanies, isInitialized: isCompaniesInitialized } = useCompanyStore();

  useEffect(() => {
    // Initialize the stores only once
    if (!isPatientsInitialized) {
        setPatients(initialPatients);
    }
    if (!isCompaniesInitialized) {
      // Ensure companies have patientCount property for consistency in the store
      const companiesWithCount = initialCompanies.map(c => ({...c, patientCount: c.patientCount || 0}));
      setCompanies(companiesWithCount);
    }
  }, [initialPatients, initialCompanies, setPatients, setCompanies, isPatientsInitialized, isCompaniesInitialized]);

  return <PatientList />;
}
