'use client';

import { useEffect } from 'react';
import { useUsers } from '@/lib/store/global-store';
import type { Provider } from '@/lib/types';
import ProviderList from './provider-list';

interface ProviderListWrapperProps {
  initialProviders: Provider[];
}

export default function ProviderListWrapper({ initialProviders }: ProviderListWrapperProps) {
  const { setUsers } = useUsers();

  useEffect(() => {
    // Initialize users with providers (convert Provider to User format)
    const userProviders = initialProviders.map(provider => ({
      id: provider.id,
      userId: `P${Date.now()}`,
      email: provider.email,
      name: provider.name,
      password: '',
      role: 'doctor',
      status: 'ACTIVE',
      createdAt: new Date(),
      phone: provider.phone,
      lastLogin: null,
      avatarUrl: null,
    }));
    setUsers(userProviders);
  }, [initialProviders, setUsers]);

  return <ProviderList />;
}
