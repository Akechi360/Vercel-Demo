'use client';

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AffiliationStatCards } from "@/components/affiliations/stat-cards";
import { useState } from "react";
import AffiliationActions from "@/components/affiliations/affiliation-actions";
import { AddAffiliationDialog } from "@/components/affiliations/add-affiliation-dialog";
import { createTestAffiliation } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

interface AfiliacionesPageClientProps {
  initialAffiliations: any[];
}

export function AfiliacionesPageClient({ initialAffiliations }: AfiliacionesPageClientProps) {
  const [affiliations, setAffiliations] = useState(initialAffiliations);
  const { toast } = useToast();

  const handleRemoveAffiliation = (id: string) => {
    setAffiliations(prev => prev.filter(item => item.id !== id));
  };

  const handleAddAffiliation = (newAffiliationData: any) => {
    const newAffiliation = {
      ...newAffiliationData,
      id: `AF-${String(affiliations.length + 1).padStart(3, '0')}`,
    };
    setAffiliations(prev => [newAffiliation, ...prev]);
  };

  const handleRefreshAffiliations = () => {
    // Reload the page to get fresh data from server
    window.location.reload();
  };

  const handleCreateTestAffiliation = async () => {
    try {
      await createTestAffiliation();
      toast({
        title: "Afiliación de prueba creada",
        description: "Se creó una afiliación de prueba en la base de datos.",
      });
      handleRefreshAffiliations();
    } catch (error) {
      console.error('Error creating test affiliation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la afiliación de prueba.",
      });
    }
  };
  
  return (
    <div className="flex flex-col gap-8">
        <PageHeader 
            title="Afiliaciones"
            actions={
                <div className="flex gap-2">
                    <AddAffiliationDialog 
                        onAddAffiliation={handleAddAffiliation} 
                        onRefresh={handleRefreshAffiliations}
                    />
                    <Button 
                        variant="outline" 
                        onClick={handleCreateTestAffiliation}
                        className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    >
                        🧪 Crear Test
                    </Button>
                </div>
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
                                    <TableCell className="font-medium">{item.company?.nombre || 'N/A'}</TableCell>
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
