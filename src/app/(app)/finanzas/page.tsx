// src/app/(app)/finanzas/page.tsx
import { getPayments, getPatients, getPaymentTypes, getPaymentMethods, getUsers, getReceipts } from '@/lib/actions';
import { PageHeader } from '@/components/shared/page-header';
import { FinanceTable } from '@/components/finance/finance-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { FinanceStatCards } from '@/components/finance/stat-cards';
import { FinancePageClient } from './finance-page-client';

export const metadata = {
  title: "Finanzas — UroVital",
};

export default async function FinanzasPage() {
    const [
        initialPayments,
        patients,
        paymentTypes,
        paymentMethods,
        usersResult,
        receipts,
    ] = await Promise.all([
        getPayments(),
        getPatients(),
        getPaymentTypes(),
        getPaymentMethods(),
        getUsers(),
        getReceipts(),
    ]);

  // Extraer el array de usuarios del objeto paginado
  const users = usersResult.users;

  // Safe array validation to prevent build errors
  const safeUsers = Array.isArray(users) ? users : [];
  const safePatients = Array.isArray(patients) ? patients : [];
  const safePayments = Array.isArray(initialPayments) ? initialPayments : [];
  const safePaymentTypes = Array.isArray(paymentTypes) ? paymentTypes : [];
  const safePaymentMethods = Array.isArray(paymentMethods) ? paymentMethods : [];
  const safeReceipts = Array.isArray(receipts) ? receipts : [];

  const doctors = safeUsers.filter(u => u.role === 'doctor');
  
  return (
    <FinancePageClient
      initialPayments={safePayments}
      patients={safePatients}
      doctors={doctors}
      paymentTypes={safePaymentTypes}
      paymentMethods={safePaymentMethods}
      receipts={safeReceipts}
    />
  );
}
