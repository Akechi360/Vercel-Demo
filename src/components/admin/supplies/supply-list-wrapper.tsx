'use client';

import { useEffect } from 'react';
import { useSupplyStore } from '@/lib/store/supply-store';
import type { Supply } from '@/lib/types';
import SupplyList from './supply-list';

interface SupplyListWrapperProps {
  initialSupplies: Supply[];
}

export default function SupplyListWrapper({ initialSupplies }: SupplyListWrapperProps) {
  const { setSupplies, isInitialized } = useSupplyStore();

  useEffect(() => {
    if (!isInitialized) {
      setSupplies(initialSupplies);
    }
  }, [initialSupplies, setSupplies, isInitialized]);

  return <SupplyList />;
}
