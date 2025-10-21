'use client';

import { CreateReceiptForm } from "@/components/finance/create-receipt-form";
import { usePermissions } from "@/hooks/use-permissions";
import { ShieldBan } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Patient } from "@/lib/types";
import { useRouter } from "next/navigation";

interface NuevoComprobanteClientProps {
  patients: Patient[];
}

function DeniedAccess() {
  return (
    <Card>
      <CardContent className="p-6 text-center flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <ShieldBan className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-xl font-semibold text-destructive">Acceso Denegado</h3>
        <p className="text-muted-foreground mt-2">
          No tienes permisos para crear comprobantes.
        </p>
      </CardContent>
    </Card>
  );
}

export function NuevoComprobanteClient({ patients }: NuevoComprobanteClientProps) {
  const { canGenerateReceipts } = usePermissions();
  const router = useRouter();

  if (!canGenerateReceipts()) {
    return <DeniedAccess />;
  }

  const handleSuccess = () => {
    router.push('/finanzas');
  };

  return (
    <CreateReceiptForm 
      patients={patients} 
      onSuccess={handleSuccess} 
    />
  );
}
