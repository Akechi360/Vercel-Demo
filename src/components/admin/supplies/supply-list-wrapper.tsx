'use client';

import { useEffect } from 'react';
import { useUsers } from '@/lib/store/global-store';
import type { Supply } from '@/lib/types';
import SupplyList from './supply-list';

interface SupplyListWrapperProps {
  initialSupplies: Supply[];
}

export default function SupplyListWrapper({ initialSupplies }: SupplyListWrapperProps) {
  const { setUsers } = useUsers();

  useEffect(() => {
    // Initialize users with supplies (convert Supply to User format)
    const userSupplies = initialSupplies.map(supply => ({
      id: supply.id,
      userId: `S${Date.now()}`,
      email: `${supply.name.toLowerCase().replace(/\s+/g, '')}@supply.com`,
      name: supply.name,
      password: '',
      role: 'admin',
      status: 'ACTIVE',
      createdAt: new Date(),
      phone: null,
      lastLogin: null,
      avatarUrl: null,
    }));
    setUsers(userSupplies);
  }, [initialSupplies, setUsers]);

  return <SupplyList />;
}
