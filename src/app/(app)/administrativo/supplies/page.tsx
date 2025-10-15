'use client';
import { getSupplies } from '@/lib/actions';
import { PageHeader } from '@/components/shared/page-header';
import SupplyListWrapper from '@/components/admin/supplies/supply-list-wrapper';
import { useAuth } from '@/components/layout/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldBan } from 'lucide-react';
import React from 'react';
import type { Supply } from '@/lib/types';

function DeniedAccess() {
    return (
        <Card>
            <CardContent className="p-10 flex flex-col items-center justify-center gap-4 text-center">
                <ShieldBan className="h-12 w-12 text-destructive" />
                <h3 className="text-xl font-semibold">Acceso Denegado</h3>
                <p className="text-muted-foreground">No tienes permiso para ver esta sección.</p>
            </CardContent>
        </Card>
    )
}


export default function SuppliesPage() {
  const { can } = useAuth();
  const [initialSupplies, setInitialSupplies] = React.useState<Supply[] | null>(null);
  
  React.useEffect(() => {
    if (can('admin:all')) {
        getSupplies().then(setInitialSupplies);
    }
  }, [can]);

  if (!can('admin:all')) {
    return <DeniedAccess />;
  }

  if (!initialSupplies) {
    return <div>Cargando...</div>;
  }


  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Suministros" />
      <SupplyListWrapper initialSupplies={initialSupplies} />
    </div>
  );
}