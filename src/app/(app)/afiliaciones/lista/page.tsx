// src/app/(app)/afiliaciones/lista/page.tsx

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function AfiliacionesListaPage() {
  return (
    <div className="flex flex-col gap-8">
        <PageHeader title="Lista de Afiliaciones" backHref="/afiliaciones" />
        <Card>
            <CardContent className="p-10 text-center">
                <h2 className="text-xl font-semibold">En Construcción</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Aquí se mostrará la lista de afiliaciones y se implementarán las herramientas de gestión.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
