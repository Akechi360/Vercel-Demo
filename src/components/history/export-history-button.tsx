'use client';

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { getPatientMedicalHistoryAsString } from "@/lib/actions";
import type { Patient } from "@/lib/types";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

interface ExportHistoryButtonProps {
    patient: Patient;
}

export function ExportHistoryButton({ patient }: ExportHistoryButtonProps) {
    const { toast } = useToast();

    const handleExport = async () => {
        try {
            const historyString = await getPatientMedicalHistoryAsString(patient.id);
            
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(18);
            doc.setTextColor(58, 109, 255); // Blue color for title
            doc.text("Historial Médico", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });

            // Add export date
            doc.setFontSize(10);
            doc.setTextColor(100); // Gray color
            const exportDate = new Date().toLocaleDateString();
            doc.text(`Exportado el: ${exportDate}`, doc.internal.pageSize.getWidth() - 20, 20, { align: "right" });

            // Add content
            doc.setFontSize(12);
            doc.setTextColor(51, 51, 51); // Dark gray for text
            const lines = doc.splitTextToSize(historyString, 180);
            let y = 40;
            const pageHeight = doc.internal.pageSize.getHeight();
            
            for (let i = 0; i < lines.length; i++) {
                if (y > pageHeight - 20) { // check for page break
                    doc.addPage();
                    y = 20;
                }
                doc.text(lines[i], 15, y);
                y += 7;
            }
            
            const filename = `historial_paciente_${patient.id}.pdf`;
            doc.save(filename);

            toast({
                title: "Exportación completada",
                description: "La descarga del historial ha comenzado.",
            });
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error en la exportación",
                description: "No se pudo generar el archivo del historial.",
            });
            console.error("Failed to export history:", error);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        aria-label="Exportar historial médico"
                        onClick={handleExport}
                    >
                        <Download className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Exportar historial (PDF)</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}