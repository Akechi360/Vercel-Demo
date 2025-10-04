'use client';

import { useEffect } from 'react';
import { useProviderStore } from '@/lib/store/provider-store';
import type { Provider } from '@/lib/types';
import ProviderList from './provider-list';

interface ProviderListWrapperProps {
  initialProviders: Provider[];
}

export default function ProviderListWrapper({ initialProviders }: ProviderListWrapperProps) {
  const { setProviders, isInitialized } = useProviderStore();

  useEffect(() => {
    if (!isInitialized) {
      setProviders(initialProviders);
    }
  }, [initialProviders, setProviders, isInitialized]);

  return <ProviderList />;
}
