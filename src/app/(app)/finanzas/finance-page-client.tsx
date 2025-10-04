'use client';

import { PageHeader } from '@/components/shared/page-header';
import { FinanceTable } from '@/components/finance/finance-table';
import { FinanceStatCards } from '@/components/finance/stat-cards';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/use-permissions';
import { RoleBasedContent } from '@/components/shared/role-based-content';
import { Payment, Patient, User, PaymentType, PaymentMethod } from '@/lib/types';

interface FinancePageClientProps {
  initialPayments: Payment[];
  patients: Patient[];
  doctors: User[];
  paymentTypes: PaymentType[];
  paymentMethods: PaymentMethod[];
}

export function FinancePageClient({
  initialPayments,
  patients,
  doctors,
  paymentTypes,
  paymentMethods,
}: FinancePageClientProps) {
  const { canViewFinanceAdmin, canGenerateReceipts, canDownloadReceipts, isAdmin, isSecretaria, isPatient } = usePermissions();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title="Finanzas"
        actions={
          canGenerateReceipts() && (
            <Button asChild>
              <Link href="/finanzas/nuevo">
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Comprobante
              </Link>
            </Button>
          )
        }
      />
      
      {/* Solo Admin puede ver estadísticas financieras completas */}
      <RoleBasedContent roles={['admin']}>
        <FinanceStatCards payments={initialPayments} />
      </RoleBasedContent>

      {/* Secretaria ve opción de generar comprobantes */}
      <RoleBasedContent roles={['secretaria']}>
        <div className="space-y-4">
          <div className="text-center p-6 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold mb-2">
              Generar Comprobantes de Pago
            </h3>
            <p className="text-muted-foreground">
              Selecciona un paciente para generar su comprobante de pago
            </p>
          </div>
        </div>
      </RoleBasedContent>

      {/* Paciente ve solo sus comprobantes para descargar */}
      <RoleBasedContent roles={['patient']}>
        <div className="space-y-4">
          <div className="text-center p-6 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold mb-2">
              Mis Comprobantes de Pago
            </h3>
            <p className="text-muted-foreground">
              Aquí puedes ver y descargar tus comprobantes de pago generados por la secretaria
            </p>
          </div>
        </div>
      </RoleBasedContent>

      <FinanceTable 
        initialPayments={initialPayments}
        patients={patients}
        doctors={doctors}
        paymentTypes={paymentTypes}
        paymentMethods={paymentMethods}
        showAdminData={canViewFinanceAdmin()}
        showReceiptGeneration={canGenerateReceipts()}
        showReceiptDownload={canDownloadReceipts()}
      />
    </div>
  );
}
