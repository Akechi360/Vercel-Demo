'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Company, Patient, Report } from '@/lib/types';
import { Badge } from '../ui/badge';
import { FileDown, Paperclip, Calendar, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { getCompanyById, getPatientById } from '@/lib/actions';

interface ReportDetailModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  report: Report;
}

export function ReportDetailModal({ isOpen, setIsOpen, report }: ReportDetailModalProps) {
  const { toast } = useToast();

  const handleExport = async () => {
    try {
        const patient = await getPatientById(report.patientId);
        if (!patient) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo cargar la información del paciente para exportar.'
            });
            return;
        }
        
        let company: Company | undefined;
        if (patient.companyId) {
            company = await getCompanyById(patient.companyId);
        }

        const doc = new jsPDF();
        const margin = 14;
        const exportDate = new Date();

        // Título y fecha
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("Informe Médico", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150);
        doc.text(`Generado el: ${format(exportDate, 'dd/MM/yyyy')}`, doc.internal.pageSize.getWidth() - margin, 20, { align: "right" });

        let y = 35;

        // Datos del Paciente
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40);
        doc.text("Información del Paciente", margin, y);
        y += 8;

         autoTable(doc, {
            startY: y,
            theme: 'plain',
            body: [
                ['Nombre:', patient.name],
                ['Edad:', `${patient.age} años`],
                ['Género:', patient.gender],
                ['Empresa:', company?.name || 'Paciente Particular'],
            ],
             styles: {
                cellPadding: { top: 1, right: 0, bottom: 1, left: 0 },
                fontSize: 11
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 40 },
                1: { fontStyle: 'normal' },
            }
        });
        y = (doc as any).lastAutoTable.finalY + 10;

        // Detalles del Informe
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Detalles del Informe", margin, y);
        y+= 8;

        autoTable(doc, {
            startY: y,
            theme: 'plain',
            body: [
                ['Título:', report.title],
                ['Tipo:', report.type],
                ['Fecha:', format(new Date(report.date), 'dd/MM/yyyy')],
            ],
             styles: {
                cellPadding: { top: 1, right: 0, bottom: 1, left: 0 },
                fontSize: 11
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 40 },
                1: { fontStyle: 'normal' },
            }
        });
        y = (doc as any).lastAutoTable.finalY + 10;
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Observaciones", margin, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const notesLines = doc.splitTextToSize(report.notes, doc.internal.pageSize.getWidth() - (margin * 2));
        doc.text(notesLines, margin, y);
        y += notesLines.length * 5 + 10;

        if (report.attachments && report.attachments.length > 0) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Archivos Adjuntos:", margin, y);
            y += 6;
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            report.attachments.forEach(file => {
                doc.text(`- ${file}`, margin, y);
                y += 5;
            });
        }

        const signatureY = doc.internal.pageSize.getHeight() - 40;
        doc.line(60, signatureY, doc.internal.pageSize.getWidth() - 60, signatureY);
        doc.setFontSize(10);
        doc.text("Firma y Sello del Médico", doc.internal.pageSize.getWidth() / 2, signatureY + 8, { align: 'center' });

        const dateString = new Date(report.date).toISOString().slice(0,10);
        const filename = `informe_${report.id}_${dateString}.pdf`;
        doc.save(filename);

        toast({
            title: "Exportando Informe",
            description: `Se ha iniciado la descarga del informe: ${report.title}.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error en la exportación",
            description: "No se pudo generar el archivo del informe.",
        });
        console.error("Failed to export report:", error);
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{report.title}</DialogTitle>
          <div className="flex items-center gap-4 pt-1 text-sm text-muted-foreground">
            <Badge variant="secondary">{report.type}</Badge>
            <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4'/>
                {new Date(report.date).toLocaleDateString()}
            </div>
          </div>
        </DialogHeader>
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
            <div className='space-y-2'>
                <h3 className='font-semibold'>Notas del Informe</h3>
                <p className="text-muted-foreground text-sm">{report.notes}</p>
            </div>
            {report.attachments && report.attachments.length > 0 && (
                <div className='space-y-2'>
                    <h3 className='font-semibold flex items-center gap-2'><Paperclip className='h-4 w-4'/> Adjuntos</h3>
                    <div className="flex flex-col gap-2">
                        {report.attachments.map((att, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                                <FileText className='h-4 w-4 text-muted-foreground' />
                                <span className='truncate'>{att}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cerrar</Button>
          <Button onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar como PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
