// src/app/(app)/finanzas/nuevo/page.tsx

import { PageHeader } from "@/components/shared/page-header";

export default function NuevoComprobantePage() {
  return (
    <div className="flex flex-col gap-8">
        <PageHeader title="Crear Nuevo Comprobante" backHref="/finanzas" />
        <div className="p-6 border rounded-lg bg-card text-center">
            <h2 className="text-xl font-semibold">En Construcción</h2>
            <p className="mt-2 text-sm text-muted-foreground">
                Aquí irá el formulario para la creación de un nuevo comprobante de pago.
            </p>
        </div>
    </div>
  );
}
