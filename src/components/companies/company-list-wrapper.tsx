'use client';

import { useEffect } from 'react';
import { useCompanies } from '@/lib/store/global-store';
import type { Company } from '@/lib/types';
import CompanyList from './company-list';

interface CompanyListWrapperProps {
  initialCompanies: Company[];
}

export default function CompanyListWrapper({ initialCompanies }: CompanyListWrapperProps) {
  const { setCompanies } = useCompanies();

  useEffect(() => {
    setCompanies(initialCompanies);
  }, [initialCompanies, setCompanies]);

  return <CompanyList />;
}
