'use client';
import { getProviders } from '@/lib/actions';
import { PageHeader } from '@/components/shared/page-header';
import ProviderListWrapper from '@/components/admin/providers/provider-list-wrapper';
import { useAuth } from '@/components/layout/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldBan } from 'lucide-react';
import React from 'react';
import type { Provider } from '@/lib/types';

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

export default function ProvidersPage() {
  const { can } = useAuth();
  const [initialProviders, setInitialProviders] = React.useState<Provider[] | null>(null);

  React.useEffect(() => {
    if (can('admin:all')) {
        getProviders().then(setInitialProviders);
    }
  }, [can]);

  if (!can('admin:all')) {
    return <DeniedAccess />;
  }

  if (!initialProviders) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Proveedores" />
      <ProviderListWrapper initialProviders={initialProviders} />
    </div>
  );
}