// src/app/(app)/finanzas/nuevo/page.tsx

import { PageHeader } from "@/components/shared/page-header";
import { CreateReceiptForm } from "@/components/finance/create-receipt-form";
import { getPatients } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NuevoComprobanteClient } from "./nuevo-comprobante-client";

export const metadata = {
  title: "Crear Comprobante — UroVital",
};

export default async function NuevoComprobantePage() {
  const patients = await getPatients();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Crear Nuevo Comprobante" backHref="/finanzas" />
      
      <Card>
        <CardHeader>
          <CardTitle>Información del Comprobante</CardTitle>
        </CardHeader>
        <CardContent>
          <NuevoComprobanteClient patients={patients} />
        </CardContent>
      </Card>
    </div>
  );
}
