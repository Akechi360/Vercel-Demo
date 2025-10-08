'use client';

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AffiliationStatCards } from "@/components/affiliations/stat-cards";
import { useState, useEffect } from "react";
import AffiliationActions from "@/components/affiliations/affiliation-actions";
import { AddAffiliationDialog } from "@/components/affiliations/add-affiliation-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAffiliationStore } from "@/stores/affiliation-store";

interface AfiliacionesPageClientProps {
  initialAffiliations: any[];
}

export function AfiliacionesPageClient({ initialAffiliations }: AfiliacionesPageClientProps) {
  const [affiliations, setAffiliations] = useState(initialAffiliations);
  const { toast } = useToast();
  const router = useRouter();
  const { loadData } = useAffiliationStore();

  // Prefetch silencioso al montar la página
  useEffect(() => {
    console.log('🚀 Starting silent prefetch for affiliation modal data...');
    loadData(); // Carga datos en background sin bloquear UI
  }, [loadData]);

  const handleRemoveAffiliation = (id: string) => {
    setAffiliations(prev => prev.filter(item => item.id !== id));
  };

  const handleAddAffiliation = (newAffiliationData: any) => {
    // Don't add to local state since we'll refresh from server
    // The server data will be fresh after the refresh
  };

  const handleRefreshAffiliations = async () => {
    try {
      // Use Next.js router refresh for better reliability
      router.refresh();
    } catch (error) {
      console.error('Error refreshing affiliations:', error);
      // Fallback to page reload only if router.refresh fails
      window.location.reload();
    }
  };

  
  return (
    <div className="flex flex-col gap-8">
        <PageHeader 
            title="Afiliaciones"
            actions={
                <AddAffiliationDialog 
                    onAddAffiliation={handleAddAffiliation} 
                    onRefresh={handleRefreshAffiliations}
                />
            }
        />
        <AffiliationStatCards affiliations={affiliations} />
        <Card>
            <CardContent className="p-0">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha Inicio</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {affiliations.length > 0 ? (
                            affiliations.map((item) => (
                                <TableRow key={item.id} className="hover:bg-muted/50 cursor-pointer">
                                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                    <TableCell className="font-medium">
                                        {item.company?.nombre || 'Paciente Particular'}
                                    </TableCell>
                                    <TableCell>{item.user?.name || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge className={cn(
                                            item.estado === "ACTIVA" 
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700/60"
                                                : "bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300 border-gray-200 dark:border-gray-600/60"
                                        )}>
                                            {item.estado}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(item.fechaInicio).toLocaleDateString()}</TableCell>
                                    <TableCell>${item.monto}</TableCell>
                                    <TableCell className="text-right">
                                        <AffiliationActions
                                            affiliation={item}
                                            onDelete={() => handleRemoveAffiliation(item.id)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No hay afiliaciones registradas
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
