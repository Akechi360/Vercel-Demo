// src/app/(app)/afiliaciones/page.tsx
'use client';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Removed mock data import - now using database
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AffiliationStatCards } from "@/components/affiliations/stat-cards";
import type { Affiliation } from "@/lib/types";
import { useState } from "react";
import AffiliationActions from "@/components/affiliations/affiliation-actions";
import { AddAffiliationDialog } from "@/components/affiliations/add-affiliation-dialog";


export default function AfiliacionesPage() {
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);

  const handleRemoveAffiliation = (id: string) => {
    setAffiliations(prev => prev.filter(item => item.id !== id));
  };

  const handleAddAffiliation = (newAffiliationData: Omit<Affiliation, 'id'>) => {
    const newAffiliation: Affiliation = {
      ...newAffiliationData,
      id: `AF-${String(affiliations.length + 1).padStart(3, '0')}`,
    };
    setAffiliations(prev => [newAffiliation, ...prev]);
  };
  
  return (
    <div className="flex flex-col gap-8">
        <PageHeader 
            title="Afiliaciones"
            actions={
                <AddAffiliationDialog onAddAffiliation={handleAddAffiliation} />
            }
        />
        <AffiliationStatCards affiliations={affiliations} />
        <Card>
            <CardContent className="p-0">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Promotora</TableHead>
                            <TableHead>Afiliados Totales</TableHead>
                            <TableHead>Última Afiliación</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {affiliations.map((item) => (
                            <TableRow key={item.id} className="hover:bg-muted/50 cursor-pointer">
                                <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                <TableCell className="font-medium">{item.promotora}</TableCell>
                                <TableCell>{item.afiliados}</TableCell>
                                <TableCell>{new Date(item.ultimaAfiliacion).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge className={cn(
                                        item.estado === "Activo" 
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700/60"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300 border-gray-200 dark:border-gray-600/60"
                                    )}>
                                        {item.estado}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <AffiliationActions
                                        affiliation={item}
                                        onDelete={() => handleRemoveAffiliation(item.id)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
