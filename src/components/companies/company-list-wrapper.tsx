'use client';

import { useEffect } from 'react';
import { useCompanyStore } from '@/lib/store/company-store';
import type { Company } from '@/lib/types';
import CompanyList from './company-list';

interface CompanyListWrapperProps {
  initialCompanies: (Company & { patientCount: number })[];
}

export default function CompanyListWrapper({ initialCompanies }: CompanyListWrapperProps) {
  const { setCompanies, isInitialized } = useCompanyStore();

  useEffect(() => {
    if (!isInitialized) {
      setCompanies(initialCompanies);
    }
  }, [initialCompanies, setCompanies, isInitialized]);

  return <CompanyList />;
}
