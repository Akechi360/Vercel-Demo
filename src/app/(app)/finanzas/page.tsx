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
        users,
        receipts,
    ] = await Promise.all([
        getPayments(),
        getPatients(),
        getPaymentTypes(),
        getPaymentMethods(),
        getUsers(),
        getReceipts(),
    ]);

  const doctors = users.filter(u => u.role === 'doctor');
  
  return (
    <FinancePageClient
      initialPayments={initialPayments}
      patients={patients}
      doctors={doctors}
      paymentTypes={paymentTypes}
      paymentMethods={paymentMethods}
      receipts={receipts}
    />
  );
}
